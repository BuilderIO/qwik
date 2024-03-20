use swc_atoms::JsWord;
use swc_common::DUMMY_SP;
use swc_ecmascript::ast;
use swc_ecmascript::visit::VisitMut;

pub struct StripExportsVisitor<'a> {
	pub filter_symbols: &'a [JsWord],
}

impl<'a> StripExportsVisitor<'a> {
	pub const fn new(filter_symbols: &'a [JsWord]) -> Self {
		Self { filter_symbols }
	}
}

impl<'a> VisitMut for StripExportsVisitor<'a> {
	fn visit_mut_module(&mut self, node: &mut ast::Module) {
		for item in &mut node.body {
			if let ast::ModuleItem::ModuleDecl(ast::ModuleDecl::ExportDecl(decl)) = item {
				match &decl.decl {
					ast::Decl::Var(var) => {
						if var.decls.len() == 1 {
							if let Some(ast::VarDeclarator {
								name: ast::Pat::Ident(ident),
								..
							}) = var.decls.first()
							{
								if self.filter_symbols.contains(&ident.id.sym) {
									*item = empty_module_item(ident.id.clone());
								}
							}
						}
					}
					ast::Decl::Fn(fn_decl) => {
						if self.filter_symbols.contains(&fn_decl.ident.sym) {
							*item = empty_module_item(fn_decl.ident.clone());
						}
					}
					_ => {}
				}
			}
		}
	}
}

fn empty_module_item(ident: ast::Ident) -> ast::ModuleItem {
	ast::ModuleItem::ModuleDecl(ast::ModuleDecl::ExportDecl(ast::ExportDecl {
        span: DUMMY_SP,
        decl: ast::Decl::Var(Box::new(ast::VarDecl {
            span: DUMMY_SP,
            kind: ast::VarDeclKind::Const,
            declare: false,
            decls: vec![ast::VarDeclarator {
                definite: true,
                span: DUMMY_SP,
                name: ast::Pat::Ident(ast::BindingIdent {
                    id: ident,
                    type_ann: None,
                }),
                init: Some(Box::new(ast::Expr::Arrow(ast::ArrowExpr {
                    is_async: false,
                    is_generator: false,
                    params: vec![],
                    return_type: None,
                    span: DUMMY_SP,
                    type_params: None,
                    body: Box::new(ast::BlockStmtOrExpr::BlockStmt(ast::BlockStmt {
                        span: DUMMY_SP,
                        stmts: vec![ast::Stmt::Throw(ast::ThrowStmt {
                            span: DUMMY_SP,
                            arg: Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
                                span: DUMMY_SP,
                                value: JsWord::from("Symbol removed by Qwik Optimizer, it can not be called from current platform"),
                                raw: None,
                            }))),
                        })],
                    })),
                }))),
            }],
        })),
    }))
}
