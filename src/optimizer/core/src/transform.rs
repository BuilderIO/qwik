use std::collections::HashSet;

use lazy_static::lazy_static;
use regex::Regex;
use swc_atoms::JsWord;
use swc_common::comments::{Comments, SingleThreadedComments};
use swc_common::{errors::HANDLER, sync::Lrc, SourceMap, DUMMY_SP};
use swc_ecmascript::ast;
use swc_ecmascript::visit::{noop_fold_type, Fold, FoldWith};

use crate::code_move::fix_path;
use crate::collector::HookCollect;
use crate::entry_strategy::EntryPolicy;
use crate::parse::PathData;

#[derive(Debug)]
pub struct Hook {
    pub entry: Option<String>,
    pub canonical_filename: String,
    pub name: String,
    pub module_index: usize,
    pub expr: ast::CallExpr,
    pub local_decl: Vec<JsWord>,
    pub local_idents: Vec<JsWord>,
    pub origin: String,
}

pub struct TransformContext {
    pub source_map: Lrc<SourceMap>,
    pub hooks_names: HashSet<String>,
    pub bundling_policy: Box<dyn EntryPolicy>,
}

impl TransformContext {
    pub fn new(bundling_policy: Box<dyn EntryPolicy>) -> Self {
        Self {
            hooks_names: HashSet::with_capacity(10),
            source_map: Lrc::new(SourceMap::default()),
            bundling_policy,
        }
    }
}

#[allow(clippy::module_name_repetitions)]
pub struct HookTransform<'a> {
    stack_ctxt: Vec<String>,
    module_item: usize,

    root_sym: Option<String>,
    context: &'a mut TransformContext,
    hooks: &'a mut Vec<Hook>,

    path_data: &'a PathData,

    comments: Option<&'a SingleThreadedComments>,
}

impl<'a> HookTransform<'a> {
    pub fn new(
        context: &'a mut TransformContext,
        path_data: &'a PathData,
        comments: Option<&'a SingleThreadedComments>,
        hooks: &'a mut Vec<Hook>,
    ) -> Self {
        HookTransform {
            path_data,
            stack_ctxt: vec![],
            hooks,
            module_item: 0,
            root_sym: None,
            comments,
            context,
        }
    }

    fn get_context_name(&self) -> String {
        let mut ctx = self.stack_ctxt.join("_");
        if self.stack_ctxt.is_empty() {
            ctx += "_h";
        }
        ctx = escape_sym(&ctx);
        if self.context.hooks_names.contains(&ctx) {
            ctx += &self.hooks.len().to_string();
        }
        ctx
    }

    fn handle_var_decl(&mut self, node: ast::VarDecl) -> ast::VarDecl {
        let mut newdecls = vec![];
        for decl in node.decls {
            match decl.name {
                ast::Pat::Ident(ref ident) => {
                    self.root_sym = Some(ident.id.to_string());
                }
                _ => {
                    self.root_sym = None;
                }
            }
            newdecls.push(decl.fold_with(self));
        }
        ast::VarDecl {
            span: DUMMY_SP,
            kind: node.kind,
            decls: newdecls,
            declare: node.declare,
        }
    }
}

impl<'a> Fold for HookTransform<'a> {
    noop_fold_type!();

    fn fold_module(&mut self, node: ast::Module) -> ast::Module {
        let o = node.fold_children_with(self);
        self.hooks
            .sort_by(|a, b| b.module_index.cmp(&a.module_index));
        o
    }

    fn fold_module_item(&mut self, item: ast::ModuleItem) -> ast::ModuleItem {
        let item = match item {
            ast::ModuleItem::Stmt(ast::Stmt::Decl(ast::Decl::Var(node))) => {
                let transformed = self.handle_var_decl(node);
                ast::ModuleItem::Stmt(ast::Stmt::Decl(ast::Decl::Var(transformed)))
            }
            ast::ModuleItem::ModuleDecl(ast::ModuleDecl::ExportDecl(node)) => match node.decl {
                ast::Decl::Var(var) => {
                    let transformed = self.handle_var_decl(var);
                    ast::ModuleItem::ModuleDecl(ast::ModuleDecl::ExportDecl(ast::ExportDecl {
                        span: DUMMY_SP,
                        decl: ast::Decl::Var(transformed),
                    }))
                }
                ast::Decl::Class(class) => {
                    self.root_sym = Some(class.ident.sym.to_string());
                    ast::ModuleItem::ModuleDecl(ast::ModuleDecl::ExportDecl(ast::ExportDecl {
                        span: DUMMY_SP,
                        decl: ast::Decl::Class(class.fold_with(self)),
                    }))
                }
                ast::Decl::Fn(function) => {
                    self.root_sym = Some(function.ident.sym.to_string());
                    ast::ModuleItem::ModuleDecl(ast::ModuleDecl::ExportDecl(ast::ExportDecl {
                        span: DUMMY_SP,
                        decl: ast::Decl::Fn(function.fold_with(self)),
                    }))
                }
                other => {
                    ast::ModuleItem::ModuleDecl(ast::ModuleDecl::ExportDecl(ast::ExportDecl {
                        span: DUMMY_SP,
                        decl: other.fold_with(self),
                    }))
                }
            },

            item => item.fold_children_with(self),
        };
        self.module_item += 1;
        item
    }

    fn fold_var_declarator(&mut self, node: ast::VarDeclarator) -> ast::VarDeclarator {
        let mut stacked = false;
        if let ast::Pat::Ident(ref ident) = node.name {
            self.stack_ctxt.push(ident.id.sym.to_string());
            stacked = true;
        };
        let o = node.fold_children_with(self);
        if stacked {
            self.stack_ctxt.pop();
        }
        o
    }

    fn fold_fn_decl(&mut self, node: ast::FnDecl) -> ast::FnDecl {
        self.stack_ctxt.push(node.ident.sym.to_string());
        let o = node.fold_children_with(self);
        self.stack_ctxt.pop();

        o
    }

    fn fold_class_decl(&mut self, node: ast::ClassDecl) -> ast::ClassDecl {
        self.stack_ctxt.push(node.ident.sym.to_string());
        let o = node.fold_children_with(self);
        self.stack_ctxt.pop();

        o
    }

    fn fold_jsx_opening_element(&mut self, node: ast::JSXOpeningElement) -> ast::JSXOpeningElement {
        let mut stacked = false;

        if let ast::JSXElementName::Ident(ref ident) = node.name {
            self.stack_ctxt.push(ident.sym.to_string());
            stacked = true;
        }
        let o = node.fold_children_with(self);
        if stacked {
            self.stack_ctxt.pop();
        }
        o
    }

    fn fold_key_value_prop(&mut self, node: ast::KeyValueProp) -> ast::KeyValueProp {
        let mut stacked = false;
        if let ast::PropName::Ident(ref ident) = node.key {
            self.stack_ctxt.push(ident.sym.to_string());
            stacked = true;
        }
        if let ast::PropName::Str(ref s) = node.key {
            self.stack_ctxt.push(s.value.to_string());
            stacked = true;
        }
        let o = node.fold_children_with(self);
        if stacked {
            self.stack_ctxt.pop();
        }
        o
    }

    fn fold_jsx_attr(&mut self, node: ast::JSXAttr) -> ast::JSXAttr {
        let mut stacked = false;
        if let ast::JSXAttrName::Ident(ref ident) = node.name {
            self.stack_ctxt.push(ident.sym.to_string());
            stacked = true;
        }
        let o = node.fold_children_with(self);
        if stacked {
            self.stack_ctxt.pop();
        }
        o
    }

    fn fold_call_expr(&mut self, node: ast::CallExpr) -> ast::CallExpr {
        lazy_static! {
            static ref QHOOK: JsWord = JsWord::from("qHook");
        }
        if let ast::ExprOrSuper::Expr(expr) = &node.callee {
            if let ast::Expr::Ident(id) = &**expr {
                if id.sym == *"qComponent" {
                    if let Some(comments) = self.comments {
                        comments.add_pure_comment(node.span.lo);
                    }
                } else if id.sym == *QHOOK {
                    let mut node = node;
                    let mut symbol_name = self.get_context_name();
                    if let Some(second_arg) = node.args.get(1) {
                        if let ast::Expr::Lit(ast::Lit::Str(ref str)) = *second_arg.expr {
                            if validate_sym(&str.value) {
                                let custom_sym = str.value.to_string();
                                symbol_name = custom_sym;
                            } else {
                                HANDLER.with(|handler| {
                                    handler
                                        .struct_span_err(
                                            str.span,
                                            "Second argument should be the name of a valid identifier",
                                        )
                                        .emit();
                                });
                            }
                        }
                    }
                    let mut canonical_filename =
                        ["h_", &self.path_data.basename, "_", &symbol_name].concat();
                    canonical_filename.make_ascii_lowercase();

                    // Remove last arguments
                    node.args.drain(1..);

                    let folded = node.fold_children_with(self);
                    let hook_collect = HookCollect::new(&folded);
                    let entry = self.context.bundling_policy.get_entry_for_sym(
                        &symbol_name,
                        self.path_data,
                        &self.stack_ctxt,
                        &hook_collect,
                        &folded,
                    );

                    let import_path = fix_path(
                        "a",
                        &self.path_data.path,
                        &format!("./{}", entry.as_ref().unwrap_or(&canonical_filename)),
                    )
                    // TODO: check with manu
                    .unwrap();

                    self.hooks.push(Hook {
                        entry,
                        canonical_filename,
                        name: symbol_name.clone(),
                        module_index: self.module_item,
                        expr: folded,
                        local_decl: hook_collect.get_local_decl(),
                        local_idents: hook_collect.get_local_idents(),
                        origin: self.path_data.path.to_string_lossy().into(),
                    });

                    let node = create_inline_qhook(import_path, &symbol_name);
                    self.context.hooks_names.insert(symbol_name);
                    return node;
                }
            }
        }

        node.fold_children_with(self)
    }
}

fn create_inline_qhook(url: JsWord, symbol: &str) -> ast::CallExpr {
    ast::CallExpr {
        callee: ast::ExprOrSuper::Expr(Box::new(ast::Expr::Ident(ast::Ident::new(
            "qHook".into(),
            DUMMY_SP,
        )))),
        span: DUMMY_SP,
        type_args: None,
        args: vec![
            ast::ExprOrSpread {
                spread: None,
                expr: Box::new(ast::Expr::Arrow(ast::ArrowExpr {
                    is_async: false,
                    is_generator: false,
                    span: DUMMY_SP,
                    params: vec![],
                    return_type: None,
                    type_params: None,
                    body: ast::BlockStmtOrExpr::Expr(Box::new(ast::Expr::Call(ast::CallExpr {
                        callee: ast::ExprOrSuper::Expr(Box::new(ast::Expr::Ident(
                            ast::Ident::new("import".into(), DUMMY_SP),
                        ))),
                        span: DUMMY_SP,
                        type_args: None,
                        args: vec![ast::ExprOrSpread {
                            spread: None,
                            expr: Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
                                span: DUMMY_SP,
                                value: url,
                                has_escape: false,
                                kind: ast::StrKind::Synthesized,
                            }))),
                        }],
                    }))),
                })),
            },
            ast::ExprOrSpread {
                spread: None,
                expr: Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
                    span: DUMMY_SP,
                    value: symbol.into(),
                    has_escape: false,
                    kind: ast::StrKind::Synthesized,
                }))),
            },
        ],
    }
}

fn escape_sym(str: &str) -> String {
    str.chars()
        .map(|x| match x {
            'A'..='Z' | 'a'..='z' | '0'..='9' | '_' => x,
            _ => '_',
        })
        .collect()
}

fn validate_sym(sym: &str) -> bool {
    lazy_static! {
        static ref RE: Regex = Regex::new("^[_a-zA-Z][_a-zA-Z0-9]{0,30}$").unwrap();
    }
    RE.is_match(sym)
}
