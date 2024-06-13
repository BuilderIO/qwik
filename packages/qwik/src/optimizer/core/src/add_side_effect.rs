use std::collections::HashSet;
use std::path::Path;

use crate::collector::GlobalCollect;
use crate::parse::PathData;
use path_slash::PathBufExt;
use swc_atoms::JsWord;
use swc_common::DUMMY_SP;
use swc_ecmascript::ast;
use swc_ecmascript::visit::{VisitMut, VisitMutWith};

pub struct SideEffectVisitor<'a> {
	global_collector: &'a GlobalCollect,
	imports: HashSet<JsWord>,
	path_data: &'a PathData,
	src_dir: &'a Path,
}

impl<'a> SideEffectVisitor<'a> {
	pub fn new(
		global_collector: &'a GlobalCollect,
		path_data: &'a PathData,
		src_dir: &'a Path,
	) -> Self {
		Self {
			global_collector,
			path_data,
			src_dir,
			imports: HashSet::new(),
		}
	}
}

impl<'a> VisitMut for SideEffectVisitor<'a> {
	fn visit_mut_import_decl(&mut self, node: &mut ast::ImportDecl) {
		if node.src.value.starts_with('.') {
			self.imports.insert(node.src.value.clone());
		}
	}
	fn visit_mut_module(&mut self, node: &mut ast::Module) {
		node.visit_mut_children_with(self);
		let mut imports: Vec<_> = self.global_collector.imports.values().collect();
		imports.sort_by_key(|i| i.source.clone());

		for import in imports {
			if import.source.starts_with('.') && !self.imports.contains(&import.source) {
				let abs_dir = self.path_data.abs_dir.to_slash_lossy();
				let relative = relative_path::RelativePath::new(&abs_dir);
				let final_path = relative.join(import.source.as_ref()).normalize();
				if final_path.starts_with(self.src_dir.to_str().unwrap()) {
					node.body.insert(
						0,
						ast::ModuleItem::ModuleDecl(ast::ModuleDecl::Import(ast::ImportDecl {
							with: None,
							phase: Default::default(),
							span: DUMMY_SP,
							specifiers: vec![],
							type_only: false,
							src: Box::new(ast::Str::from(import.source.clone())),
						})),
					);
				}
			}
		}
	}
}
