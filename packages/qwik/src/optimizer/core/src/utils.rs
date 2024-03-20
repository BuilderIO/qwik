use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use swc_atoms::JsWord;

#[derive(Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SourceLocation {
	lo: usize,
	hi: usize,
	start_line: usize,
	start_col: usize,
	end_line: usize,
	end_col: usize,
}

impl SourceLocation {
	pub fn from(source_map: &swc_common::SourceMap, span: swc_common::Span) -> Self {
		let start = source_map.lookup_char_pos(span.lo);
		let end = source_map.lookup_char_pos(span.hi);
		// - SWC's columns are exclusive, ours are inclusive (column - 1)
		// - SWC has 0-based columns, ours are 1-based (column + 1)
		// = +-0

		Self {
			lo: span.lo.0 as usize,
			hi: span.hi.0 as usize,
			start_line: start.line,
			start_col: start.col_display + 1,
			end_line: end.line,
			end_col: end.col_display,
		}
	}
}

impl PartialOrd for SourceLocation {
	fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
		match self.start_line.cmp(&other.start_line) {
			Ordering::Equal => self.start_col.partial_cmp(&other.start_col),
			o => Some(o),
		}
	}
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
	pub category: DiagnosticCategory,
	pub code: Option<String>,
	pub file: JsWord,
	pub message: String,
	pub highlights: Option<Vec<SourceLocation>>,
	pub suggestions: Option<Vec<String>>,
	pub scope: DiagnosticScope,
}

#[derive(Serialize, Deserialize, Debug, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum DiagnosticCategory {
	/// Fails the build with an error.
	Error,
	/// Logs a warning, but the build does not fail.
	Warning,
	/// An error if this is source code in the project, or a warning if in node_modules.
	SourceError,
}

#[derive(Serialize, Deserialize, Debug, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum DiagnosticScope {
	Optimizer,
}

#[derive(Serialize, Debug, Deserialize, Eq, PartialEq, Clone, Copy)]
#[serde(rename_all = "camelCase")]
pub enum SourceType {
	Script,
	Module,
}
