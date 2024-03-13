use crate::code_move::{fix_path, transform_function_expr};
use crate::collector::{
	collect_from_pat, new_ident_from_id, GlobalCollect, Id, IdentCollector, ImportKind,
};
use crate::entry_strategy::EntryPolicy;
use crate::has_branches::{is_conditional_jsx, is_conditional_jsx_block};
use crate::inlined_fn::{convert_inlined_fn, render_expr};
use crate::is_immutable::is_immutable_expr;
use crate::parse::{EmitMode, PathData};
use crate::words::*;
use crate::{errors, EntryStrategy};
use base64::Engine;
use path_slash::PathExt;
use serde::{Deserialize, Serialize};
use std::collections::hash_map::DefaultHasher;
use std::collections::{BTreeMap, HashMap, HashSet};
use std::fmt::Write as _;
use std::hash::Hash;
use std::hash::Hasher; // import without risk of name clashing
use std::iter;
use std::path::Path;
use std::str;
use swc_atoms::{js_word, JsWord};
use swc_common::comments::{Comments, SingleThreadedComments};
use swc_common::SyntaxContext;
use swc_common::{errors::HANDLER, sync::Lrc, SourceMap, Span, Spanned, DUMMY_SP};
use swc_ecmascript::ast::{self};
use swc_ecmascript::utils::{private_ident, quote_ident, ExprFactory};
use swc_ecmascript::visit::{noop_fold_type, Fold, FoldWith, VisitWith};

macro_rules! id {
	($ident: expr) => {
		($ident.sym.clone(), $ident.span.ctxt())
	};
}

macro_rules! id_eq {
	($ident: expr, $cid: expr) => {
		if let Some(cid) = $cid {
			cid.0 == $ident.sym && cid.1 == $ident.span.ctxt()
		} else {
			false
		}
	};
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum HookKind {
	Function,
	EventHandler,
	JSXProp,
}

#[derive(Debug, Clone)]
pub struct Hook {
	pub entry: Option<JsWord>,
	pub canonical_filename: JsWord,
	pub name: JsWord,
	pub expr: Box<ast::Expr>,
	pub data: HookData,
	pub hash: u64,
	pub span: Span,
}

#[derive(Debug, Clone)]
pub struct HookData {
	pub extension: JsWord,
	pub local_idents: Vec<Id>,
	pub scoped_idents: Vec<Id>,
	pub parent_hook: Option<JsWord>,
	pub ctx_kind: HookKind,
	pub ctx_name: JsWord,
	pub origin: JsWord,
	pub display_name: JsWord,
	pub hash: JsWord,
	pub need_transform: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum IdentType {
	Var(bool),
	Fn,
	Class,
}

pub type IdPlusType = (Id, IdentType);

#[allow(clippy::module_name_repetitions)]
pub struct QwikTransform<'a> {
	pub hooks: Vec<Hook>,
	pub options: QwikTransformOptions<'a>,

	hooks_names: HashMap<String, u32>,
	// extra_top_items: BTreeMap<Id, ast::ModuleItem>,
	extra_bottom_items: BTreeMap<Id, ast::ModuleItem>,
	stack_ctxt: Vec<String>,
	decl_stack: Vec<Vec<IdPlusType>>,
	in_component: bool,
	marker_functions: HashMap<Id, JsWord>,
	jsx_functions: HashSet<Id>,
	immutable_function_cmp: HashSet<Id>,
	qcomponent_fn: Option<Id>,
	qhook_fn: Option<Id>,
	inlined_qrl_fn: Option<Id>,
	sync_qrl_fn: Option<Id>,
	h_fn: Option<Id>,
	fragment_fn: Option<Id>,

	jsx_mutable: bool,

	hook_stack: Vec<JsWord>,
	file_hash: u64,
	jsx_key_counter: u32,
	root_jsx_mode: bool,
}

pub struct QwikTransformOptions<'a> {
	pub path_data: &'a PathData,
	pub entry_policy: &'a dyn EntryPolicy,
	pub extension: JsWord,
	pub core_module: JsWord,
	pub explicit_extensions: bool,
	pub comments: Option<&'a SingleThreadedComments>,
	pub global_collect: GlobalCollect,
	pub scope: Option<&'a String>,
	pub mode: EmitMode,
	pub entry_strategy: EntryStrategy,
	pub reg_ctx_name: Option<&'a [JsWord]>,
	pub strip_ctx_name: Option<&'a [JsWord]>,
	pub strip_event_handlers: bool,
	pub is_server: Option<bool>,
	pub cm: Lrc<SourceMap>,
}

fn convert_qrl_word(id: &JsWord) -> Option<JsWord> {
	let ident_name = id.as_ref();
	let has_signal = ident_name.ends_with(QRL_SUFFIX);
	if has_signal {
		let new_specifier = [&ident_name[0..ident_name.len() - 1], LONG_SUFFIX].concat();
		Some(JsWord::from(new_specifier))
	} else {
		None
	}
}
impl<'a> QwikTransform<'a> {
	pub fn new(options: QwikTransformOptions<'a>) -> Self {
		let mut marker_functions = HashMap::new();
		for (id, import) in options.global_collect.imports.iter() {
			if import.kind == ImportKind::Named && import.specifier.ends_with(QRL_SUFFIX) {
				marker_functions.insert(id.clone(), import.specifier.clone());
			}
		}

		for id in options.global_collect.exports.keys() {
			if id.0.ends_with(QRL_SUFFIX) {
				marker_functions.insert(id.clone(), id.0.clone());
			}
		}

		let mut hasher = DefaultHasher::new();
		let local_file_name = options.path_data.rel_path.to_slash_lossy();
		if let Some(scope) = options.scope {
			hasher.write(scope.as_bytes());
		}
		hasher.write(local_file_name.as_bytes());

		let jsx_functions = options
			.global_collect
			.imports
			.iter()
			.flat_map(|(id, import)| {
				match (
					import.kind,
					import.source.as_ref(),
					import.specifier.as_ref(),
				) {
					(ImportKind::Named, "@builder.io/qwik", "jsx") => Some(id.clone()),
					(ImportKind::Named, "@builder.io/qwik", "jsxs") => Some(id.clone()),
					(ImportKind::Named, "@builder.io/qwik", "jsxDEV") => Some(id.clone()),
					(ImportKind::Named, "@builder.io/qwik/jsx-runtime", _) => Some(id.clone()),
					(ImportKind::Named, "@builder.io/qwik/jsx-dev-runtime", _) => Some(id.clone()),
					_ => None,
				}
			})
			.collect();

		let immutable_function_cmp = options
			.global_collect
			.imports
			.iter()
			.flat_map(|(id, import)| {
				match (
					import.kind,
					import.source.as_ref(),
					import.specifier.as_ref(),
				) {
					(
						ImportKind::Named,
						"@builder.io/qwik/jsx-runtime" | "@builder.io/qwik/jsx-dev-runtime",
						"Fragment",
					) => Some(id.clone()),
					(
						ImportKind::Named,
						"@builder.io/qwik",
						"Fragment" | "RenderOnce" | "HTMLFragment",
					) => Some(id.clone()),
					(ImportKind::Named, "@builder.io/qwik-city", "Link") => Some(id.clone()),
					(_, source, _) => {
						if source.ends_with("?jsx") || source.ends_with(".md") {
							Some(id.clone())
						} else {
							None
						}
					}
				}
			})
			.collect();
		QwikTransform {
			file_hash: hasher.finish(),
			jsx_key_counter: 0,
			stack_ctxt: Vec::with_capacity(16),
			decl_stack: Vec::with_capacity(32),
			in_component: false,
			hooks: Vec::with_capacity(16),
			hook_stack: Vec::with_capacity(16),
			// extra_top_items: BTreeMap::new(),
			extra_bottom_items: BTreeMap::new(),

			hooks_names: HashMap::new(),
			qcomponent_fn: options
				.global_collect
				.get_imported_local(&QCOMPONENT, &options.core_module),
			sync_qrl_fn: options
				.global_collect
				.get_imported_local(&Q_SYNC, &options.core_module),
			qhook_fn: options
				.global_collect
				.get_imported_local(&QHOOK, &options.core_module),
			inlined_qrl_fn: options
				.global_collect
				.get_imported_local(&_INLINED_QRL, &options.core_module),
			h_fn: options
				.global_collect
				.get_imported_local(&H, &options.core_module),
			fragment_fn: options
				.global_collect
				.get_imported_local(&FRAGMENT, &options.core_module),
			marker_functions,
			jsx_functions,
			immutable_function_cmp,
			root_jsx_mode: true,
			jsx_mutable: false,
			options,
		}
	}

	const fn is_inline(&self) -> bool {
		matches!(
			self.options.entry_strategy,
			EntryStrategy::Inline | EntryStrategy::Hoist
		)
	}

	fn is_inside_module(&self) -> bool {
		self.hook_stack.is_empty() || self.is_inline()
	}

	fn get_dev_location(&self, span: Span) -> ast::ExprOrSpread {
		let loc = self.options.cm.lookup_char_pos(span.lo);
		let file_name = self
			.options
			.path_data
			.rel_path
			.to_string_lossy()
			.to_string();
		ast::ExprOrSpread {
			spread: None,
			expr: Box::new(ast::Expr::Object(ast::ObjectLit {
				span: DUMMY_SP,
				props: vec![
					ast::PropOrSpread::Prop(Box::new(ast::Prop::KeyValue(ast::KeyValueProp {
						key: ast::PropName::Ident(quote_ident!("fileName")),
						value: Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
							span: DUMMY_SP,
							raw: None,
							value: file_name.into(),
						}))),
					}))),
					ast::PropOrSpread::Prop(Box::new(ast::Prop::KeyValue(ast::KeyValueProp {
						key: ast::PropName::Ident(quote_ident!("lineNumber")),
						value: loc.line.into(),
					}))),
					ast::PropOrSpread::Prop(Box::new(ast::Prop::KeyValue(ast::KeyValueProp {
						key: ast::PropName::Ident(quote_ident!("columnNumber")),
						value: (loc.col.0 + 1).into(),
					}))),
				],
			})),
		}
	}

	fn register_context_name(
		&mut self,
		custom_symbol: Option<JsWord>,
	) -> (JsWord, JsWord, JsWord, u64) {
		if let Some(custom_symbol) = custom_symbol {
			return (
				custom_symbol.clone(),
				custom_symbol.clone(),
				custom_symbol,
				0,
			);
		}
		let mut display_name = self.stack_ctxt.join("_");
		if self.stack_ctxt.is_empty() {
			display_name += "s_";
		}
		display_name = escape_sym(&display_name);
		let first_char = display_name.chars().next();
		if first_char.map_or(false, |c| c.is_ascii_digit()) {
			display_name = format!("_{}", display_name);
		}
		let index = match self.hooks_names.get_mut(&display_name) {
			Some(count) => {
				*count += 1;
				*count
			}
			None => 0,
		};
		if index == 0 {
			self.hooks_names.insert(display_name.clone(), 0);
		} else {
			write!(display_name, "_{}", index).unwrap();
		}
		let mut hasher = DefaultHasher::new();
		let local_file_name = self.options.path_data.rel_path.to_slash_lossy();
		if let Some(scope) = self.options.scope {
			hasher.write(scope.as_bytes());
		}
		hasher.write(local_file_name.as_bytes());
		hasher.write(display_name.as_bytes());
		let hash = hasher.finish();
		let hash64 = base64(hash);

		let symbol_name = if matches!(self.options.mode, EmitMode::Dev | EmitMode::Lib) {
			format!("{}_{}", display_name, hash64)
		} else {
			format!("s_{}", hash64)
		};
		(
			JsWord::from(symbol_name),
			JsWord::from(display_name),
			JsWord::from(hash64),
			hash,
		)
	}

	fn handle_inlined_qhook(&mut self, mut node: ast::CallExpr) -> ast::CallExpr {
		node.args.reverse();

		let last_stack = self
			.stack_ctxt
			.last()
			.map_or_else(|| QHOOK.clone(), |last| JsWord::from(last.as_str()));

		let ctx_name = if last_stack.ends_with("Qrl") {
			JsWord::from(format!("{}$", last_stack.trim_end_matches("Qrl")))
		} else {
			last_stack
		};
		let ctx_kind = if ctx_name.starts_with("on") {
			HookKind::JSXProp
		} else {
			HookKind::Function
		};
		let first_arg = node
			.args
			.pop()
			.expect("inlinedQrl() should always have the first argument");

		let second_arg = node
			.args
			.pop()
			.expect("inlinedQrl() should always have the second argument");

		let third_arg = node.args.pop();
		let span = first_arg.span();

		let (symbol_name, display_name, hash) = {
			let symbol_name = match *second_arg.expr {
				ast::Expr::Lit(ast::Lit::Str(string)) => string.value,
				_ => panic!("dfd"),
			};
			parse_symbol_name(
				symbol_name,
				matches!(self.options.mode, EmitMode::Dev | EmitMode::Lib),
			)
		};

		self.hook_stack.push(symbol_name.clone());
		let folded = *first_arg.expr.fold_with(self);
		self.hook_stack.pop();

		let scoped_idents = {
			third_arg.map_or_else(Vec::new, |scoped| {
				let list: Vec<Id> = match &*scoped.expr {
					ast::Expr::Array(array) => array
						.elems
						.iter()
						.flat_map(|item| match &*item.as_ref().unwrap().expr {
							ast::Expr::Ident(ident) => Some(id!(ident)),
							_ => None,
						})
						.collect(),
					_ => vec![],
				};
				list
			})
		};
		let local_idents = self.get_local_idents(&folded);
		let hook_data = HookData {
			extension: self.options.extension.clone(),
			local_idents,
			scoped_idents,
			parent_hook: self.hook_stack.last().cloned(),
			ctx_kind,
			ctx_name,
			origin: self.options.path_data.rel_path.to_slash_lossy().into(),
			display_name,
			need_transform: false,
			hash,
		};
		let should_emit = self.should_emit_hook(&hook_data);
		if should_emit {
			for id in &hook_data.local_idents {
				if !self.options.global_collect.exports.contains_key(id)
					&& self.options.global_collect.root.contains_key(id)
				{
					self.ensure_export(id);
				}
			}
		}
		if !should_emit {
			self.create_noop_qrl(&symbol_name, hook_data)
		} else if self.is_inline() {
			let folded = if self.should_reg_hook(&hook_data.ctx_name) {
				ast::Expr::Call(self.create_internal_call(
					&_REG_SYMBOL,
					vec![
						folded,
						ast::Expr::Lit(ast::Lit::Str(ast::Str::from(hook_data.hash.clone()))),
					],
					true,
				))
			} else {
				folded
			};
			self.create_inline_qrl(hook_data, folded, symbol_name, span)
		} else {
			self.create_hook(hook_data, folded, symbol_name, span, 0)
		}
	}

	fn handle_qhook(&mut self, node: ast::CallExpr) -> ast::CallExpr {
		let mut node = node;
		node.args.reverse();

		if let Some(ast::ExprOrSpread {
			expr: first_arg, ..
		}) = node.args.pop()
		{
			let custom_symbol = if let Some(ast::ExprOrSpread {
				expr: second_arg, ..
			}) = node.args.pop()
			{
				if let ast::Expr::Lit(ast::Lit::Str(second_arg)) = *second_arg {
					Some(second_arg.value)
				} else {
					None
				}
			} else {
				None
			};

			self.create_synthetic_qhook(
				*first_arg,
				HookKind::Function,
				QHOOK.clone(),
				custom_symbol,
			)
		} else {
			node
		}
	}

	fn handle_sync_qrl(&mut self, mut node: ast::CallExpr) -> ast::CallExpr {
		if let Some(ast::ExprOrSpread {
			expr: first_arg, ..
		}) = node.args.pop()
		{
			match *first_arg {
				ast::Expr::Arrow(..) | ast::Expr::Fn(..) => {
					let serialize = render_expr(first_arg.as_ref());
					let new_callee = self.ensure_core_import(&_QRL_SYNC);
					ast::CallExpr {
						callee: ast::Callee::Expr(Box::new(ast::Expr::Ident(new_ident_from_id(
							&new_callee,
						)))),
						span: DUMMY_SP,
						type_args: None,
						args: vec![
							ast::ExprOrSpread {
								spread: None,
								expr: first_arg,
							},
							// string serialized version of first argument
							ast::ExprOrSpread {
								spread: None,
								expr: Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
									span: DUMMY_SP,
									value: serialize.into(),
									raw: None,
								}))),
							},
						],
					}
				}
				_ => node,
			}
		} else {
			node
		}
	}

	/** Converts inline expressions into QRLs. Returns (expr?, true) if succeeded. */
	fn create_synthetic_qqhook(
		&mut self,
		first_arg: ast::Expr,
		accept_call_expr: bool,
	) -> (Option<ast::Expr>, bool) {
		// Collect descendent idents
		let descendent_idents = {
			let mut collector = IdentCollector::new();
			first_arg.visit_with(&mut collector);
			collector.get_words()
		};

		let (decl_collect, invalid_decl): (_, Vec<_>) = self
			.decl_stack
			.iter()
			.flat_map(|v| v.iter())
			.cloned()
			.partition(|(_, t)| matches!(t, IdentType::Var(true)));

		let folded = first_arg;

		let mut set: HashSet<Id> = HashSet::new();
		let mut contains_side_effect = false;
		for ident in &descendent_idents {
			if self.options.global_collect.is_global(ident) {
				contains_side_effect = true;
			} else if invalid_decl.iter().any(|entry| entry.0 == *ident) {
				return (None, false);
			} else if decl_collect.iter().any(|entry| entry.0 == *ident) {
				set.insert(ident.clone());
			} else if ident.0.starts_with('$') {
				// TODO: remove, this is a workaround for $localize to work
				return (None, false);
			}
		}
		let mut scoped_idents: Vec<Id> = set.into_iter().collect();

		if contains_side_effect {
			return (None, scoped_idents.is_empty());
		}
		scoped_idents.sort();

		let serialize_fn = matches!(self.options.is_server, None | Some(true));
		let (scoped_idents, _) = compute_scoped_idents(&descendent_idents, &decl_collect);
		let inlined_fn = self.ensure_core_import(&_INLINED_FN);
		convert_inlined_fn(
			folded,
			scoped_idents,
			&inlined_fn,
			accept_call_expr,
			serialize_fn,
		)
	}

	fn create_synthetic_qhook(
		&mut self,
		first_arg: ast::Expr,
		ctx_kind: HookKind,
		ctx_name: JsWord,
		custom_symbol: Option<JsWord>,
	) -> ast::CallExpr {
		self._create_synthetic_qhook(first_arg, ctx_kind, ctx_name, custom_symbol)
			.0
	}

	fn _create_synthetic_qhook(
		&mut self,
		first_arg: ast::Expr,
		ctx_kind: HookKind,
		ctx_name: JsWord,
		custom_symbol: Option<JsWord>,
	) -> (ast::CallExpr, bool) {
		let can_capture = can_capture_scope(&first_arg);
		let first_arg_span = first_arg.span();

		let (symbol_name, display_name, hash, hook_hash) =
			self.register_context_name(custom_symbol);

		// Collect descendent idents
		let descendent_idents = {
			let mut collector = IdentCollector::new();
			first_arg.visit_with(&mut collector);
			collector.get_words()
		};

		let (decl_collect, invalid_decl): (_, Vec<_>) = self
			.decl_stack
			.iter()
			.flat_map(|v| v.iter())
			.cloned()
			.partition(|(_, t)| matches!(t, IdentType::Var(_)));

		self.hook_stack.push(symbol_name.clone());
		let span = first_arg.span();
		let folded = first_arg.fold_with(self);
		self.hook_stack.pop();

		// Collect local idents
		let local_idents = self.get_local_idents(&folded);

		let (mut scoped_idents, immutable) =
			compute_scoped_idents(&descendent_idents, &decl_collect);
		if !can_capture && !scoped_idents.is_empty() {
			HANDLER.with(|handler| {
                let ids: Vec<_> = scoped_idents.iter().map(|id| id.0.as_ref()).collect();
                handler
                    .struct_span_err_with_code(
                        first_arg_span,
                        &format!("Qrl($) scope is not a function, but it's capturing local identifiers: {}", ids.join(", ")),
                        errors::get_diagnostic_id(errors::Error::CanNotCapture),
                    )
                    .emit();
            });
			scoped_idents = vec![];
		}
		let hook_data = HookData {
			extension: self.options.extension.clone(),
			local_idents,
			scoped_idents,
			parent_hook: self.hook_stack.last().cloned(),
			ctx_kind,
			ctx_name,
			origin: self.options.path_data.rel_path.to_slash_lossy().into(),
			display_name,
			need_transform: true,
			hash,
		};
		let should_emit = self.should_emit_hook(&hook_data);
		if should_emit {
			for id in &hook_data.local_idents {
				if !self.options.global_collect.exports.contains_key(id) {
					if self.options.global_collect.root.contains_key(id) {
						self.ensure_export(id);
					}
					if invalid_decl.iter().any(|entry| entry.0 == *id) {
						HANDLER.with(|handler| {
                            handler
                                .struct_err_with_code(
                                    &format!(
                                        "Reference to identifier '{}' can not be used inside a Qrl($) scope because it's a function",
                                        id.0
                                    ),
                                    errors::get_diagnostic_id(errors::Error::FunctionReference),
                                )
                                .emit();
                        });
					}
				}
			}
		}
		if !should_emit {
			(self.create_noop_qrl(&symbol_name, hook_data), immutable)
		} else if self.is_inline() {
			let folded = if !hook_data.scoped_idents.is_empty() {
				let new_local = self.ensure_core_import(&USE_LEXICAL_SCOPE);
				transform_function_expr(folded, &new_local, &hook_data.scoped_idents)
			} else {
				folded
			};
			let folded = if self.should_reg_hook(&hook_data.ctx_name) {
				ast::Expr::Call(self.create_internal_call(
					&_REG_SYMBOL,
					vec![
						folded,
						ast::Expr::Lit(ast::Lit::Str(ast::Str::from(hook_data.hash.clone()))),
					],
					true,
				))
			} else {
				folded
			};
			(
				self.create_inline_qrl(hook_data, folded, symbol_name, span),
				immutable,
			)
		} else {
			(
				self.create_hook(hook_data, folded, symbol_name, span, hook_hash),
				immutable,
			)
		}
	}

	fn get_local_idents(&self, expr: &ast::Expr) -> Vec<Id> {
		let mut collector = IdentCollector::new();
		expr.visit_with(&mut collector);

		let use_h = collector.use_h;
		let use_fragment = collector.use_fragment;

		let mut idents = collector.get_words();
		if use_h {
			if let Some(id) = &self.h_fn {
				idents.push(id.clone());
			}
		}
		if use_fragment {
			if let Some(id) = &self.fragment_fn {
				idents.push(id.clone());
			}
		}
		idents
	}

	fn create_hook(
		&mut self,
		hook_data: HookData,
		expr: ast::Expr,
		symbol_name: JsWord,
		span: Span,
		hook_hash: u64,
	) -> ast::CallExpr {
		let canonical_filename = get_canonical_filename(&symbol_name);

		let entry = self
			.options
			.entry_policy
			.get_entry_for_sym(
				&hook_data.hash,
				self.options.path_data,
				&self.stack_ctxt,
				&hook_data,
			)
			.map(|entry| JsWord::from(escape_sym(entry.as_ref())));

		let mut filename = format!(
			"./{}",
			entry
				.as_ref()
				.map(|e| e.as_ref())
				.unwrap_or(&canonical_filename)
		);
		if self.options.explicit_extensions {
			filename.push('.');
			filename.push_str(&self.options.extension);
		}
		let inside_hook = !self.hook_stack.is_empty();
		let import_path = if inside_hook {
			fix_path("a", "a", &filename)
		} else {
			fix_path(
				&self.options.path_data.base_dir,
				&self.options.path_data.abs_dir,
				&filename,
			)
		}
		.unwrap();

		let o = self.create_qrl(import_path, &symbol_name, &hook_data, &span);
		self.hooks.push(Hook {
			entry,
			span,
			canonical_filename,
			name: symbol_name,
			data: hook_data,
			expr: Box::new(expr),
			hash: hook_hash,
		});
		o
	}

	fn handle_jsx(&mut self, mut node: ast::CallExpr) -> ast::CallExpr {
		let node_type = node.args.remove(0);
		let node_props = node.args.remove(0);
		let (name_token, is_fn, is_text_only) = match &*node_type.expr {
			ast::Expr::Lit(ast::Lit::Str(str)) => {
				self.stack_ctxt.push(str.value.to_string());
				(true, false, is_text_only(&str.value))
			}
			ast::Expr::Ident(ident) => {
				self.stack_ctxt.push(ident.sym.to_string());
				if !self.immutable_function_cmp.contains(&id!(ident)) {
					self.jsx_mutable = true;
				}
				(true, true, false)
			}
			_ => {
				self.jsx_mutable = true;
				(false, true, false)
			}
		};
		let should_emit_key = is_fn || self.root_jsx_mode;
		self.root_jsx_mode = false;

		let (dynamic_props, mutable_props, immutable_props, children, flags) =
			self.handle_jsx_props_obj(node_props, is_fn, is_text_only);

		let key = if node.args.len() == 1 {
			node.args.remove(0)
		} else if should_emit_key {
			let new_key = format!("{}_{}", &base64(self.file_hash)[0..2], self.jsx_key_counter);
			self.jsx_key_counter += 1;
			ast::ExprOrSpread {
				spread: None,
				expr: Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
					span: DUMMY_SP,
					value: new_key.into(),
					raw: None,
				}))),
			}
		} else {
			get_null_arg()
		};

		let (jsx_func, mut args) = if is_fn {
			(
				self.ensure_core_import(&_JSX_C),
				vec![node_type, mutable_props, flags, key],
			)
		} else if dynamic_props {
			(
				self.ensure_core_import(&_JSX_S),
				vec![node_type, mutable_props, immutable_props, flags, key],
			)
		} else {
			(
				self.ensure_core_import(&_JSX_Q),
				vec![
					node_type,
					mutable_props,
					immutable_props,
					children,
					flags,
					key,
				],
			)
		};
		if self.options.mode == EmitMode::Dev {
			args.push(self.get_dev_location(node.span));
		}

		if name_token {
			self.stack_ctxt.pop();
		}
		ast::CallExpr {
			callee: ast::Callee::Expr(Box::new(ast::Expr::Ident(new_ident_from_id(&jsx_func)))),
			args,
			..node
		}
	}

	fn handle_jsx_value(
		&mut self,
		ctx_name: JsWord,
		value: Option<ast::JSXAttrValue>,
	) -> Option<ast::JSXAttrValue> {
		if let Some(ast::JSXAttrValue::JSXExprContainer(container)) = value {
			if let ast::JSXExpr::Expr(expr) = container.expr {
				let is_fn = matches!(*expr, ast::Expr::Arrow(_) | ast::Expr::Fn(_));
				if is_fn {
					Some(ast::JSXAttrValue::JSXExprContainer(ast::JSXExprContainer {
						span: DUMMY_SP,
						expr: ast::JSXExpr::Expr(Box::new(ast::Expr::Call(
							self.create_synthetic_qhook(*expr, HookKind::JSXProp, ctx_name, None),
						))),
					}))
				} else {
					Some(ast::JSXAttrValue::JSXExprContainer(ast::JSXExprContainer {
						span: DUMMY_SP,
						expr: ast::JSXExpr::Expr(expr),
					}))
				}
			} else {
				Some(ast::JSXAttrValue::JSXExprContainer(container))
			}
		} else {
			value
		}
	}

	pub fn ensure_import(&mut self, new_specifier: &JsWord, source: &JsWord) -> Id {
		self.options.global_collect.import(new_specifier, source)
	}

	pub fn ensure_core_import(&mut self, new_specifier: &JsWord) -> Id {
		self.options
			.global_collect
			.import(new_specifier, &self.options.core_module)
	}

	fn ensure_export(&mut self, id: &Id) {
		let exported_name: Option<JsWord> = Some(format!("_auto_{}", id.0).into());
		if self
			.options
			.global_collect
			.add_export(id.clone(), exported_name.clone())
		{
			self.extra_bottom_items
				.insert(id.clone(), create_synthetic_named_export(id, exported_name));
		}
	}

	fn create_qrl(
		&mut self,
		url: JsWord,
		symbol: &str,
		hook_data: &HookData,
		span: &Span,
	) -> ast::CallExpr {
		let mut args = vec![
			ast::Expr::Arrow(ast::ArrowExpr {
				is_async: false,
				is_generator: false,
				span: DUMMY_SP,
				params: vec![],
				return_type: None,
				type_params: None,
				body: Box::new(ast::BlockStmtOrExpr::Expr(Box::new(ast::Expr::Call(
					ast::CallExpr {
						callee: ast::Callee::Expr(Box::new(ast::Expr::Ident(ast::Ident::new(
							js_word!("import"),
							DUMMY_SP,
						)))),
						span: DUMMY_SP,
						type_args: None,
						args: vec![ast::ExprOrSpread {
							spread: None,
							expr: Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
								span: DUMMY_SP,
								value: url,
								raw: None,
							}))),
						}],
					},
				)))),
			}),
			ast::Expr::Lit(ast::Lit::Str(ast::Str {
				span: DUMMY_SP,
				value: symbol.into(),
				raw: None,
			})),
		];
		let fn_callee = if self.options.mode == EmitMode::Dev {
			args.push(get_qrl_dev_obj(
				&self.options.path_data.abs_path,
				hook_data,
				span,
			));
			_QRL_DEV.clone()
		} else {
			_QRL.clone()
		};

		// Injects state
		if !hook_data.scoped_idents.is_empty() {
			args.push(ast::Expr::Array(ast::ArrayLit {
				span: DUMMY_SP,
				elems: hook_data
					.scoped_idents
					.iter()
					.map(|id| {
						Some(ast::ExprOrSpread {
							spread: None,
							expr: Box::new(ast::Expr::Ident(new_ident_from_id(id))),
						})
					})
					.collect(),
			}))
		}

		self.create_internal_call(&fn_callee, args, true)
	}

	fn create_inline_qrl(
		&mut self,
		hook_data: HookData,
		expr: ast::Expr,
		symbol_name: JsWord,
		span: Span,
	) -> ast::CallExpr {
		let should_inline = matches!(self.options.entry_strategy, EntryStrategy::Inline)
			|| matches!(expr, ast::Expr::Ident(_));
		let inlined_expr = if should_inline {
			expr
		} else {
			let new_ident = private_ident!(symbol_name.clone());
			self.hooks.push(Hook {
				entry: None,
				span,
				canonical_filename: get_canonical_filename(&symbol_name),
				name: symbol_name.clone(),
				data: hook_data.clone(),
				expr: Box::new(expr),
				hash: new_ident.span.ctxt().as_u32() as u64,
			});
			ast::Expr::Ident(new_ident)
		};

		let mut args = vec![
			inlined_expr,
			ast::Expr::Lit(ast::Lit::Str(ast::Str {
				span: DUMMY_SP,
				value: symbol_name,
				raw: None,
			})),
		];

		let fn_callee = if self.options.mode == EmitMode::Dev {
			args.push(get_qrl_dev_obj(
				&self.options.path_data.abs_path,
				&hook_data,
				&span,
			));
			_INLINED_QRL_DEV.clone()
		} else {
			_INLINED_QRL.clone()
		};

		// Injects state
		if !hook_data.scoped_idents.is_empty() {
			args.push(ast::Expr::Array(ast::ArrayLit {
				span: DUMMY_SP,
				elems: hook_data
					.scoped_idents
					.iter()
					.map(|id| {
						Some(ast::ExprOrSpread {
							spread: None,
							expr: Box::new(ast::Expr::Ident(new_ident_from_id(id))),
						})
					})
					.collect(),
			}))
		}

		self.create_internal_call(&fn_callee, args, true)
	}

	pub fn create_internal_call(
		&mut self,
		fn_name: &JsWord,
		exprs: Vec<ast::Expr>,
		pure: bool,
	) -> ast::CallExpr {
		let local = self.ensure_core_import(fn_name);
		let span = if pure {
			if let Some(comments) = self.options.comments {
				let span = Span::dummy_with_cmt();
				comments.add_pure_comment(span.lo);
				span
			} else {
				DUMMY_SP
			}
		} else {
			DUMMY_SP
		};
		ast::CallExpr {
			callee: ast::Callee::Expr(Box::new(ast::Expr::Ident(new_ident_from_id(&local)))),
			span,
			type_args: None,
			args: exprs
				.into_iter()
				.map(|expr| ast::ExprOrSpread {
					spread: None,
					expr: Box::new(expr),
				})
				.collect(),
		}
	}

	fn fix_dynamic_import(&self, node: ast::CallExpr) -> ast::CallExpr {
		if let Some(expr_spread) = node.args.first() {
			if let ast::Expr::Lit(ast::Lit::Str(string)) = &*expr_spread.expr {
				let new_value = fix_path(
					&self.options.path_data.abs_dir,
					&self.options.path_data.base_dir,
					string.value.as_ref(),
				)
				.unwrap();

				return ast::CallExpr {
					args: vec![ast::ExprOrSpread {
						spread: None,
						expr: Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
							value: new_value,
							raw: None,
							span: string.span,
						}))),
					}],
					..node
				};
			}
		}
		HANDLER.with(|handler| {
            handler
                .struct_span_err_with_code(
                    node.span,
                    "Dynamic import() inside Qrl($) scope is not a string, relative paths might break",
                    errors::get_diagnostic_id(errors::Error::DynamicImportInsideQhook),
                )
                .emit();
        });
		node
	}

	fn handle_jsx_props_obj(
		&mut self,
		expr: ast::ExprOrSpread,
		is_fn: bool,
		is_text_only: bool,
	) -> (
		bool,
		ast::ExprOrSpread,
		ast::ExprOrSpread,
		ast::ExprOrSpread,
		ast::ExprOrSpread,
	) {
		let (dynamic_props, mut mutable_props, mut immutable_props, children, flags) =
			self.internal_handle_jsx_props_obj(expr, is_fn, is_text_only);

		// For functions, put the immutable props under the "_IMMUTABLE" prop
		if is_fn && !immutable_props.is_empty() {
			mutable_props.push(ast::PropOrSpread::Prop(Box::new(ast::Prop::KeyValue(
				ast::KeyValueProp {
					key: ast::PropName::Computed(ast::ComputedPropName {
						span: DUMMY_SP,
						expr: Box::new(ast::Expr::Ident(new_ident_from_id(
							&self.ensure_core_import(&_IMMUTABLE),
						))),
					}),
					value: Box::new(ast::Expr::Object(ast::ObjectLit {
						props: std::mem::take(&mut immutable_props),
						span: DUMMY_SP,
					})),
				},
			))))
		}

		let mutable = if mutable_props.is_empty() {
			get_null_arg()
		} else {
			self.jsx_mutable = true;
			ast::ExprOrSpread {
				spread: None,
				expr: Box::new(ast::Expr::Object(ast::ObjectLit {
					props: mutable_props,
					span: DUMMY_SP,
				})),
			}
		};
		let immutable_props = if immutable_props.is_empty() {
			get_null_arg()
		} else {
			ast::ExprOrSpread {
				spread: None,
				expr: Box::new(ast::Expr::Object(ast::ObjectLit {
					props: immutable_props,
					span: DUMMY_SP,
				})),
			}
		};

		let children = if let Some(children) = children {
			ast::ExprOrSpread {
				spread: None,
				expr: children,
			}
		} else {
			get_null_arg()
		};

		let flags = ast::ExprOrSpread {
			spread: None,
			expr: Box::new(ast::Expr::Lit(ast::Lit::Num(ast::Number {
				value: flags as f64,
				span: DUMMY_SP,
				raw: None,
			}))),
		};
		(dynamic_props, mutable, immutable_props, children, flags)
	}

	#[allow(clippy::cognitive_complexity)]
	fn internal_handle_jsx_props_obj(
		&mut self,
		expr: ast::ExprOrSpread,
		is_fn: bool,
		is_text_only: bool,
	) -> (
		bool,
		Vec<ast::PropOrSpread>,
		Vec<ast::PropOrSpread>,
		Option<Box<ast::Expr>>,
		u32,
	) {
		match expr {
			ast::ExprOrSpread {
				expr: box ast::Expr::Object(object),
				..
			} => {
				let mut mutable_props = vec![];
				let mut immutable_props = vec![];
				let mut children = None;
				let mut static_listeners = true;
				let mut static_subtree = true;
				let mut event_handlers = vec![];
				let immutable_idents: Vec<_> = self
					.decl_stack
					.iter()
					.flat_map(|v| v.iter())
					.filter(|(_, t)| matches!(t, IdentType::Var(true)))
					.cloned()
					.collect();

				let dynamic_props = object
					.props
					.iter()
					.any(|prop| !matches!(prop, ast::PropOrSpread::Prop(_)));

				for prop in object.props {
					let mut name_token = false;
					match prop {
						ast::PropOrSpread::Prop(box ast::Prop::KeyValue(ref node)) => {
							let key_word = match node.key {
								ast::PropName::Ident(ref ident) => Some(ident.sym.clone()),
								ast::PropName::Str(ref s) => Some(s.value.clone()),
								_ => None,
							};
							if let Some(key_word) = key_word {
								let is_children = key_word == *CHILDREN;
								if !is_children {
									self.stack_ctxt.push(key_word.to_string());
									name_token = true;
								}
								if is_children {
									let prev = self.jsx_mutable;
									self.jsx_mutable = false;
									let folded = node.value.clone();
									let transformed_children = if let Some(new_children) =
										self.convert_children(&folded, &immutable_idents)
									{
										if is_text_only {
											self.jsx_mutable = true;
											folded.fold_with(self)
										} else {
											Box::new(new_children.fold_with(self))
										}
									} else {
										folded.fold_with(self)
									};
									if self.jsx_mutable {
										static_subtree = false;
									} else {
										self.jsx_mutable = prev;
									}
									if is_fn || dynamic_props {
										// self.jsx_mutable = true;
										// static_subtree = false;
										mutable_props.push(ast::PropOrSpread::Prop(Box::new(
											ast::Prop::KeyValue(ast::KeyValueProp {
												key: node.key.clone(),
												value: transformed_children,
											}),
										)));
									} else {
										children = Some(transformed_children);
									}
								} else if !is_fn && key_word.starts_with("bind:") {
									let folded = node.value.clone().fold_with(self);
									let prop_name: JsWord = key_word[5..].into();
									immutable_props.push(ast::PropOrSpread::Prop(Box::new(
										ast::Prop::KeyValue(ast::KeyValueProp {
											key: ast::PropName::Str(ast::Str {
												span: DUMMY_SP,
												value: prop_name.clone(),
												raw: None,
											}),
											value: folded.clone(),
										}),
									)));
									let elm = private_ident!("elm");
									let arrow_fn = ast::Expr::Arrow(ast::ArrowExpr {
										span: DUMMY_SP,
										params: vec![
											ast::Pat::Ident(ast::BindingIdent::from(
												ast::Ident::new("_".into(), DUMMY_SP),
											)),
											ast::Pat::Ident(ast::BindingIdent::from(elm.clone())),
										],
										body: Box::new(ast::BlockStmtOrExpr::Expr(Box::new(
											ast::Expr::Assign(ast::AssignExpr {
												left: ast::AssignTarget::Simple(
													ast::SimpleAssignTarget::Member(
														ast::MemberExpr {
															obj: folded.clone(),
															prop: ast::MemberProp::Ident(
																ast::Ident::new(
																	"value".into(),
																	DUMMY_SP,
																),
															),
															span: DUMMY_SP,
														},
													),
												),
												op: ast::AssignOp::Assign,
												right: Box::new(ast::Expr::Member(
													ast::MemberExpr {
														obj: Box::new(ast::Expr::Ident(elm)),
														prop: ast::MemberProp::Ident(
															ast::Ident::new(prop_name, DUMMY_SP),
														),
														span: DUMMY_SP,
													},
												)),
												span: DUMMY_SP,
											}),
										))),
										is_async: false,
										is_generator: false,
										type_params: None,
										return_type: None,
									});
									let event_handler = JsWord::from(match key_word.as_ref() {
										"bind:value" => "onInput$",
										"bind:checked" => "onInput$",
										_ => "onChange$",
									});
									let (converted_expr, immutable) = self._create_synthetic_qhook(
										arrow_fn,
										HookKind::EventHandler,
										event_handler.clone(),
										None,
									);
									if !immutable {
										static_listeners = false;
									}
									let converted_prop = ast::PropOrSpread::Prop(Box::new(
										ast::Prop::KeyValue(ast::KeyValueProp {
											value: Box::new(ast::Expr::Call(converted_expr)),
											key: ast::PropName::Str(ast::Str {
												span: DUMMY_SP,
												value: event_handler,
												raw: None,
											}),
										}),
									));
									event_handlers.push(converted_prop);
								} else if !is_fn && (key_word == *REF || key_word == *QSLOT) {
									// skip
									mutable_props.push(prop.fold_with(self));
								} else if convert_qrl_word(&key_word).is_some() {
									if matches!(*node.value, ast::Expr::Arrow(_) | ast::Expr::Fn(_))
									{
										let (converted_expr, immutable) = self
											._create_synthetic_qhook(
												*node.value.clone(),
												if is_fn {
													HookKind::JSXProp
												} else {
													HookKind::EventHandler
												},
												key_word.clone(),
												None,
											);

										let converted_prop = ast::PropOrSpread::Prop(Box::new(
											ast::Prop::KeyValue(ast::KeyValueProp {
												value: Box::new(ast::Expr::Call(converted_expr)),
												key: node.key.clone(),
											}),
										));
										if is_fn {
											if immutable {
												immutable_props.push(ast::PropOrSpread::Prop(
													Box::new(ast::Prop::KeyValue(
														ast::KeyValueProp {
															key: node.key.clone(),
															value: Box::new(ast::Expr::Ident(
																new_ident_from_id(
																	&self.ensure_core_import(
																		&_IMMUTABLE,
																	),
																),
															)),
														},
													)),
												));
											}
											mutable_props.push(converted_prop.fold_with(self));
										} else {
											if !immutable {
												static_listeners = false;
											}
											event_handlers.push(converted_prop.fold_with(self));
										}
									} else {
										let immutable_prop = is_immutable_expr(
											&node.value,
											&self.options.global_collect,
											Some(&immutable_idents),
										);
										if !immutable_prop {
											static_listeners = false;
										}

										if is_fn {
											if immutable_prop {
												immutable_props.push(ast::PropOrSpread::Prop(
													Box::new(ast::Prop::KeyValue(
														ast::KeyValueProp {
															key: node.key.clone(),
															value: Box::new(ast::Expr::Ident(
																new_ident_from_id(
																	&self.ensure_core_import(
																		&_IMMUTABLE,
																	),
																),
															)),
														},
													)),
												));
											}
											mutable_props.push(prop.fold_with(self));
										} else {
											event_handlers.push(prop.fold_with(self));
										}
									}
								} else if is_immutable_expr(
									&node.value,
									&self.options.global_collect,
									Some(&immutable_idents),
								) {
									if is_fn || dynamic_props {
										immutable_props.push(ast::PropOrSpread::Prop(Box::new(
											ast::Prop::KeyValue(ast::KeyValueProp {
												key: node.key.clone(),
												value: Box::new(ast::Expr::Ident(
													new_ident_from_id(
														&self.ensure_core_import(&_IMMUTABLE),
													),
												)),
											}),
										)));
										mutable_props.push(prop.fold_with(self));
									} else {
										immutable_props.push(prop.fold_with(self));
									}
								} else if let Some((getter, is_immutable)) =
									self.convert_to_getter(&node.value, is_fn)
								{
									let key = node.key.clone();
									if is_fn || dynamic_props {
										mutable_props.push(ast::PropOrSpread::Prop(Box::new(
											ast::Prop::Getter(ast::GetterProp {
												span: DUMMY_SP,
												type_ann: None,
												key: key.clone(),
												body: Some(ast::BlockStmt {
													span: DUMMY_SP,
													stmts: vec![ast::Stmt::Return(
														ast::ReturnStmt {
															span: DUMMY_SP,
															arg: Some(node.value.clone()),
														},
													)],
												}),
											}),
										)));
									}
									let entry = ast::PropOrSpread::Prop(Box::new(
										ast::Prop::KeyValue(ast::KeyValueProp {
											key,
											value: Box::new(getter),
										}),
									));
									if is_fn || is_immutable {
										immutable_props.push(entry);
									} else {
										mutable_props.push(entry);
									}
								} else {
									mutable_props.push(prop.fold_with(self));
								}
							} else {
								mutable_props.push(prop.fold_with(self));
							}
						}
						prop => {
							static_listeners = false;
							static_subtree = false;
							mutable_props.push(prop.fold_with(self));
						}
					};
					if name_token {
						self.stack_ctxt.pop();
					}
				}
				let mut flags = 0;
				if static_listeners {
					flags |= 1 << 0;
					immutable_props.extend(event_handlers);
				} else {
					mutable_props.extend(event_handlers);
				}

				if static_subtree {
					flags |= 1 << 1;
				}
				(
					dynamic_props,
					mutable_props,
					immutable_props,
					children,
					flags,
				)
			}
			_ => (true, vec![], vec![], None, 0),
		}
	}

	fn convert_children(
		&mut self,
		expr: &ast::Expr,
		immutable_idents: &Vec<IdPlusType>,
	) -> Option<ast::Expr> {
		match expr {
			ast::Expr::Call(call_expr) => {
				match &call_expr.callee {
					ast::Callee::Expr(box ast::Expr::Ident(ident)) => {
						if !self.jsx_functions.contains(&id!(ident)) {
							self.jsx_mutable = true;
						}
					}
					_ => {
						self.jsx_mutable = true;
					}
				};
				None
			}
			ast::Expr::Array(array) => Some(ast::Expr::Array(ast::ArrayLit {
				span: array.span,
				elems: array
					.elems
					.iter()
					.map(|e| {
						if let Some(e) = e {
							if let Some(new) =
								self.convert_to_signal_item(&e.expr, immutable_idents)
							{
								Some(ast::ExprOrSpread {
									spread: e.spread,
									expr: Box::new(new),
								})
							} else {
								Some(e.clone())
							}
						} else {
							None
						}
					})
					.collect(),
			})),
			expr => self.convert_to_signal_item(expr, immutable_idents),
		}
	}

	/* Convert an expression to a QRL or a getter. Returns (expr, isImmutable) */
	fn convert_to_getter(&mut self, expr: &ast::Expr, is_fn: bool) -> Option<(ast::Expr, bool)> {
		let inlined = self.create_synthetic_qqhook(expr.clone(), true);
		if let Some(expr) = inlined.0 {
			return Some((expr, inlined.1));
		}
		if inlined.1 {
			return if is_fn {
				Some((
					ast::Expr::Ident(new_ident_from_id(&self.ensure_core_import(&_IMMUTABLE))),
					true,
				))
			} else {
				Some((expr.clone(), true))
			};
		}
		if let ast::Expr::Member(member) = expr {
			let prop_sym = prop_to_string(&member.prop);
			if let Some(prop_sym) = prop_sym {
				let id = if is_fn {
					self.ensure_core_import(&_WRAP_PROP)
				} else {
					self.ensure_core_import(&_WRAP_SIGNAL)
				};
				return Some((make_wrap(&id, member.obj.clone(), prop_sym), false));
			}
		}
		None
	}

	fn convert_to_signal_item(
		&mut self,
		expr: &ast::Expr,
		immutable_idents: &Vec<IdPlusType>,
	) -> Option<ast::Expr> {
		if let ast::Expr::Call(call_expr) = expr {
			match &call_expr.callee {
				ast::Callee::Expr(box ast::Expr::Ident(ident)) => {
					if !self.jsx_functions.contains(&id!(ident)) {
						self.jsx_mutable = true;
					}
				}
				_ => {
					self.jsx_mutable = true;
				}
			};
			return None;
		}
		if is_immutable_expr(expr, &self.options.global_collect, Some(immutable_idents)) {
			return None;
		}
		let (inlined_expr, immutable) = self.create_synthetic_qqhook(expr.clone(), false);
		if !immutable {
			self.jsx_mutable = true;
		}
		if inlined_expr.is_some() {
			return inlined_expr;
		} else if immutable {
			return None;
		}
		if let ast::Expr::Member(member) = expr {
			let prop_sym = prop_to_string(&member.prop);
			if let Some(prop_sym) = prop_sym {
				let id = self.ensure_core_import(&_WRAP_SIGNAL);
				return Some(make_wrap(&id, member.obj.clone(), prop_sym));
			}
		}
		// let inlined = self.create_synthetic_qqhook(expr.clone(), false);
		// if let Some((expr, _)) = inlined {
		//     return Some(expr);
		// }
		None
	}

	fn should_reg_hook(&self, ctx_name: &str) -> bool {
		if let Some(strip_ctx_name) = self.options.reg_ctx_name {
			if strip_ctx_name
				.iter()
				.any(|v| ctx_name.starts_with(v.as_ref()))
			{
				return true;
			}
		}
		false
	}

	fn should_emit_hook(&self, hook_data: &HookData) -> bool {
		if let Some(strip_ctx_name) = self.options.strip_ctx_name {
			if strip_ctx_name
				.iter()
				.any(|v| hook_data.ctx_name.starts_with(v.as_ref()))
			{
				return false;
			}
		}
		if self.options.strip_event_handlers && hook_data.ctx_kind == HookKind::EventHandler {
			return false;
		}
		true
	}

	fn create_noop_qrl(
		&mut self,
		symbol_name: &swc_atoms::JsWord,
		hook_data: HookData,
	) -> ast::CallExpr {
		let mut args = vec![ast::Expr::Lit(ast::Lit::Str(ast::Str {
			span: DUMMY_SP,
			value: symbol_name.clone(),
			raw: None,
		}))];
		// Injects state
		if !hook_data.scoped_idents.is_empty() {
			args.push(ast::Expr::Array(ast::ArrayLit {
				span: DUMMY_SP,
				elems: hook_data
					.scoped_idents
					.iter()
					.map(|id| {
						Some(ast::ExprOrSpread {
							spread: None,
							expr: Box::new(ast::Expr::Ident(new_ident_from_id(id))),
						})
					})
					.collect(),
			}))
		}
		self.create_internal_call(&_NOOP_QRL, args, true)
	}
}

impl<'a> Fold for QwikTransform<'a> {
	noop_fold_type!();

	fn fold_module(&mut self, node: ast::Module) -> ast::Module {
		let mut body = Vec::with_capacity(node.body.len() + 10);
		let mut module_body = node
			.body
			.into_iter()
			.flat_map(|i| {
				let module_item = i.fold_with(self);
				let output: Vec<_> = if matches!(self.options.entry_strategy, EntryStrategy::Hoist)
				{
					self.hooks
						.drain(..)
						.map(|hook| {
							let id = (hook.name.clone(), SyntaxContext::from_u32(hook.hash as u32));
							ast::ModuleItem::Stmt(ast::Stmt::Decl(ast::Decl::Var(Box::new(
								ast::VarDecl {
									kind: ast::VarDeclKind::Const,
									decls: vec![ast::VarDeclarator {
										name: ast::Pat::Ident(ast::BindingIdent::from(
											new_ident_from_id(&id),
										)),
										init: Some(hook.expr),
										definite: false,
										span: DUMMY_SP,
									}],
									declare: false,
									span: DUMMY_SP,
								},
							))))
						})
						.chain(iter::once(module_item))
						.collect()
				} else {
					vec![module_item]
				};
				output
			})
			.collect();

		body.extend(
			self.options
				.global_collect
				.synthetic
				.iter()
				.map(|(new_local, import)| {
					create_synthetic_named_import(new_local, &import.source)
				}),
		);
		// body.extend(self.extra_top_items.values().cloned());
		body.append(&mut module_body);
		body.extend(self.extra_bottom_items.values().cloned());

		ast::Module { body, ..node }
	}

	// Variable tracking
	fn fold_var_decl(&mut self, node: ast::VarDecl) -> ast::VarDecl {
		if let Some(current_scope) = self.decl_stack.last_mut() {
			for decl in &node.decls {
				let mut identifiers = Vec::with_capacity(node.decls.len() + 2);
				collect_from_pat(&decl.name, &mut identifiers);
				let ident_type = if node.kind == ast::VarDeclKind::Const
					&& matches!(decl.name, ast::Pat::Ident(_))
					&& is_return_static(&decl.init)
				{
					IdentType::Var(true)
				} else {
					IdentType::Var(false)
				};
				current_scope.extend(identifiers.into_iter().map(|(id, _)| (id, ident_type)));
			}
		}
		node.fold_children_with(self)
	}

	fn fold_var_declarator(&mut self, node: ast::VarDeclarator) -> ast::VarDeclarator {
		let mut stacked = false;
		if let ast::Pat::Ident(ref ident) = node.name {
			self.stack_ctxt.push(ident.id.sym.to_string());
			stacked = true;
		}
		let o = node.fold_children_with(self);
		if stacked {
			self.stack_ctxt.pop();
		}
		o
	}

	fn fold_fn_decl(&mut self, node: ast::FnDecl) -> ast::FnDecl {
		if let Some(current_scope) = self.decl_stack.last_mut() {
			current_scope.push((id!(node.ident), IdentType::Fn));
		}
		self.stack_ctxt.push(node.ident.sym.to_string());

		let o = node.fold_children_with(self);
		self.stack_ctxt.pop();
		o
	}

	fn fold_function(&mut self, node: ast::Function) -> ast::Function {
		self.decl_stack.push(vec![]);
		let prev = self.root_jsx_mode;
		self.root_jsx_mode = true;

		let prev_jsx_mutable = self.jsx_mutable;
		self.jsx_mutable = false;

		let is_component = self.in_component;
		self.in_component = false;
		let is_condition = is_conditional_jsx_block(
			node.body.as_ref().unwrap(),
			&self.jsx_functions,
			&self.immutable_function_cmp,
		);
		let current_scope = self
			.decl_stack
			.last_mut()
			.expect("Declaration stack empty!");

		for param in &node.params {
			let mut identifiers = vec![];
			collect_from_pat(&param.pat, &mut identifiers);
			let is_constant = is_component && matches!(param.pat, ast::Pat::Ident(_));
			current_scope.extend(
				identifiers
					.into_iter()
					.map(|(id, _)| (id, IdentType::Var(is_constant))),
			);
		}
		let mut o = node.fold_children_with(self);
		if is_condition {
			if let Some(body) = &mut o.body {
				body.stmts.insert(
					0,
					ast::Stmt::Expr(ast::ExprStmt {
						span: DUMMY_SP,
						expr: Box::new(ast::Expr::Call(self.create_internal_call(
							&_JSX_BRANCH,
							vec![],
							false,
						))),
					}),
				);
			}
		}
		self.root_jsx_mode = prev;
		self.jsx_mutable = prev_jsx_mutable;
		self.decl_stack.pop();

		o
	}

	fn fold_arrow_expr(&mut self, node: ast::ArrowExpr) -> ast::ArrowExpr {
		self.decl_stack.push(vec![]);
		let prev = self.root_jsx_mode;
		self.root_jsx_mode = true;

		let prev_jsx_mutable = self.jsx_mutable;
		self.jsx_mutable = false;

		let is_component = self.in_component;
		self.in_component = false;
		let is_condition = is_conditional_jsx(
			&node.body,
			&self.jsx_functions,
			&self.immutable_function_cmp,
		);
		let current_scope = self
			.decl_stack
			.last_mut()
			.expect("Declaration stack empty!");
		for param in &node.params {
			let mut identifiers = vec![];
			collect_from_pat(param, &mut identifiers);
			let is_constant = is_component && matches!(param, ast::Pat::Ident(_));
			current_scope.extend(
				identifiers
					.into_iter()
					.map(|(id, _)| (id, IdentType::Var(is_constant))),
			);
		}

		let mut o = node.fold_children_with(self);
		if is_condition {
			match &mut o.body {
				box ast::BlockStmtOrExpr::BlockStmt(block) => {
					block.stmts.insert(
						0,
						ast::Stmt::Expr(ast::ExprStmt {
							span: DUMMY_SP,
							expr: Box::new(ast::Expr::Call(self.create_internal_call(
								&_JSX_BRANCH,
								vec![],
								false,
							))),
						}),
					);
				}
				box ast::BlockStmtOrExpr::Expr(expr) => {
					*expr = Box::new(ast::Expr::Call(self.create_internal_call(
						&_JSX_BRANCH,
						vec![*expr.to_owned()],
						true,
					)));
				}
			}
		}
		self.root_jsx_mode = prev;
		self.jsx_mutable = prev_jsx_mutable;
		self.decl_stack.pop();

		o
	}

	fn fold_for_stmt(&mut self, node: ast::ForStmt) -> ast::ForStmt {
		self.decl_stack.push(vec![]);
		let prev = self.root_jsx_mode;
		self.root_jsx_mode = true;
		self.in_component = false;
		let o = node.fold_children_with(self);
		self.root_jsx_mode = prev;
		self.decl_stack.pop();

		o
	}

	fn fold_for_in_stmt(&mut self, node: ast::ForInStmt) -> ast::ForInStmt {
		self.decl_stack.push(vec![]);
		let prev = self.root_jsx_mode;
		self.root_jsx_mode = true;
		self.in_component = false;
		let o = node.fold_children_with(self);
		self.root_jsx_mode = prev;
		self.decl_stack.pop();

		o
	}

	fn fold_for_of_stmt(&mut self, node: ast::ForOfStmt) -> ast::ForOfStmt {
		self.decl_stack.push(vec![]);
		let prev = self.root_jsx_mode;
		self.root_jsx_mode = true;
		let o = node.fold_children_with(self);
		self.root_jsx_mode = prev;
		self.decl_stack.pop();

		o
	}

	fn fold_bin_expr(&mut self, node: ast::BinExpr) -> ast::BinExpr {
		let prev = self.root_jsx_mode;
		self.root_jsx_mode = true;
		let o = node.fold_children_with(self);
		self.root_jsx_mode = prev;
		o
	}

	fn fold_cond_expr(&mut self, node: ast::CondExpr) -> ast::CondExpr {
		let prev = self.root_jsx_mode;
		self.root_jsx_mode = true;
		let o = node.fold_children_with(self);
		self.root_jsx_mode = prev;
		o
	}

	fn fold_if_stmt(&mut self, node: ast::IfStmt) -> ast::IfStmt {
		self.decl_stack.push(vec![]);
		let prev = self.root_jsx_mode;
		self.root_jsx_mode = true;
		self.in_component = false;
		let o = node.fold_children_with(self);
		self.root_jsx_mode = prev;
		self.decl_stack.pop();

		o
	}

	fn fold_block_stmt(&mut self, node: ast::BlockStmt) -> ast::BlockStmt {
		self.decl_stack.push(vec![]);
		let prev = self.root_jsx_mode;
		self.root_jsx_mode = true;
		let o = node.fold_children_with(self);
		self.root_jsx_mode = prev;
		self.decl_stack.pop();

		o
	}

	fn fold_while_stmt(&mut self, node: ast::WhileStmt) -> ast::WhileStmt {
		self.decl_stack.push(vec![]);
		let prev = self.root_jsx_mode;
		self.root_jsx_mode = true;
		self.in_component = false;

		let o = node.fold_children_with(self);
		self.root_jsx_mode = prev;
		self.decl_stack.pop();

		o
	}

	fn fold_class_decl(&mut self, node: ast::ClassDecl) -> ast::ClassDecl {
		if let Some(current_scope) = self.decl_stack.last_mut() {
			current_scope.push((id!(node.ident), IdentType::Class));
		}

		self.stack_ctxt.push(node.ident.sym.to_string());
		self.decl_stack.push(vec![]);
		let prev = self.root_jsx_mode;
		self.root_jsx_mode = true;
		self.in_component = false;
		let o = node.fold_children_with(self);
		self.root_jsx_mode = prev;
		self.stack_ctxt.pop();
		self.decl_stack.pop();

		o
	}

	fn fold_jsx_element(&mut self, node: ast::JSXElement) -> ast::JSXElement {
		let mut stacked = false;

		if let ast::JSXElementName::Ident(ref ident) = node.opening.name {
			self.stack_ctxt.push(ident.sym.to_string());
			stacked = true;
		}
		let o = node.fold_children_with(self);
		if stacked {
			self.stack_ctxt.pop();
		}
		o
	}

	fn fold_export_default_expr(&mut self, node: ast::ExportDefaultExpr) -> ast::ExportDefaultExpr {
		let mut filename = self.options.path_data.file_stem.clone();
		if filename == "index" {
			if let Some(foldername) = self
				.options
				.path_data
				.rel_dir
				.file_name()
				.and_then(|s| s.to_str())
			{
				filename = foldername.to_string();
			}
		}
		self.stack_ctxt.push(filename);
		let o = node.fold_children_with(self);
		self.stack_ctxt.pop();

		o
	}

	fn fold_jsx_attr(&mut self, node: ast::JSXAttr) -> ast::JSXAttr {
		let node = match node.name {
			ast::JSXAttrName::Ident(ref ident) => {
				let new_word = convert_qrl_word(&ident.sym);
				self.stack_ctxt.push(ident.sym.to_string());

				if new_word.is_some() {
					ast::JSXAttr {
						value: self.handle_jsx_value(ident.sym.clone(), node.value),
						..node
					}
				} else {
					node
				}
			}
			ast::JSXAttrName::JSXNamespacedName(ref namespaced) => {
				let new_word = convert_qrl_word(&namespaced.name.sym);
				let ident_name = [
					namespaced.ns.sym.as_ref(),
					"-",
					namespaced.name.sym.as_ref(),
				]
				.concat();
				self.stack_ctxt.push(ident_name.clone());
				if new_word.is_some() {
					ast::JSXAttr {
						value: self.handle_jsx_value(JsWord::from(ident_name), node.value),
						..node
					}
				} else {
					node
				}
			}
		};

		let o = node.fold_children_with(self);
		self.stack_ctxt.pop();
		o
	}

	fn fold_call_expr(&mut self, node: ast::CallExpr) -> ast::CallExpr {
		let mut name_token = false;
		let mut replace_callee = None;
		let mut ctx_name: JsWord = QHOOK.clone();

		match &node.callee {
			ast::Callee::Import(_) => {
				if !self.is_inside_module() {
					return self.fix_dynamic_import(node);
				}
			}
			ast::Callee::Expr(box ast::Expr::Ident(ident)) => {
				if id_eq!(ident, &self.sync_qrl_fn) {
					return self.handle_sync_qrl(node);
				} else if id_eq!(ident, &self.qhook_fn) {
					if let Some(comments) = self.options.comments {
						comments.add_pure_comment(ident.span.lo);
					}
					return self.handle_qhook(node);
				} else if self.jsx_functions.contains(&id!(ident)) {
					return self.handle_jsx(node);
				} else if id_eq!(ident, &self.inlined_qrl_fn) {
					return self.handle_inlined_qhook(node);
				} else if let Some(specifier) = self.marker_functions.get(&id!(ident)) {
					self.stack_ctxt.push(ident.sym.to_string());
					ctx_name = specifier.clone();
					name_token = true;

					if id_eq!(ident, &self.qcomponent_fn) {
						self.in_component = true;
						if let Some(comments) = self.options.comments {
							comments.add_pure_comment(node.span.lo);
						}
					}
					let global_collect = &mut self.options.global_collect;
					if let Some(import) = global_collect.imports.get(&id!(ident)).cloned() {
						let new_specifier =
							convert_qrl_word(&import.specifier).expect("Specifier ends with $");
						let new_local = self.ensure_import(&new_specifier, &import.source);
						replace_callee = Some(new_ident_from_id(&new_local).as_callee());
					} else {
						let new_specifier =
							convert_qrl_word(&ident.sym).expect("Specifier ends with $");
						global_collect
                            .exports
                            .keys()
                            .find(|id| id.0 == new_specifier)
                            .map_or_else(
                                || {
                                    HANDLER.with(|handler| {
                                        handler
                                            .struct_span_err_with_code(
                                                ident.span,
                                                &format!("Found '{}' but did not find the corresponding '{}' exported in the same file. Please check that it is exported and spelled correctly", &ident.sym, &new_specifier),
                                                errors::get_diagnostic_id(errors::Error::MissingQrlImplementation),
                                            )
                                            .emit();
                                    });
                                },
                                |new_local| {
                                    replace_callee = Some(new_ident_from_id(new_local).as_callee());
                                },
                            );
					}
				} else {
					self.stack_ctxt.push(ident.sym.to_string());
					name_token = true;
				}
			}
			_ => {}
		}

		let convert_qrl = replace_callee.is_some();
		let callee = if let Some(callee) = replace_callee {
			callee
		} else {
			node.callee
		};
		let callee = callee.fold_with(self);
		let args: Vec<ast::ExprOrSpread> = node
			.args
			.into_iter()
			.enumerate()
			.map(|(i, arg)| {
				if convert_qrl && i == 0 {
					ast::ExprOrSpread {
						expr: Box::new(ast::Expr::Call(self.create_synthetic_qhook(
							*arg.expr,
							HookKind::Function,
							ctx_name.clone(),
							None,
						)))
						.fold_with(self),
						..arg
					}
				} else {
					arg.fold_with(self)
				}
			})
			.collect();

		if name_token {
			self.stack_ctxt.pop();
		}
		self.in_component = false;
		ast::CallExpr {
			callee,
			args,
			..node
		}
	}
}

pub fn add_handle_watch(body: &mut Vec<ast::ModuleItem>, core_module: &JsWord) {
	body.push(ast::ModuleItem::ModuleDecl(ast::ModuleDecl::ExportNamed(
		ast::NamedExport {
			src: Some(Box::new(ast::Str {
				span: DUMMY_SP,
				value: core_module.clone(),
				raw: None,
			})),
			span: DUMMY_SP,
			with: None,
			type_only: false,
			specifiers: vec![ast::ExportSpecifier::Named(ast::ExportNamedSpecifier {
				orig: ast::ModuleExportName::Ident(ast::Ident::new(HANDLE_WATCH.clone(), DUMMY_SP)),
				exported: None,
				is_type_only: false,
				span: DUMMY_SP,
			})],
		},
	)));
}

pub fn create_synthetic_named_export(local: &Id, exported: Option<JsWord>) -> ast::ModuleItem {
	ast::ModuleItem::ModuleDecl(ast::ModuleDecl::ExportNamed(ast::NamedExport {
		span: DUMMY_SP,
		type_only: false,
		with: None,
		specifiers: vec![ast::ExportSpecifier::Named(ast::ExportNamedSpecifier {
			span: DUMMY_SP,
			is_type_only: false,
			orig: ast::ModuleExportName::Ident(new_ident_from_id(local)),
			exported: exported
				.map(|name| ast::ModuleExportName::Ident(ast::Ident::new(name, DUMMY_SP))),
		})],
		src: None,
	}))
}

pub fn create_synthetic_named_import(local: &Id, src: &JsWord) -> ast::ModuleItem {
	ast::ModuleItem::ModuleDecl(ast::ModuleDecl::Import(ast::ImportDecl {
		phase: Default::default(),
		span: DUMMY_SP,
		src: Box::new(ast::Str {
			span: DUMMY_SP,
			value: src.clone(),
			raw: None,
		}),
		with: None,
		type_only: false,
		specifiers: vec![ast::ImportSpecifier::Named(ast::ImportNamedSpecifier {
			is_type_only: false,
			span: DUMMY_SP,
			local: new_ident_from_id(local),
			imported: None,
		})],
	}))
}

fn escape_sym(str: &str) -> String {
	str.chars()
		.flat_map(|x| match x {
			'A'..='Z' | 'a'..='z' | '0'..='9' | '_' => Some(x),
			'$' => None,
			_ => Some('_'),
		})
		.collect()
}

const fn can_capture_scope(expr: &ast::Expr) -> bool {
	matches!(expr, &ast::Expr::Fn(_) | &ast::Expr::Arrow(_))
}

fn base64(nu: u64) -> String {
	base64::engine::general_purpose::URL_SAFE_NO_PAD
		.encode(nu.to_le_bytes())
		.replace(['-', '_'], "0")
}

fn compute_scoped_idents(all_idents: &[Id], all_decl: &[IdPlusType]) -> (Vec<Id>, bool) {
	let mut set: HashSet<Id> = HashSet::new();
	let mut immutable = true;
	for ident in all_idents {
		if let Some(item) = all_decl.iter().find(|item| item.0 == *ident) {
			set.insert(ident.clone());
			if !matches!(item.1, IdentType::Var(true)) {
				immutable = false;
			}
		}
	}
	let mut output: Vec<Id> = set.into_iter().collect();
	output.sort();
	(output, immutable)
}

fn get_canonical_filename(symbol_name: &JsWord) -> JsWord {
	JsWord::from(symbol_name.as_ref().to_ascii_lowercase())
}

fn parse_symbol_name(symbol_name: JsWord, dev: bool) -> (JsWord, JsWord, JsWord) {
	let mut splitter = symbol_name.rsplitn(2, '_');
	let hash = splitter
		.next()
		.expect("symbol_name always need to have a segment");
	let display_name = splitter.next().unwrap_or(hash);

	let s_n = if dev {
		symbol_name.clone()
	} else {
		JsWord::from(format!("s_{}", hash))
	};
	(s_n, display_name.into(), hash.into())
}

fn get_qrl_dev_obj(asb_path: &Path, hook: &HookData, span: &Span) -> ast::Expr {
	ast::Expr::Object(ast::ObjectLit {
		span: DUMMY_SP,
		props: vec![
			ast::PropOrSpread::Prop(Box::new(ast::Prop::KeyValue(ast::KeyValueProp {
				key: ast::PropName::Ident(ast::Ident::new(js_word!("file"), DUMMY_SP)),
				value: Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
					span: DUMMY_SP,
					value: asb_path.to_str().unwrap().into(),
					raw: None,
				}))),
			}))),
			ast::PropOrSpread::Prop(Box::new(ast::Prop::KeyValue(ast::KeyValueProp {
				key: ast::PropName::Ident(ast::Ident::new(JsWord::from("lo"), DUMMY_SP)),
				value: Box::new(ast::Expr::Lit(ast::Lit::Num(ast::Number {
					span: DUMMY_SP,
					value: span.lo().0 as f64,
					raw: None,
				}))),
			}))),
			ast::PropOrSpread::Prop(Box::new(ast::Prop::KeyValue(ast::KeyValueProp {
				key: ast::PropName::Ident(ast::Ident::new(JsWord::from("hi"), DUMMY_SP)),
				value: Box::new(ast::Expr::Lit(ast::Lit::Num(ast::Number {
					span: DUMMY_SP,
					value: span.hi().0 as f64,
					raw: None,
				}))),
			}))),
			ast::PropOrSpread::Prop(Box::new(ast::Prop::KeyValue(ast::KeyValueProp {
				key: ast::PropName::Ident(ast::Ident::new(JsWord::from("displayName"), DUMMY_SP)),
				value: Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
					span: DUMMY_SP,
					value: hook.display_name.clone(),
					raw: None,
				}))),
			}))),
		],
	})
}

fn prop_to_string(prop: &ast::MemberProp) -> Option<JsWord> {
	match prop {
		ast::MemberProp::Ident(ident) => Some(ident.sym.clone()),
		ast::MemberProp::Computed(ast::ComputedPropName {
			expr: box ast::Expr::Lit(ast::Lit::Str(str)),
			..
		}) => Some(str.value.clone()),
		_ => None,
	}
}

fn is_return_static(expr: &Option<Box<ast::Expr>>) -> bool {
	match expr {
		Some(box ast::Expr::Call(ast::CallExpr {
			callee: ast::Callee::Expr(box ast::Expr::Ident(ident)),
			..
		})) => ident.sym.ends_with('$') || ident.sym.ends_with("Qrl") || ident.sym.starts_with("use"),
		Some(_) => false,
		None => true,
	}
}

fn make_wrap(method: &Id, obj: Box<ast::Expr>, prop: JsWord) -> ast::Expr {
	ast::Expr::Call(ast::CallExpr {
		callee: ast::Callee::Expr(Box::new(ast::Expr::Ident(new_ident_from_id(method)))),
		args: vec![
			ast::ExprOrSpread::from(obj),
			ast::ExprOrSpread::from(Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str::from(
				prop,
			))))),
		],
		span: DUMMY_SP,
		type_args: None,
	})
}

fn get_null_arg() -> ast::ExprOrSpread {
	ast::ExprOrSpread {
		spread: None,
		expr: Box::new(ast::Expr::Lit(ast::Lit::Null(ast::Null { span: DUMMY_SP }))),
	}
}

fn is_text_only(node: &str) -> bool {
	matches!(
		node,
		"text" | "textarea" | "title" | "option" | "script" | "style" | "noscript"
	)
}
