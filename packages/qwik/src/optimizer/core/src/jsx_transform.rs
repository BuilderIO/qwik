use crate::transform::create_internal_call;
use crate::words::*;

use swc_atoms::JsWord;
use swc_common::DUMMY_SP;
use swc_ecmascript::ast;
use swc_ecmascript::visit::{fold_expr, noop_fold_type, Fold, FoldWith};

macro_rules! id {
    ($ident: expr) => {
        ($ident.sym.clone(), $ident.span.ctxt())
    };
}

enum Stack {
    Str(String),
    Expr(ast::Expr),
}

#[allow(clippy::module_name_repetitions)]
pub struct JSXTransform {}

impl JSXTransform {
    pub const fn new() -> Self {
        Self {}
    }

    fn handle_jsx_element(&mut self, el: ast::JSXElement, stack: &mut Vec<Stack>) {
        let is_cmp = el.opening.attrs.iter().any(|a| {
            if let ast::JSXAttrOrSpread::JSXAttr(ast::JSXAttr {
                name: ast::JSXAttrName::Ident(ident),
                ..
            }) = a
            {
                ident.sym.as_ref() == "qRender"
            } else {
                false
            }
        });

        match el.opening.name {
            ast::JSXElementName::Ident(ident) => {
                if is_cmp {
                    stack.push(Stack::Expr(create_qwik_element(ident, el.opening.attrs)));
                } else if is_title(ident.sym.as_ref()) {
                    stack.push(Stack::Expr(create_virtual(ident, el.opening.attrs)));
                } else {
                    let element_tag = ident.sym.as_ref();
                    stack.push(Stack::Str(format!("<{}", element_tag)));

                    for attr in el.opening.attrs {
                        match attr {
                            ast::JSXAttrOrSpread::JSXAttr(a) => {
                                let key = match a.name {
                                    ast::JSXAttrName::Ident(ident) => {
                                        let ident_str = ident.sym.as_ref();
                                        normalize_prop(ident_str)
                                    }
                                    ast::JSXAttrName::JSXNamespacedName(ns) => {
                                        format!("{}:{}", ns.ns.sym.as_ref(), ns.name.sym.as_ref())
                                    }
                                };
                                match a.value {
                                    Some(ast::JSXAttrValue::Lit(v)) => {
                                        match v {
                                            ast::Lit::Num(nu) => {
                                                stack.push(Stack::Str(format!(" {}={}", key, nu)));
                                            }
                                            ast::Lit::Str(s) => {
                                                stack.push(Stack::Str(format!(
                                                    " {}=\"{}\"",
                                                    key,
                                                    s.value.as_ref().trim()
                                                )));
                                            }
                                            _ => {}
                                        };
                                    }
                                    Some(ast::JSXAttrValue::JSXExprContainer(container)) => {
                                        match container.expr {
                                            ast::JSXExpr::Expr(expr) => match *expr {
                                                ast::Expr::Lit(ast::Lit::Str(s)) => {
                                                    stack.push(Stack::Str(format!(
                                                        " {}=\"{}\"",
                                                        key,
                                                        transform_jsx_attr_str(&s.value)
                                                    )));
                                                }
                                                ast::Expr::Lit(ast::Lit::Num(s)) => {
                                                    stack.push(Stack::Str(format!(
                                                        " {}=\"{}\"",
                                                        key,
                                                        s.value.to_string()
                                                    )));
                                                }
                                                expr => {
                                                    stack.push(Stack::Expr(create_props(
                                                        &key,
                                                        fold_expr(self, expr),
                                                    )));
                                                }
                                            },
                                            _ => {}
                                        };
                                    }
                                    _ => {}
                                };
                            }
                            ast::JSXAttrOrSpread::SpreadElement(s) => {}
                        }
                    }
                    stack.push(Stack::Str(">".into()));

                    for child in el.children {
                        match child {
                            ast::JSXElementChild::JSXText(text) => {
                                stack.push(Stack::Str(text.value.as_ref().trim().into()));
                            }
                            ast::JSXElementChild::JSXElement(elm) => {
                                self.handle_jsx_element(*elm, stack);
                            }
                            ast::JSXElementChild::JSXExprContainer(container) => {
                                match container.expr {
                                    ast::JSXExpr::Expr(expr) => {
                                        stack.push(Stack::Expr(fold_expr(self, *expr)));
                                    }
                                    _ => {}
                                }
                            }
                            _ => {}
                        }
                    }

                    stack.push(Stack::Str(format!("</{}>", element_tag)));
                }
            }
            ast::JSXElementName::JSXMemberExpr(expr) => {}
            ast::JSXElementName::JSXNamespacedName(expr) => {}
        };
    }
}

impl Fold for JSXTransform {
    noop_fold_type!();

    fn fold_expr(&mut self, node: ast::Expr) -> ast::Expr {
        match node {
            ast::Expr::JSXElement(el) => {
                let mut stack: Vec<Stack> = vec![];
                self.handle_jsx_element(*el, &mut stack);

                let mut elems: Vec<Option<ast::ExprOrSpread>> = vec![];
                let mut current_str = "".to_string();
                for entry in stack {
                    match entry {
                        Stack::Expr(ex) => {
                            if !current_str.is_empty() {
                                elems.push(Some(ast::ExprOrSpread {
                                    spread: None,
                                    expr: Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
                                        span: DUMMY_SP,
                                        value: JsWord::from(current_str.clone()),
                                        raw: None,
                                    }))),
                                }));
                                current_str = "".to_string();
                            }
                            elems.push(Some(ast::ExprOrSpread {
                                spread: None,
                                expr: Box::new(ex),
                            }));
                        }
                        Stack::Str(s) => {
                            current_str.push_str(&s);
                        }
                    };
                }
                if !current_str.is_empty() {
                    elems.push(Some(ast::ExprOrSpread {
                        spread: None,
                        expr: Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
                            span: DUMMY_SP,
                            value: JsWord::from(current_str),
                            raw: None,
                        }))),
                    }));
                }
                create_element(
                    ast::Expr::Array(ast::ArrayLit {
                        span: DUMMY_SP,
                        elems,
                    }),
                    vec![],
                )
            }
            _ => node.fold_children_with(self),
        }
    }
}

fn is_title(ident: &str) -> bool {
    if let Some(c) = ident.chars().nth(0) {
        c.is_uppercase()
    } else {
        false
    }
}

fn create_element(ident: ast::Expr, attrs: Vec<ast::JSXAttrOrSpread>) -> ast::Expr {
    let mut args = vec![ident];
    if !attrs.is_empty() {
        let props = ast::Expr::Object(ast::ObjectLit {
            span: DUMMY_SP,
            props: attr_to_props(attrs),
        });
        args.push(props);
    }
    let qwik = ast::Ident::new(QWIK_INTERNAL.clone(), DUMMY_SP);
    ast::Expr::Call(create_internal_call(
        &id!(qwik),
        &JsWord::from("createElement"),
        args,
        None,
    ))
}

fn create_virtual(ident: ast::Ident, attrs: Vec<ast::JSXAttrOrSpread>) -> ast::Expr {
    let mut args = vec![ast::Expr::Ident(ident)];
    if !attrs.is_empty() {
        let props = ast::Expr::Object(ast::ObjectLit {
            span: DUMMY_SP,
            props: attr_to_props(attrs),
        });
        args.push(props);
    }
    let qwik = ast::Ident::new(QWIK_INTERNAL.clone(), DUMMY_SP);
    ast::Expr::Call(create_internal_call(
        &id!(qwik),
        &JsWord::from("createVirtual"),
        args,
        None,
    ))
}

fn create_props(ident: &str, value: ast::Expr) -> ast::Expr {
    let qwik = ast::Ident::new(QWIK_INTERNAL.clone(), DUMMY_SP);
    ast::Expr::Call(create_internal_call(
        &id!(qwik),
        &JsWord::from("createProp"),
        vec![
            ast::Expr::Lit(ast::Lit::Str(ast::Str {
                span: DUMMY_SP,
                value: JsWord::from(ident),
                raw: None,
            })),
            value,
        ],
        None,
    ))
}

fn create_qwik_element(ident: ast::Ident, attrs: Vec<ast::JSXAttrOrSpread>) -> ast::Expr {
    let props = ast::ObjectLit {
        span: DUMMY_SP,
        props: attr_to_props(attrs),
    };
    let qwik = ast::Ident::new(QWIK_INTERNAL.clone(), DUMMY_SP);
    ast::Expr::Call(create_internal_call(
        &id!(qwik),
        &JsWord::from("createQwik"),
        vec![
            ast::Expr::Lit(ast::Lit::Str(ast::Str {
                span: DUMMY_SP,
                value: ident.sym,
                raw: None,
            })),
            ast::Expr::Object(props),
        ],
        None,
    ))
}

fn attr_to_props(attrs: Vec<ast::JSXAttrOrSpread>) -> Vec<ast::PropOrSpread> {
    let mut props: Vec<ast::PropOrSpread> = vec![];
    for attr in attrs {
        match attr {
            ast::JSXAttrOrSpread::JSXAttr(attr) => {
                //
                match attr.name {
                    ast::JSXAttrName::Ident(i) => {
                        let value = match attr.value {
                            Some(v) => {
                                jsx_attr_value_to_expr(v).expect("empty expression container?")
                            }
                            None => true.into(),
                        };

                        // TODO: Check if `i` is a valid identifier.
                        let key = if i.sym.contains('-') {
                            ast::PropName::Str(ast::Str {
                                span: i.span,
                                raw: None,
                                value: i.sym,
                            })
                        } else {
                            ast::PropName::Ident(i)
                        };
                        props.push(ast::PropOrSpread::Prop(Box::new(ast::Prop::KeyValue(
                            ast::KeyValueProp { key, value },
                        ))));
                    }
                    ast::JSXAttrName::JSXNamespacedName(ast::JSXNamespacedName { ns, name }) => {
                        let value = match attr.value {
                            Some(v) => {
                                jsx_attr_value_to_expr(v).expect("empty expression container?")
                            }
                            None => true.into(),
                        };

                        let str_value = format!("{}:{}", ns.sym, name.sym);
                        let key = ast::Str {
                            span: DUMMY_SP,
                            raw: None,
                            value: str_value.into(),
                        };
                        let key = ast::PropName::Str(key);

                        props.push(ast::PropOrSpread::Prop(Box::new(ast::Prop::KeyValue(
                            ast::KeyValueProp { key, value },
                        ))));
                    }
                }
            }
            ast::JSXAttrOrSpread::SpreadElement(attr) => match *attr.expr {
                ast::Expr::Object(obj) => {
                    props.extend(obj.props);
                }
                _ => {
                    props.push(ast::PropOrSpread::Spread(attr));
                }
            },
        }
    }
    props
}

fn jsx_attr_value_to_expr(v: ast::JSXAttrValue) -> Option<Box<ast::Expr>> {
    Some(match v {
        ast::JSXAttrValue::Lit(ast::Lit::Str(s)) => {
            let value = transform_jsx_attr_str(&s.value);

            Box::new(ast::Expr::Lit(ast::Lit::Str(ast::Str {
                span: s.span,
                raw: None,
                value: value.into(),
            })))
        }
        ast::JSXAttrValue::Lit(lit) => Box::new(lit.into()),
        ast::JSXAttrValue::JSXExprContainer(e) => match e.expr {
            ast::JSXExpr::JSXEmptyExpr(_) => None?,
            ast::JSXExpr::Expr(e) => e,
        },
        ast::JSXAttrValue::JSXElement(e) => Box::new(ast::Expr::JSXElement(e)),
        ast::JSXAttrValue::JSXFragment(f) => Box::new(ast::Expr::JSXFragment(f)),
    })
}

fn transform_jsx_attr_str(v: &str) -> String {
    let single_quote = false;
    let mut buf = String::with_capacity(v.len());

    for c in v.chars() {
        match c {
            '\u{0008}' => buf.push_str("\\b"),
            '\u{000c}' => buf.push_str("\\f"),
            ' ' | '\n' | '\r' | '\t' => {
                if buf.ends_with(' ') {
                } else {
                    buf.push(' ')
                }
            }
            '\u{000b}' => buf.push_str("\\v"),
            '\0' => buf.push_str("\\x00"),

            '\'' if single_quote => buf.push_str("\\'"),
            '"' if !single_quote => buf.push('\"'),

            '\x01'..='\x0f' | '\x10'..='\x1f' => {
                buf.push(c);
            }

            '\x20'..='\x7e' => {
                //
                buf.push(c);
            }
            '\u{7f}'..='\u{ff}' => {
                buf.push(c);
            }

            _ => {
                buf.push(c);
            }
        }
    }

    buf
}

fn normalize_prop(prop: &str) -> String {
    if prop == "className" {
        "class".to_string()
    } else {
        prop.to_string()
    }
}
