use std::collections::HashMap;

use crate::code_move::create_return_stmt;
use crate::collector::{new_ident_from_id, GlobalCollect, Id};
use crate::is_immutable::is_immutable_expr;
use crate::words::*;
use swc_atoms::JsWord;
use swc_common::DUMMY_SP;
use swc_ecmascript::ast;
use swc_ecmascript::utils::private_ident;
use swc_ecmascript::visit::{VisitMut, VisitMutWith};

struct PropsDestructuring<'a> {
	component_ident: Option<Id>,
	pub identifiers: HashMap<Id, ast::Expr>,
	pub global_collect: &'a mut GlobalCollect,
	pub core_module: &'a JsWord,
}

pub fn transform_props_destructuring(
	main_module: &mut ast::Module,
	global_collect: &mut GlobalCollect,
	core_module: &JsWord,
) {
	main_module.visit_mut_with(&mut PropsDestructuring {
		component_ident: global_collect.get_imported_local(&COMPONENT, core_module),
		identifiers: HashMap::new(),
		global_collect,
		core_module,
	});
}

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

enum TransformInit {
	Keep,
	Remove,
	Replace(ast::Expr),
}

impl<'a> PropsDestructuring<'a> {
	fn transform_component_props(&mut self, arrow: &mut ast::ArrowExpr) {
		if let Some(ast::Pat::Object(obj)) = arrow.params.first() {
			let new_ident = private_ident!("props");
			if let Some((rest_id, local)) =
				transform_pat(ast::Expr::Ident(new_ident.clone()), &obj, self)
			{
				if let Some(rest_id) = rest_id {
					let omit_fn = self.global_collect.import(&_REST_PROPS, self.core_module);
					let omit = local.iter().map(|(_, id, _)| id.clone()).collect();
					transform_rest(
						arrow,
						&omit_fn,
						&rest_id,
						ast::Expr::Ident(new_ident.clone()),
						omit,
					);
				}
				for (id, _, expr) in local {
					self.identifiers.insert(id, expr);
				}
				arrow.params[0] = ast::Pat::Ident(ast::BindingIdent::from(new_ident));
			}
		}
		if let ast::BlockStmtOrExpr::BlockStmt(body) = &mut *arrow.body {
			self.transform_component_body(body);
		}
	}
	fn transform_component_body(&mut self, body: &mut ast::BlockStmt) {
		let mut inserts = vec![];
		for (index, stmt) in body.stmts.iter_mut().enumerate() {
			if let ast::Stmt::Decl(ast::Decl::Var(var_decl)) = stmt {
				if var_decl.kind == ast::VarDeclKind::Const {
					for decl in var_decl.decls.iter_mut() {
						let convert = match &decl.init {
							Some(box ast::Expr::Lit(lit)) => {
								let new_ident = private_ident!("_unused");
								Some((
									new_ident,
									ast::Expr::Lit(lit.clone()),
									TransformInit::Remove,
								))
							}
							Some(box ast::Expr::Member(member_expr)) => match &member_expr.obj {
								box ast::Expr::Ident(ident) => {
									let new_ident = private_ident!("_unused");
									let expr = self
										.identifiers
										.get(&id!(ident.clone()))
										.cloned()
										.unwrap_or_else(|| ast::Expr::Ident(ident.clone()));

									let mut cloned_prop = member_expr.prop.clone();
									cloned_prop.visit_mut_with(self);
									let new_replace = ast::Expr::Member(ast::MemberExpr {
										obj: Box::new(expr),
										prop: cloned_prop,
										span: member_expr.span,
									});
									Some((new_ident, new_replace, TransformInit::Remove))
								}
								box ast::Expr::Call(call_expr) => {
									if let ast::Callee::Expr(box ast::Expr::Ident(ref ident)) =
										&call_expr.callee
									{
										if ident.sym.starts_with("use") {
											let new_ident =
												private_ident!(ident.sym[3..].to_lowercase());

											let mut cloned_prop = member_expr.prop.clone();
											cloned_prop.visit_mut_with(self);

											let new_replace = ast::Expr::Member(ast::MemberExpr {
												obj: Box::new(ast::Expr::Ident(new_ident.clone())),
												prop: cloned_prop,
												span: DUMMY_SP,
											});
											Some((
												new_ident,
												new_replace,
												TransformInit::Replace(ast::Expr::Call(
													call_expr.clone(),
												)),
											))
										} else {
											None
										}
									} else {
										None
									}
								}
								_ => None,
							},
							Some(box ast::Expr::Ident(ref ident)) => {
								let new_ident = private_ident!("_unused");
								let new_replace = self
									.identifiers
									.get(&id!(ident.clone()))
									.cloned()
									.unwrap_or_else(|| ast::Expr::Ident(ident.clone()));
								Some((new_ident, new_replace, TransformInit::Remove))
							}
							Some(box ast::Expr::Call(call_expr)) => {
								if let ast::Callee::Expr(box ast::Expr::Ident(ref ident)) =
									&call_expr.callee
								{
									if ident.sym.starts_with("use") {
										let new_ident =
											private_ident!(ident.sym[3..].to_lowercase());
										let new_replace = ast::Expr::Ident(new_ident.clone());
										Some((new_ident, new_replace, TransformInit::Keep))
									} else {
										None
									}
								} else {
									None
								}
							}
							_ => None,
						};
						if let Some((replace_pat, new_ref, init)) = convert {
							let keep_ident = matches!(init, TransformInit::Keep);
							let mut transform_init = init;
							match &decl.name {
								ast::Pat::Ident(ident) => {
									if !keep_ident {
										self.identifiers.insert(id!(ident.id.clone()), new_ref);
										decl.name =
											ast::Pat::Ident(ast::BindingIdent::from(replace_pat));
									} else {
										transform_init = TransformInit::Keep;
									}
								}
								ast::Pat::Object(obj_pat) => {
									if let Some((rest_id, local)) =
										transform_pat(new_ref.clone(), obj_pat, self)
									{
										if let Some(rest_id) = rest_id {
											let omit_fn = self
												.global_collect
												.import(&_REST_PROPS, self.core_module);
											let omit =
												local.iter().map(|(_, id, _)| id.clone()).collect();

											let element = create_omit_props(
												&omit_fn, &rest_id, new_ref, omit,
											);
											inserts.push((index + 1 + inserts.len(), element));
										}
										for (id, _, expr) in local {
											self.identifiers.insert(id, expr);
										}
										decl.name =
											ast::Pat::Ident(ast::BindingIdent::from(replace_pat));
									} else {
										transform_init = TransformInit::Keep;
									}
								}
								_ => {
									transform_init = TransformInit::Keep;
								}
							}
							match transform_init {
								TransformInit::Remove => {
									decl.init = None;
								}
								TransformInit::Replace(expr) => {
									decl.init = Some(Box::new(expr));
								}
								TransformInit::Keep => {}
							}
						}
					}
				} else {
					break;
				}
			}
		}

		for (index, stmt) in inserts {
			body.stmts.insert(index, stmt);
		}
	}
}

impl<'a> VisitMut for PropsDestructuring<'a> {
	fn visit_mut_call_expr(&mut self, node: &mut ast::CallExpr) {
		if let ast::Callee::Expr(box ast::Expr::Ident(ref ident)) = &node.callee {
			if id_eq!(ident, &self.component_ident) {
				if let Some(first_arg) = node.args.first_mut() {
					if let ast::Expr::Arrow(arrow) = &mut *first_arg.expr {
						self.transform_component_props(arrow);
					}
				}
			}
		}

		node.visit_mut_children_with(self);
	}

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
}

type TransformPatReturn = (Option<Id>, Vec<(Id, JsWord, ast::Expr)>);
fn transform_pat(
	new_ident: ast::Expr,
	obj: &ast::ObjectPat,
	props_transform: &mut PropsDestructuring,
) -> Option<TransformPatReturn> {
	let mut local = vec![];
	let mut skip = false;
	let mut rest_id = None;
	for prop in &obj.props {
		match prop {
			ast::ObjectPatProp::Assign(ref v) => {
				let access = ast::Expr::Member(ast::MemberExpr {
					obj: Box::new(new_ident.clone()),
					prop: ast::MemberProp::Ident(v.key.clone()),
					span: DUMMY_SP,
				});
				if let Some(value) = &v.value {
					if is_immutable_expr(value.as_ref(), props_transform.global_collect, None) {
						local.push((
							id!(v.key),
							v.key.sym.clone(),
							ast::Expr::Bin(ast::BinExpr {
								span: DUMMY_SP,
								op: ast::BinaryOp::NullishCoalescing,
								left: Box::new(access),
								right: value.clone(),
							}),
						));
					} else {
						skip = true;
					}
				} else {
					local.push((id!(v.key), v.key.sym.clone(), access));
				}
			}
			ast::ObjectPatProp::KeyValue(ref v) => {
				if let ast::PropName::Ident(ref key) = v.key {
					match &v.value {
						box ast::Pat::Ident(ref ident) => {
							let access = ast::Expr::Member(ast::MemberExpr {
								obj: Box::new(new_ident.clone()),
								prop: ast::MemberProp::Ident(key.clone()),
								span: DUMMY_SP,
							});
							local.push((id!(ident), key.sym.clone(), access));
						}
						box ast::Pat::Assign(ast::AssignPat {
							left: box ast::Pat::Ident(ident),
							right: value,
							..
						}) => {
							if is_immutable_expr(
								value.as_ref(),
								props_transform.global_collect,
								None,
							) {
								let access = ast::Expr::Member(ast::MemberExpr {
									obj: Box::new(new_ident.clone()),
									prop: ast::MemberProp::Ident(key.clone()),
									span: DUMMY_SP,
								});
								local.push((
									id!(ident.id),
									key.sym.clone(),
									ast::Expr::Bin(ast::BinExpr {
										span: DUMMY_SP,
										op: ast::BinaryOp::NullishCoalescing,
										left: Box::new(access),
										right: value.clone(),
									}),
								));
							} else {
								skip = true;
							}
						}
						_ => {
							skip = true;
						}
					}
				} else {
					skip = true;
				}
			}
			ast::ObjectPatProp::Rest(ast::RestPat { box arg, .. }) => {
				if let ast::Pat::Ident(ref ident) = arg {
					rest_id = Some(id!(&ident.id));
				} else {
					skip = true;
				}
			}
		}
	}
	if skip || local.is_empty() {
		return None;
	}
	Some((rest_id, local))
}

fn transform_rest(
	arrow: &mut ast::ArrowExpr,
	omit_fn: &Id,
	rest_id: &Id,
	props_expr: ast::Expr,
	omit: Vec<JsWord>,
) {
	let new_stmt = create_omit_props(omit_fn, rest_id, props_expr, omit);
	match &mut arrow.body {
		box ast::BlockStmtOrExpr::BlockStmt(block) => {
			block.stmts.insert(0, new_stmt);
		}
		box ast::BlockStmtOrExpr::Expr(ref expr) => {
			arrow.body = Box::new(ast::BlockStmtOrExpr::BlockStmt(ast::BlockStmt {
				span: DUMMY_SP,
				stmts: vec![new_stmt, create_return_stmt(expr.clone())],
			}));
		}
	}
}

fn create_omit_props(
	omit_fn: &Id,
	rest_id: &Id,
	props_expr: ast::Expr,
	omit: Vec<JsWord>,
) -> ast::Stmt {
	ast::Stmt::Decl(ast::Decl::Var(Box::new(ast::VarDecl {
		span: DUMMY_SP,
		declare: false,
		kind: ast::VarDeclKind::Const,
		decls: vec![ast::VarDeclarator {
			definite: false,
			span: DUMMY_SP,
			init: Some(Box::new(ast::Expr::Call(ast::CallExpr {
				callee: ast::Callee::Expr(Box::new(ast::Expr::Ident(new_ident_from_id(omit_fn)))),
				span: DUMMY_SP,
				type_args: None,
				args: vec![
					ast::ExprOrSpread {
						spread: None,
						expr: Box::new(props_expr),
					},
					ast::ExprOrSpread {
						spread: None,
						expr: Box::new(ast::Expr::Array(ast::ArrayLit {
							span: DUMMY_SP,
							elems: omit
								.into_iter()
								.map(|v| {
									Some(ast::ExprOrSpread {
										spread: None,
										expr: Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
											span: DUMMY_SP,
											value: v,
											raw: None,
										}))),
									})
								})
								.collect(),
						})),
					},
				],
			}))),
			name: ast::Pat::Ident(ast::BindingIdent::from(new_ident_from_id(rest_id))),
		}],
	})))
}
