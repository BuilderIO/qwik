#![deny(clippy::all)]
#![deny(clippy::perf)]
#![deny(clippy::nursery)]
#![allow(clippy::use_self)]

#[cfg(test)]
mod test;

mod code_move;
mod collector;
mod entry_strategy;
mod errors;
mod filter_exports;
mod jsx_transform;
mod package_json;
mod parse;
mod transform;
mod utils;
mod words;

#[cfg(feature = "parallel")]
use rayon::prelude::*;

#[cfg(feature = "parallel")]
use anyhow::Context;

#[cfg(feature = "fs")]
use std::fs;

#[cfg(feature = "fs")]
use std::path::Path;

use anyhow::Error;
use serde::{Deserialize, Serialize};
use std::str;
use swc_atoms::JsWord;

use crate::code_move::generate_entries;
use crate::entry_strategy::parse_entry_strategy;
pub use crate::entry_strategy::EntryStrategy;
use crate::parse::{transform_code, TransformCodeOptions};
pub use crate::parse::{
    ErrorBuffer, HookAnalysis, JSXMode, MinifyMode, TransformModule, TransformOutput,
};

#[cfg(feature = "fs")]
#[derive(Serialize, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransformFsOptions {
    pub src_dir: String,
    pub vendor_roots: Vec<String>,
    pub glob: Option<String>,
    pub minify: MinifyMode,
    pub entry_strategy: EntryStrategy,
    pub source_maps: bool,
    pub transpile_ts: bool,
    pub transpile_jsx: JSXMode,
    pub explicit_extensions: bool,
    pub dev: bool,
    pub scope: Option<String>,

    pub strip_exports: Option<Vec<JsWord>>,
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
    pub input: Vec<TransformModuleInput>,
    pub source_maps: bool,
    pub minify: MinifyMode,
    pub transpile_ts: bool,
    pub transpile_jsx: JSXMode,
    pub entry_strategy: EntryStrategy,
    pub explicit_extensions: bool,
    pub dev: bool,
    pub scope: Option<String>,

    pub strip_exports: Option<Vec<JsWord>>,
}

#[cfg(feature = "fs")]
pub fn transform_fs(config: TransformFsOptions) -> Result<TransformOutput, Error> {
    let src_dir = Path::new(&config.src_dir);
    let mut paths = vec![];
    let is_inline = matches!(config.entry_strategy, EntryStrategy::Inline);
    let entry_policy = &*parse_entry_strategy(config.entry_strategy);
    crate::package_json::find_modules(src_dir, config.vendor_roots, &mut paths)?;

    #[cfg(feature = "parallel")]
    let iterator = paths.par_iter();

    #[cfg(not(feature = "parallel"))]
    let iterator = paths.iter();
    let mut final_output = iterator
        .map(|path| -> Result<TransformOutput, Error> {
            let code = fs::read_to_string(&path)
                .with_context(|| format!("Opening {}", &path.to_string_lossy()))?;

            let relative_path = pathdiff::diff_paths(path, &config.src_dir).unwrap();
            transform_code(TransformCodeOptions {
                src_dir,
                relative_path: relative_path.to_str().unwrap(),
                minify: config.minify,
                code: &code,
                explicit_extensions: config.explicit_extensions,
                source_maps: config.source_maps,
                transpile_ts: config.transpile_ts,
                transpile_jsx: config.transpile_jsx,
                scope: config.scope.as_ref(),
                entry_policy,
                dev: config.dev,
                is_inline,
                strip_exports: config.strip_exports.as_deref(),
            })
        })
        .reduce(|| Ok(TransformOutput::new()), |x, y| Ok(x?.append(&mut y?)))?;

    final_output.modules.sort_unstable_by_key(|key| key.order);
    final_output = generate_entries(final_output, config.explicit_extensions)?;
    Ok(final_output)
}

pub fn transform_modules(config: TransformModulesOptions) -> Result<TransformOutput, Error> {
    let src_dir = std::path::Path::new(&config.src_dir);
    let is_inline = matches!(config.entry_strategy, EntryStrategy::Inline);
    let entry_policy = &*parse_entry_strategy(config.entry_strategy);
    #[cfg(feature = "parallel")]
    let iterator = config.input.par_iter();

    #[cfg(not(feature = "parallel"))]
    let iterator = config.input.iter();
    let iterator = iterator.map(|path| -> Result<TransformOutput, Error> {
        transform_code(TransformCodeOptions {
            src_dir,
            relative_path: &path.path,
            code: &path.code,
            minify: config.minify,
            source_maps: config.source_maps,
            transpile_ts: config.transpile_ts,
            transpile_jsx: config.transpile_jsx,
            explicit_extensions: config.explicit_extensions,
            entry_policy,
            dev: config.dev,
            scope: config.scope.as_ref(),
            is_inline,

            strip_exports: config.strip_exports.as_deref(),
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
    final_output = generate_entries(final_output, config.explicit_extensions)?;

    Ok(final_output)
}
