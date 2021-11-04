use std::cmp::Ordering;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use std::hash::{Hash};

#[derive(Debug)]
pub struct MapVec<K, V> {
    map: HashMap<K, Vec<V>>,
}


impl<K, V> MapVec<K, V>
where
    K: Eq + Hash,
{
    pub fn new() -> Self {
        Self{
            map: HashMap::new(),
        }
    }

    pub fn get(&self, key: &K) -> Option<&Vec<V>>
    where K: Hash + Eq {
        self.map.get(key)
    }

    pub fn push(&mut self, key: K, value: V)
    where K: Hash + Eq {
        let vec = self.map.get_mut(&key);
        if let Some(vec) = vec {
            vec.push(value);
        } else {
            self.map.insert(key, vec![value]);
        }
    }
}


#[derive(Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
pub struct SourceLocation {
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
pub struct CodeHighlight {
    pub message: Option<String>,
    pub loc: SourceLocation,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Diagnostic {
    pub message: String,
    pub code_highlights: Option<Vec<CodeHighlight>>,
    pub hints: Option<Vec<String>>,
    pub show_environment: bool,
    pub severity: DiagnosticSeverity,
    pub documentation_url: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Eq, PartialEq)]
pub enum DiagnosticSeverity {
    /// Fails the build with an error.
    Error,
    /// Logs a warning, but the build does not fail.
    Warning,
    /// An error if this is source code in the project, or a warning if in node_modules.
    SourceError,
}

#[derive(Serialize, Debug, Deserialize, Eq, PartialEq, Clone, Copy)]
pub enum SourceType {
    Script,
    Module,
}

#[macro_export]
macro_rules! fold_member_expr_skip_prop {
    () => {
        fn fold_member_expr(
            &mut self,
            mut node: swc_ecmascript::ast::MemberExpr,
        ) -> swc_ecmascript::ast::MemberExpr {
            node.obj = node.obj.fold_children_with(self);

            // To ensure that fold_expr doesn't replace `require` in non-computed member expressions
            if node.computed {
                node.prop = node.prop.fold_children_with(self);
            }

            node
        }
    };
}
