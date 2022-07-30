#![deny(clippy::all)]
#![deny(clippy::perf)]
#![deny(clippy::nursery)]

use std::path::PathBuf;

use clap::{Arg, Command};
use path_absolutize::Absolutize;
use qwik_core::{transform_fs, EntryStrategy, JSXMode, MinifyMode, TransformFsOptions};

struct OptimizerInput {
    glob: Option<String>,
    manifest: Option<String>,
    src: PathBuf,
    dest: PathBuf,
    strategy: EntryStrategy,
    transpile: bool,
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
                        .possible_values(["single", "hook", "smart", "component"])
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
                    Arg::new("no-transpile")
                    .long("no-transpile")
                    .help("transpile TS and JSX into JS").takes_value(false)
                 )
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
        optimize(OptimizerInput {
            src: matches.value_of_t_or_exit("src"),
            dest: matches.value_of_t_or_exit("dest"),
            manifest: matches.value_of("manifest").map(|s| s.into()),
            glob: None,
            strategy,
            minify,
            explicit_extensions: matches.is_present("extensions"),
            transpile: !matches.is_present("no-transpile"),
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
        transpile_ts: optimizer_input.transpile,
        transpile_jsx: if optimizer_input.transpile {
            JSXMode::VDom
        } else {
            JSXMode::Preserve
        },
        entry_strategy: optimizer_input.strategy,
        explicit_extensions: optimizer_input.explicit_extensions,
        dev: true,
        scope: None,

        strip_exports: None,
    })?;

    result.write_to_fs(
        &current_dir.join(optimizer_input.dest).absolutize()?,
        optimizer_input.manifest,
    )?;
    Ok(result)
}
