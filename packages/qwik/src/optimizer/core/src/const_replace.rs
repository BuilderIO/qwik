use crate::collector::{GlobalCollect, Id};
use crate::words::*;
use swc_common::DUMMY_SP;
use swc_ecmascript::ast;
use swc_ecmascript::visit::{VisitMut, VisitMutWith};
pub struct ConstReplacerVisitor {
	pub is_server: bool,
	pub is_dev: bool,
	pub is_server_ident: Option<Id>,
	pub is_browser_ident: Option<Id>,
	pub is_dev_ident: Option<Id>,
}

impl ConstReplacerVisitor {
	pub fn new(is_server: bool, is_dev: bool, global_collector: &GlobalCollect) -> Self {
		Self {
			is_server,
			is_dev,
			is_server_ident: global_collector
				.get_imported_local(&IS_SERVER, &BUILDER_IO_QWIK_BUILD),
			is_browser_ident: global_collector
				.get_imported_local(&IS_BROWSER, &BUILDER_IO_QWIK_BUILD),
			is_dev_ident: global_collector.get_imported_local(&IS_DEV, &BUILDER_IO_QWIK_BUILD),
		}
	}
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

enum ConstVariable {
	IsServer,
	IsBrowser,
	IsDev,
	None,
}
impl VisitMut for ConstReplacerVisitor {
	fn visit_mut_expr(&mut self, node: &mut ast::Expr) {
		let mode = match node {
			ast::Expr::Ident(ref ident) => {
				if id_eq!(ident, &self.is_server_ident) {
					ConstVariable::IsServer
				} else if id_eq!(ident, &self.is_browser_ident) {
					ConstVariable::IsBrowser
				} else if id_eq!(ident, &self.is_dev_ident) {
					ConstVariable::IsDev
				} else {
					ConstVariable::None
				}
			}
			_ => ConstVariable::None,
		};
		match mode {
			ConstVariable::IsServer => {
				*node = ast::Expr::Lit(ast::Lit::Bool(ast::Bool {
					span: DUMMY_SP,
					value: self.is_server,
				}))
			}
			ConstVariable::IsBrowser => {
				*node = ast::Expr::Lit(ast::Lit::Bool(ast::Bool {
					span: DUMMY_SP,
					value: !self.is_server,
				}))
			}
			ConstVariable::IsDev => {
				*node = ast::Expr::Lit(ast::Lit::Bool(ast::Bool {
					span: DUMMY_SP,
					value: self.is_dev,
				}))
			}
			ConstVariable::None => {
				node.visit_mut_children_with(self);
			}
		}
	}
}
