use std::collections::HashSet;

use crate::collector::Id;
use swc_ecmascript::ast;
use swc_ecmascript::visit::{noop_visit_type, Visit, VisitWith};

macro_rules! id {
	($ident: expr) => {
		($ident.sym.clone(), $ident.span.ctxt())
	};
}

pub fn is_conditional_jsx(
	expr: &ast::BlockStmtOrExpr,
	jsx_functions: &HashSet<Id>,
	immutable_function_cmp: &HashSet<Id>,
) -> bool {
	let mut collector = HasBranches::new(jsx_functions, immutable_function_cmp);
	expr.visit_with(&mut collector);
	collector.conditional
}

pub fn is_conditional_jsx_block(
	expr: &ast::BlockStmt,
	jsx_functions: &HashSet<Id>,
	immutable_function_cmp: &HashSet<Id>,
) -> bool {
	let mut collector = HasBranches::new(jsx_functions, immutable_function_cmp);
	expr.visit_with(&mut collector);
	collector.conditional
}

pub struct HasBranches<'a> {
	under_conditional: i32,
	jsx_functions: &'a HashSet<Id>,
	immutable_function_cmp: &'a HashSet<Id>,
	conditional: bool,
	found_return: bool,
}

impl<'a> HasBranches<'a> {
	const fn new(jsx_functions: &'a HashSet<Id>, immutable_function_cmp: &'a HashSet<Id>) -> Self {
		Self {
			jsx_functions,
			immutable_function_cmp,
			under_conditional: 0,
			conditional: false,
			found_return: false,
		}
	}
}

impl<'a> Visit for HasBranches<'a> {
	noop_visit_type!();

	fn visit_arrow_expr(&mut self, _: &ast::ArrowExpr) {}
	fn visit_fn_expr(&mut self, _: &ast::FnExpr) {}
	fn visit_fn_decl(&mut self, _: &ast::FnDecl) {}

	fn visit_return_stmt(&mut self, node: &ast::ReturnStmt) {
		node.visit_children_with(self);
		self.found_return = true;
	}

	fn visit_for_in_stmt(&mut self, node: &ast::ForInStmt) {
		self.under_conditional += 1;
		node.visit_children_with(self);
		self.under_conditional -= 1;
	}

	fn visit_for_of_stmt(&mut self, node: &ast::ForOfStmt) {
		self.under_conditional += 1;
		node.visit_children_with(self);
		self.under_conditional -= 1;
	}

	fn visit_for_stmt(&mut self, node: &ast::ForStmt) {
		self.under_conditional += 1;
		node.visit_children_with(self);
		self.under_conditional -= 1;
	}

	fn visit_if_stmt(&mut self, node: &ast::IfStmt) {
		self.under_conditional += 1;
		node.visit_children_with(self);
		self.under_conditional -= 1;
	}

	fn visit_while_stmt(&mut self, node: &ast::WhileStmt) {
		self.under_conditional += 1;
		node.visit_children_with(self);
		self.under_conditional -= 1;
	}

	fn visit_do_while_stmt(&mut self, node: &ast::DoWhileStmt) {
		self.under_conditional += 1;
		node.visit_children_with(self);
		self.under_conditional -= 1;
	}

	fn visit_switch_stmt(&mut self, node: &ast::SwitchStmt) {
		self.under_conditional += 1;
		node.visit_children_with(self);
		self.under_conditional -= 1;
	}

	fn visit_cond_expr(&mut self, node: &ast::CondExpr) {
		self.under_conditional += 1;
		node.visit_children_with(self);
		self.under_conditional -= 1;
	}

	fn visit_bin_expr(&mut self, node: &ast::BinExpr) {
		if matches!(
			node.op,
			ast::BinaryOp::LogicalAnd | ast::BinaryOp::LogicalOr | ast::BinaryOp::NullishCoalescing
		) {
			self.under_conditional += 1;
			node.visit_children_with(self);
			self.under_conditional -= 1;
		} else {
			node.visit_children_with(self);
		}
	}

	fn visit_call_expr(&mut self, node: &ast::CallExpr) {
		if self.under_conditional > 0 || self.found_return {
			if let ast::Callee::Expr(box ast::Expr::Ident(ident)) = &node.callee {
				if self.jsx_functions.contains(&id!(ident)) {
					let first_arg = node.args.first();
					if let Some(name) = first_arg {
						if let ast::Expr::Ident(jsx_id) = &*name.expr {
							if !self.immutable_function_cmp.contains(&id!(jsx_id)) {
								self.conditional = true;
							}
						}
					}
				}
			}
		}
		node.visit_children_with(self);
	}
}
