use crate::collector::GlobalCollect;
use crate::transform::{IdPlusType, IdentType};
use swc_ecmascript::ast;
use swc_ecmascript::visit::{noop_visit_type, Visit};

macro_rules! id {
	($ident: expr) => {
		($ident.sym.clone(), $ident.span.ctxt())
	};
}

pub fn is_immutable_expr(
	expr: &ast::Expr,
	global: &GlobalCollect,
	current_stack: Option<&Vec<IdPlusType>>,
) -> bool {
	let mut collector = ImmutableCollector::new(global, current_stack);
	collector.visit_expr(expr);
	collector.is_immutable
}

pub struct ImmutableCollector<'a> {
	global: &'a GlobalCollect,
	immutable_idents: Option<&'a Vec<IdPlusType>>,

	pub is_immutable: bool,
}

impl<'a> ImmutableCollector<'a> {
	const fn new(global: &'a GlobalCollect, immutable_idents: Option<&'a Vec<IdPlusType>>) -> Self {
		Self {
			global,
			is_immutable: true,
			immutable_idents,
		}
	}
}

// A prop is considered mutable if it:
// - calls a function
// - accesses a member
// - is a variable that is not an import, an export, or in the immutable stack
impl<'a> Visit for ImmutableCollector<'a> {
	noop_visit_type!();

	fn visit_call_expr(&mut self, _: &ast::CallExpr) {
		self.is_immutable = false;
	}

	fn visit_member_expr(&mut self, _: &ast::MemberExpr) {
		self.is_immutable = false;
	}

	fn visit_arrow_expr(&mut self, _: &ast::ArrowExpr) {}

	fn visit_ident(&mut self, ident: &ast::Ident) {
		let id = id!(ident);
		if self.global.imports.contains_key(&id) {
			return;
		}
		if self.global.exports.contains_key(&id) {
			return;
		}
		if let Some(current_stack) = self.immutable_idents {
			if current_stack
				.iter()
				.any(|item| item.1 == IdentType::Var(true) && item.0 == id)
			{
				return;
			}
		}
		self.is_immutable = false;
	}
}
