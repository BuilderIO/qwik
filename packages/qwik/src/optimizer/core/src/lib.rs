#![deny(clippy::all)]
#![deny(clippy::perf)]
#![deny(clippy::nursery)]
#![allow(clippy::use_self)]
#![feature(box_patterns)]
#![allow(clippy::option_if_let_else)]
#![allow(clippy::iter_with_drain)]
#[cfg(test)]
mod test;

mod add_side_effect;
mod clean_side_effects;
mod code_move;
mod collector;
mod const_replace;
mod entry_strategy;
mod errors;
mod filter_exports;
mod has_branches;
mod inlined_fn;
mod is_immutable;
mod package_json;
mod parse;
mod props_destructuring;
mod transform;
mod utils;
mod words;

#[cfg(feature = "parallel")]
use rayon::prelude::*;

#[cfg(feature = "parallel")]
use anyhow::Context;
use words::BUILDER_IO_QWIK;

#[cfg(feature = "fs")]
use std::fs;

use anyhow::Error;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::str;
use swc_atoms::JsWord;

use crate::code_move::generate_entries;
use crate::entry_strategy::parse_entry_strategy;
pub use crate::entry_strategy::EntryStrategy;
pub use crate::parse::EmitMode;
use crate::parse::{transform_code, TransformCodeOptions};
pub use crate::parse::{ErrorBuffer, HookAnalysis, MinifyMode, TransformModule, TransformOutput};

#[cfg(feature = "fs")]
#[derive(Serialize, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransformFsOptions {
	pub src_dir: String,
	pub root_dir: Option<String>,
	pub vendor_roots: Vec<String>,
	pub glob: Option<String>,
	pub minify: MinifyMode,
	pub entry_strategy: EntryStrategy,
	pub manual_chunks: Option<HashMap<String, JsWord>>,
	pub source_maps: bool,
	pub transpile_ts: bool,
	pub transpile_jsx: bool,
	pub preserve_filenames: bool,
	pub explicit_extensions: bool,
	pub mode: EmitMode,
	pub scope: Option<String>,

	pub core_module: Option<String>,
	pub strip_exports: Option<Vec<JsWord>>,
	pub strip_ctx_name: Option<Vec<JsWord>>,
	pub strip_event_handlers: bool,
	pub reg_ctx_name: Option<Vec<JsWord>>,
	pub is_server: Option<bool>,
}

#[derive(Serialize, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransformModuleInput {
	pub path: String,
	pub code: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransformModulesOptions {
	pub src_dir: String,
	pub root_dir: Option<String>,
	pub input: Vec<TransformModuleInput>,
	pub source_maps: bool,
	pub minify: MinifyMode,
	pub transpile_ts: bool,
	pub transpile_jsx: bool,
	pub preserve_filenames: bool,
	pub entry_strategy: EntryStrategy,
	pub manual_chunks: Option<HashMap<String, JsWord>>,
	pub explicit_extensions: bool,
	pub mode: EmitMode,
	pub scope: Option<String>,

	pub core_module: Option<String>,
	pub strip_exports: Option<Vec<JsWord>>,
	pub strip_ctx_name: Option<Vec<JsWord>>,
	pub strip_event_handlers: bool,
	pub reg_ctx_name: Option<Vec<JsWord>>,
	pub is_server: Option<bool>,
}

#[cfg(feature = "fs")]
pub fn transform_fs(config: TransformFsOptions) -> Result<TransformOutput, Error> {
	let core_module = config
		.core_module
		.map_or(BUILDER_IO_QWIK.clone(), |s| s.into());
	let src_dir = Path::new(&config.src_dir);
	let root_dir = config.root_dir.as_ref().map(Path::new);

	let mut paths = vec![];
	let entry_policy = &*parse_entry_strategy(&config.entry_strategy, config.manual_chunks);
	crate::package_json::find_modules(src_dir, config.vendor_roots, &mut paths)?;

	#[cfg(feature = "parallel")]
	let iterator = paths.par_iter();

	#[cfg(not(feature = "parallel"))]
	let iterator = paths.iter();
	let mut final_output = iterator
		.map(|path| -> Result<TransformOutput, Error> {
			let code = fs::read_to_string(path)
				.with_context(|| format!("Opening {}", &path.to_string_lossy()))?;

			let relative_path = pathdiff::diff_paths(path, &config.src_dir).unwrap();
			transform_code(TransformCodeOptions {
				src_dir,
				root_dir,
				relative_path: relative_path.to_str().unwrap(),
				minify: config.minify,
				code: &code,
				explicit_extensions: config.explicit_extensions,
				source_maps: config.source_maps,
				transpile_jsx: config.transpile_jsx,
				transpile_ts: config.transpile_ts,
				preserve_filenames: config.preserve_filenames,
				scope: config.scope.as_ref(),
				entry_policy,
				mode: config.mode,
				core_module: core_module.clone(),
				entry_strategy: config.entry_strategy,
				reg_ctx_name: config.reg_ctx_name.as_deref(),
				strip_exports: config.strip_exports.as_deref(),
				strip_ctx_name: config.strip_ctx_name.as_deref(),
				strip_event_handlers: config.strip_event_handlers,
				is_server: config.is_server,
			})
		})
		.reduce(|| Ok(TransformOutput::new()), |x, y| Ok(x?.append(&mut y?)))?;

	final_output.modules.sort_unstable_by_key(|key| key.order);
	if !matches!(
		config.entry_strategy,
		EntryStrategy::Hook | EntryStrategy::Inline | EntryStrategy::Hoist
	) {
		final_output = generate_entries(
			final_output,
			&core_module,
			config.explicit_extensions,
			root_dir,
		)?;
	}
	// final_output = generate_entries(
	//     final_output,
	//     &core_module,
	//     config.explicit_extensions,
	//     root_dir,
	// )?;
	Ok(final_output)
}

pub fn transform_modules(config: TransformModulesOptions) -> Result<TransformOutput, Error> {
	let core_module = config
		.core_module
		.map_or(BUILDER_IO_QWIK.clone(), |s| s.into());
	let src_dir = std::path::Path::new(&config.src_dir);
	let root_dir = config.root_dir.as_ref().map(Path::new);

	let entry_policy = &*parse_entry_strategy(&config.entry_strategy, config.manual_chunks);
	#[cfg(feature = "parallel")]
	let iterator = config.input.par_iter();

	#[cfg(not(feature = "parallel"))]
	let iterator = config.input.iter();
	let iterator = iterator.map(|path| -> Result<TransformOutput, Error> {
		transform_code(TransformCodeOptions {
			src_dir,
			root_dir,
			relative_path: &path.path,
			code: &path.code,
			minify: config.minify,
			source_maps: config.source_maps,
			transpile_ts: config.transpile_ts,
			transpile_jsx: config.transpile_jsx,
			preserve_filenames: config.preserve_filenames,
			explicit_extensions: config.explicit_extensions,
			entry_policy,
			mode: config.mode,
			scope: config.scope.as_ref(),
			core_module: core_module.clone(),
			entry_strategy: config.entry_strategy,
			reg_ctx_name: config.reg_ctx_name.as_deref(),
			strip_exports: config.strip_exports.as_deref(),
			strip_ctx_name: config.strip_ctx_name.as_deref(),
			strip_event_handlers: config.strip_event_handlers,
			is_server: config.is_server,
		})
	});

	#[cfg(feature = "parallel")]
	let final_output: Result<TransformOutput, Error> =
		iterator.reduce(|| Ok(TransformOutput::new()), |x, y| Ok(x?.append(&mut y?)));

	#[cfg(not(feature = "parallel"))]
	let final_output: Result<TransformOutput, Error> =
		iterator.fold(Ok(TransformOutput::new()), |x, y| Ok(x?.append(&mut y?)));

	let mut final_output = final_output?;
	final_output.modules.sort_unstable_by_key(|key| key.order);
	if !matches!(
		config.entry_strategy,
		EntryStrategy::Hook | EntryStrategy::Inline | EntryStrategy::Hoist
	) {
		final_output = generate_entries(
			final_output,
			&core_module,
			config.explicit_extensions,
			root_dir,
		)?;
	}
	// final_output = generate_entries(
	//     final_output,
	//     &core_module,
	//     config.explicit_extensions,
	//     root_dir,
	// )?;

	Ok(final_output)
}
