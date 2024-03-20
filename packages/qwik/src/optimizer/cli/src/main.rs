#![deny(clippy::all)]
#![deny(clippy::perf)]
#![deny(clippy::nursery)]

use std::path::PathBuf;

use clap::{Arg, Command};
use path_absolutize::Absolutize;
use qwik_core::{transform_fs, EmitMode, EntryStrategy, MinifyMode, TransformFsOptions};

struct OptimizerInput {
	glob: Option<String>,
	manifest: Option<String>,
	core_module: Option<String>,
	scope: Option<String>,
	src: PathBuf,
	dest: PathBuf,
	mode: EmitMode,
	strategy: EntryStrategy,
	transpile_ts: bool,
	transpile_jsx: bool,
	preserve_filenames: bool,
	minify: MinifyMode,
	sourcemaps: bool,
	explicit_extensions: bool,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
	let matches = Command::new("qwik")
        .version("1.0")
        .arg_required_else_help(true)
        .subcommand_required(true)
        .infer_subcommands(true)
        .disable_help_subcommand(true)
        .subcommand_required(true).arg_required_else_help(true)
        .about("Qwik CLI allows to optimize qwik projects before bundling")
        .subcommand(
            Command::new("optimize")
                .about("takes a source directory of qwik code and outputs an optimized version that lazy loads")
                .arg_required_else_help(true)
                .arg(
                    Arg::new("src")
                        .short('s')
                        .long("src")
                        .default_value(".")
                        .takes_value(true)
                        .help("relative path to the source directory"),
                )
                .arg(
                    Arg::new("dest")
                        .short('d')
                        .long("dest")
                        .required(true)
                        .takes_value(true)
                        .help("relative path to the output directory"),
                )
                .arg(
                    Arg::new("strategy")
                    .long("strategy")
                        .possible_values(["inline","single", "hook", "smart", "component"])
                        .takes_value(true)
                        .help("entry strategy used to group hooks"),
                )
                .arg(
                    Arg::new("manifest")
                        .short('m')
                        .long("manifest")
                        .takes_value(true)
                        .help("filename of the manifest"),
                )
                .arg(
                    Arg::new("no-ts")
                    .long("no-ts")
                    .help("no transpile TS").takes_value(false)
                 )
                 .arg(
                    Arg::new("no-jsx")
                    .long("no-jsx")
                    .help("no transpile JSX").takes_value(false)
                 )
                 .arg(Arg::new("preserve-filenames").long("preserve-filenames").help("preserves original filename").takes_value(false))
                .arg(Arg::new("minify").long("minify").possible_values(["minify", "simplify", "none"]).takes_value(true).help("outputs minified source code"))
                .arg(Arg::new("sourcemaps").long("sourcemaps").help("generates sourcemaps").takes_value(false))
                .arg(Arg::new("extensions").long("extensions").help("keep explicit extensions on imports").takes_value(false)),
        )
        .get_matches();

	// You can check for the existence of subcommands, and if found use their
	// matches just as you would the top level app
	if let Some(matches) = matches.subcommand_matches("optimize") {
		// "$ myapp test" was run
		let strategy = match matches.value_of("strategy") {
			Some("inline") => EntryStrategy::Inline,
			Some("hook") => EntryStrategy::Hook,
			Some("single") => EntryStrategy::Single,
			Some("component") => EntryStrategy::Component,
			Some("smart") | None => EntryStrategy::Smart,
			_ => panic!("Invalid strategy option"),
		};

		let minify = match matches.value_of("minify") {
			Some("none") => MinifyMode::None,
			Some("simplify") | None => MinifyMode::Simplify,
			_ => panic!("Invalid minify option"),
		};

		let mode = match matches.value_of("mode") {
			Some("dev") => EmitMode::Dev,
			Some("prod") => EmitMode::Prod,
			Some("lib") | None => EmitMode::Lib,
			_ => panic!("Invalid mode option"),
		};
		optimize(OptimizerInput {
			src: matches.value_of_t_or_exit("src"),
			dest: matches.value_of_t_or_exit("dest"),
			manifest: matches.value_of("manifest").map(|s| s.into()),
			core_module: matches.value_of("core_module").map(|s| s.into()),
			scope: matches.value_of("scope").map(|s| s.into()),
			mode,
			glob: None,
			strategy,
			minify,
			explicit_extensions: matches.is_present("extensions"),
			transpile_jsx: !matches.is_present("no-jsx"),
			transpile_ts: !matches.is_present("no-ts"),
			preserve_filenames: matches.is_present("preserve-filenames"),
			sourcemaps: matches.is_present("sourcemaps"),
		})?;
	}
	Ok(())
}

fn optimize(
	optimizer_input: OptimizerInput,
) -> Result<qwik_core::TransformOutput, Box<dyn std::error::Error>> {
	let current_dir = std::env::current_dir()?;
	let src_dir = current_dir.join(optimizer_input.src).canonicalize()?;

	let result = transform_fs(TransformFsOptions {
		src_dir: src_dir.to_string_lossy().to_string(),
		vendor_roots: vec![],
		glob: optimizer_input.glob,
		source_maps: optimizer_input.sourcemaps,
		minify: optimizer_input.minify,
		transpile_jsx: optimizer_input.transpile_jsx,
		transpile_ts: optimizer_input.transpile_ts,
		preserve_filenames: optimizer_input.preserve_filenames,
		entry_strategy: optimizer_input.strategy,
		explicit_extensions: optimizer_input.explicit_extensions,
		core_module: optimizer_input.core_module,
		root_dir: None,

		mode: optimizer_input.mode,
		scope: optimizer_input.scope,

		manual_chunks: None,
		strip_exports: None,
		strip_ctx_name: None,
		strip_event_handlers: false,
		reg_ctx_name: None,
		is_server: None,
	})?;

	result.write_to_fs(
		&current_dir.join(optimizer_input.dest).absolutize()?,
		optimizer_input.manifest,
	)?;
	Ok(result)
}
