#[cfg(feature = "fs")]
pub fn find_modules(
	src_dir: &std::path::Path,
	vendor_dirs: Vec<String>,
	files: &mut Vec<std::path::PathBuf>,
) -> std::io::Result<()> {
	for root in &vendor_dirs {
		find_files(std::path::Path::new(root), files)?;
	}
	find_files(src_dir, files)
}

#[cfg(feature = "fs")]
fn find_files(dir: &std::path::Path, files: &mut Vec<std::path::PathBuf>) -> std::io::Result<()> {
	if dir.is_dir() {
		for entry in std::fs::read_dir(dir)? {
			let entry = entry?;
			let path = entry.path();
			if path.is_dir() {
				find_files(&path, files)?;
			} else if should_capture_file(&path) {
				files.push(path);
			}
		}
	} else if should_capture_file(dir) {
		files.push(dir.to_path_buf());
	}
	Ok(())
}

#[cfg(feature = "fs")]
fn should_capture_file(path: &std::path::Path) -> bool {
	let ext = path.extension().and_then(|p| p.to_str());
	matches!(
		ext,
		Some("ts" | "tsx" | "js" | "jsx" | "mjs" | "mts" | "mtsx" | "mjsx")
	)
}
