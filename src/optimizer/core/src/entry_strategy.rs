use crate::collector::HookCollect;
use crate::parse::PathData;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use swc_atoms::JsWord;
use swc_ecmascript::ast::CallExpr;

use lazy_static::lazy_static;

// EntryStrategies
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum EntryStrategy {
    Single,
    Hook,
    Component,
    Smart,
    Manual(Vec<Vec<String>>),
}
pub trait EntryPolicy {
    fn get_entry_for_sym(
        &self,
        symbol_name: &str,
        location: &PathData,
        context: &[String],
        analytics: &HookCollect,
        expr: &CallExpr,
    ) -> Option<JsWord>;
}

#[derive(Default)]
pub struct SingleStrategy;

impl EntryPolicy for SingleStrategy {
    fn get_entry_for_sym(
        &self,
        _symbol: &str,
        _path: &PathData,
        _context: &[String],
        _analytics: &HookCollect,
        _expr: &CallExpr,
    ) -> Option<JsWord> {
        lazy_static! {
            static ref WORD: JsWord = JsWord::from("entry_hooks");
        }
        Some(WORD.clone())
    }
}

#[derive(Default)]
pub struct PerHookStrategy {}

impl EntryPolicy for PerHookStrategy {
    fn get_entry_for_sym(
        &self,
        _symbol: &str,
        _path: &PathData,
        _context: &[String],
        _analytics: &HookCollect,
        _expr: &CallExpr,
    ) -> Option<JsWord> {
        None
    }
}

#[derive(Default)]
pub struct PerComponentStrategy {}

impl EntryPolicy for PerComponentStrategy {
    fn get_entry_for_sym(
        &self,
        _symbol: &str,
        _path: &PathData,
        context: &[String],
        _analytics: &HookCollect,
        _expr: &CallExpr,
    ) -> Option<JsWord> {
        if let Some(root) = context.first() {
            Some(JsWord::from(["entry_", root].concat()))
        } else {
            lazy_static! {
                static ref WORD: JsWord = JsWord::from("entry-fallback");
            }
            Some(WORD.clone())
        }
    }
}

#[derive(Default)]
pub struct SmartStrategy;

impl EntryPolicy for SmartStrategy {
    fn get_entry_for_sym(
        &self,
        _symbol: &str,
        _path: &PathData,
        context: &[String],
        _analytics: &HookCollect,
        _expr: &CallExpr,
    ) -> Option<JsWord> {
        lazy_static! {
            static ref SERVER: JsWord = JsWord::from("entry-server");
            static ref FALLBACK: JsWord = JsWord::from("entry-fallback");
        }
        if context.iter().any(|h| h == "onMount") {
            return Some(SERVER.clone());
        }
        Some(context.first().map_or_else(
            || FALLBACK.clone(),
            |root| JsWord::from(["entry_", root].concat()),
        ))
    }
}

pub struct ManualStrategy {
    map: HashMap<String, JsWord>,
    fallback: JsWord,
}

impl ManualStrategy {
    pub fn new(groups: Vec<Vec<String>>) -> Self {
        let mut map: HashMap<String, JsWord> = HashMap::new();
        for (count, group) in groups.into_iter().enumerate() {
            let group_name = JsWord::from(format!("entry_{}", count));
            for sym in group {
                map.insert(sym, group_name.clone());
            }
        }
        Self {
            map,
            fallback: JsWord::from("entry-fallback"),
        }
    }
}

impl EntryPolicy for ManualStrategy {
    fn get_entry_for_sym(
        &self,
        symbol: &str,
        _path: &PathData,
        _context: &[String],
        _analytics: &HookCollect,
        _expr: &CallExpr,
    ) -> Option<JsWord> {
        let entry = self.map.get(symbol);
        Some(match entry {
            Some(val) => val.clone(),
            None => self.fallback.clone(),
        })
    }
}

pub fn parse_entry_strategy(strategy: EntryStrategy) -> Box<dyn EntryPolicy> {
    match strategy {
        EntryStrategy::Single => Box::new(SingleStrategy::default()),
        EntryStrategy::Hook => Box::new(PerHookStrategy::default()),
        EntryStrategy::Component => Box::new(PerComponentStrategy::default()),
        EntryStrategy::Smart => Box::new(SmartStrategy::default()),
        EntryStrategy::Manual(groups) => Box::new(ManualStrategy::new(groups)),
    }
}
