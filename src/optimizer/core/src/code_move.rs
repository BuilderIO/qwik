use crate::collector::{GlobalCollect, ImportKind};
use crate::parse::PathData;
use crate::transform::Hook;

use std::path::Path;
use swc_atoms::JsWord;
use swc_common::DUMMY_SP;
use swc_ecmascript::ast::*;

pub fn new_module(path: &PathData, hook: &Hook, global: &GlobalCollect) -> Module {
    let mut module = Module {
        span: DUMMY_SP,
        body: vec![],
        shebang: None,
    };
    for ident in &hook.local_idents {
        if let Some(import) = global.imports.get(ident) {
            let specifier = match import.kind {
                ImportKind::Named => ImportSpecifier::Named(ImportNamedSpecifier {
                    is_type_only: false,
                    span: DUMMY_SP,
                    imported: if &import.specifier == ident {
                        None
                    } else {
                        Some(Ident::new(import.specifier.clone(), DUMMY_SP))
                    },
                    local: Ident::new(ident.clone(), DUMMY_SP),
                }),
                ImportKind::Default => ImportSpecifier::Default(ImportDefaultSpecifier {
                    span: DUMMY_SP,
                    local: Ident::new(ident.clone(), DUMMY_SP),
                }),
                ImportKind::All => ImportSpecifier::Namespace(ImportStarAsSpecifier {
                    span: DUMMY_SP,
                    local: Ident::new(ident.clone(), DUMMY_SP),
                }),
            };
            module
                .body
                .push(ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
                    span: DUMMY_SP,
                    type_only: false,
                    asserts: None,
                    src: Str {
                        span: DUMMY_SP,
                        value: fix_path(&hook.origin, import.source.as_ref()),
                        kind: StrKind::Synthesized,
                        has_escape: false,
                    },
                    specifiers: vec![specifier],
                })));
        } else if let Some(export) = global.exports.get(ident) {
            module
                .body
                .push(ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
                    span: DUMMY_SP,
                    type_only: false,
                    asserts: None,
                    src: Str {
                        span: DUMMY_SP,
                        value: fix_path(&hook.origin, &format!("./{}", path.file_stem)),
                        kind: StrKind::Synthesized,
                        has_escape: false,
                    },
                    specifiers: vec![ImportSpecifier::Named(ImportNamedSpecifier {
                        is_type_only: false,
                        span: DUMMY_SP,
                        imported: None,
                        local: Ident::new(export.clone(), DUMMY_SP),
                    })],
                })));
        }
    }
    module.body.push(create_named_export(hook));

    module
}

fn fix_path(src: &str, ident: &str) -> JsWord {
    if src.starts_with('/') {
        panic!("hola");
    }
    if ident.starts_with('.') {
        let diff = pathdiff::diff_paths(Path::new(src).parent().unwrap(), Path::new(""));
        println!("{:?}", diff);
        if let Some(diff) = diff {
            let relative = relative_path::RelativePath::from_path(&diff).unwrap();
            let final_path = relative.join(ident).normalize();
            let final_str = final_path.as_str();
            if final_str.starts_with('.') {
                return JsWord::from(final_str);
            } else {
                return JsWord::from(format!("./{}", final_str));
            }
        }
    }
    JsWord::from(ident)
}

fn create_named_export(hook: &Hook) -> ModuleItem {
    ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(ExportDecl {
        span: DUMMY_SP,
        decl: Decl::Var(VarDecl {
            span: DUMMY_SP,
            kind: VarDeclKind::Const,
            declare: false,
            decls: vec![VarDeclarator {
                span: DUMMY_SP,
                definite: false,
                name: Pat::Ident(BindingIdent::from(Ident::new(
                    hook.name.clone().into(),
                    DUMMY_SP,
                ))),
                init: Some(hook.expr.clone()),
            }],
        }),
    }))
}

#[test]
fn test_fix_path() {
    assert_eq!(
        fix_path("src/components.tsx", "./state"),
        JsWord::from("./src/state")
    );

    assert_eq!(
        fix_path("src/path/components.tsx", "./state"),
        JsWord::from("./src/path/state")
    );

    assert_eq!(
        fix_path("src/components.tsx", "../state"),
        JsWord::from("./state")
    );
    assert_eq!(
        fix_path("components.tsx", "./state"),
        JsWord::from("./state")
    );
}
