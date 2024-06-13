use std::collections::HashMap;

use crate::collector::{new_ident_from_id, Id};
use std::str;
use swc_common::DUMMY_SP;
use swc_common::{sync::Lrc, SourceMap};
use swc_ecmascript::ast;
use swc_ecmascript::codegen::text_writer::JsWriter;
use swc_ecmascript::transforms::fixer;
use swc_ecmascript::transforms::hygiene::hygiene_with_config;
use swc_ecmascript::{
	utils::private_ident,
	visit::{VisitMut, VisitMutWith},
};

macro_rules! id {
	($ident: expr) => {
		($ident.sym.clone(), $ident.span.ctxt())
	};
}

pub fn convert_inlined_fn(
	mut expr: ast::Expr,
	scoped_idents: Vec<Id>,
	qqhook: &Id,
	accept_call_expr: bool,
	serialize_fn: bool,
) -> (Option<ast::Expr>, bool) {
	let mut identifiers = HashMap::new();
	let params: Vec<ast::Pat> = scoped_idents
		.iter()
		.enumerate()
		.map(|(index, id)| {
			let new_ident = private_ident!(format!("p{}", index));
			identifiers.insert(id.clone(), ast::Expr::Ident(new_ident.clone()));
			ast::Pat::Ident(ast::BindingIdent {
				id: new_ident,
				type_ann: None,
			})
		})
		.collect();

	if matches!(expr, ast::Expr::Arrow(_)) {
		return (None, false);
	}

	// Replace identifier
	let mut replace_identifiers = ReplaceIdentifiers::new(identifiers, accept_call_expr);
	expr.visit_mut_with(&mut replace_identifiers);

	if replace_identifiers.abort {
		return (None, false);
	}

	let rendered_expr = render_expr(&expr);
	if rendered_expr.len() > 150 {
		return (None, false);
	}

	if scoped_idents.is_empty() {
		return (None, true);
	}

	// Generate stringified version
	let rendered_str =
		ast::ExprOrSpread::from(ast::Expr::Lit(ast::Lit::Str(ast::Str::from(rendered_expr))));

	// Wrap around arrow functions
	let expr = ast::Expr::Arrow(ast::ArrowExpr {
		body: Box::new(ast::BlockStmtOrExpr::Expr(Box::new(expr))),
		is_async: false,
		is_generator: false,
		params,
		return_type: None,
		span: DUMMY_SP,
		type_params: None,
	});

	let mut args = vec![
		ast::ExprOrSpread::from(expr),
		ast::ExprOrSpread::from(ast::Expr::Array(ast::ArrayLit {
			span: DUMMY_SP,
			elems: scoped_idents
				.iter()
				.map(|id| {
					Some(ast::ExprOrSpread::from(ast::Expr::Ident(
						new_ident_from_id(id),
					)))
				})
				.collect(),
		})),
	];

	if serialize_fn {
		args.push(rendered_str)
	}

	(
		Some(ast::Expr::Call(ast::CallExpr {
			span: DUMMY_SP,
			callee: ast::Callee::Expr(Box::new(ast::Expr::Ident(new_ident_from_id(qqhook)))),
			type_args: None,
			args,
		})),
		true,
	)
}

struct ReplaceIdentifiers {
	pub identifiers: HashMap<Id, ast::Expr>,
	pub accept_call_expr: bool,
	pub abort: bool,
}

impl ReplaceIdentifiers {
	const fn new(identifiers: HashMap<Id, ast::Expr>, accept_call_expr: bool) -> Self {
		Self {
			identifiers,
			accept_call_expr,
			abort: false,
		}
	}
}

impl VisitMut for ReplaceIdentifiers {
	fn visit_mut_expr(&mut self, node: &mut ast::Expr) {
		match node {
			ast::Expr::Ident(ident) => {
				if let Some(expr) = self.identifiers.get(&id!(ident)) {
					*node = expr.clone();
				}
			}
			_ => {
				node.visit_mut_children_with(self);
			}
		}
	}

	fn visit_mut_prop(&mut self, node: &mut ast::Prop) {
		if let ast::Prop::Shorthand(short) = node {
			if let Some(expr) = self.identifiers.get(&id!(short)) {
				*node = ast::Prop::KeyValue(ast::KeyValueProp {
					key: ast::PropName::Ident(short.clone()),
					value: Box::new(expr.clone()),
				});
			}
		}
		node.visit_mut_children_with(self);
	}

	fn visit_mut_callee(&mut self, node: &mut ast::Callee) {
		if !self.accept_call_expr || matches!(node, ast::Callee::Import(_)) {
			self.abort = true;
		} else {
			node.visit_mut_children_with(self);
		}
	}

	fn visit_mut_arrow_expr(&mut self, _: &mut ast::ArrowExpr) {
		self.abort = true;
	}

	fn visit_mut_function(&mut self, _: &mut ast::Function) {
		self.abort = true;
	}

	fn visit_mut_class_expr(&mut self, _: &mut ast::ClassExpr) {
		self.abort = true;
	}

	fn visit_mut_decorator(&mut self, _: &mut ast::Decorator) {
		self.abort = true;
	}

	fn visit_mut_stmt(&mut self, _: &mut ast::Stmt) {
		self.abort = true;
	}
}

pub fn render_expr(expr: &ast::Expr) -> String {
	let mut expr = expr.clone();
	let mut buf = Vec::new();
	let source_map = Lrc::new(SourceMap::default());
	let writer = Box::new(JsWriter::new(Lrc::clone(&source_map), "\n", &mut buf, None));
	let config = swc_ecmascript::codegen::Config::default().with_minify(true);
	let mut emitter = swc_ecmascript::codegen::Emitter {
		cfg: config,
		comments: None,
		cm: Lrc::clone(&source_map),
		wr: writer,
	};
	expr.visit_mut_with(&mut hygiene_with_config(Default::default()));
	expr.visit_mut_with(&mut fixer(None));
	emitter
		.emit_module_item(&ast::ModuleItem::Stmt(ast::Stmt::Expr(ast::ExprStmt {
			span: DUMMY_SP,
			expr: Box::new(expr),
		})))
		.expect("Should emit");

	str::from_utf8(&buf)
		.expect("should be utf8")
		.trim_end_matches(';')
		.to_string()
}
