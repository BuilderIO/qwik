use crate::transform::HookData;
use crate::words::*;
use crate::{parse::PathData, transform::HookKind};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use swc_atoms::JsWord;

use lazy_static::lazy_static;

lazy_static! {
	static ref ENTRY_HOOKS: JsWord = JsWord::from("entry_hooks");
	static ref ENTRY_SERVER: JsWord = JsWord::from("entry_server");
}

// EntryStrategies
#[derive(Debug, Serialize, Copy, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum EntryStrategy {
	Inline,
	Hoist,
	Single,
	Hook,
	Component,
	Smart,
}

pub trait EntryPolicy: Send + Sync {
	fn get_entry_for_sym(
		&self,
		hash: &str,
		location: &PathData,
		context: &[String],
		hook_data: &HookData,
	) -> Option<JsWord>;
}

#[derive(Default, Clone)]
pub struct InlineStrategy;

impl EntryPolicy for InlineStrategy {
	fn get_entry_for_sym(
		&self,
		_hash: &str,
		_path: &PathData,
		_context: &[String],
		_hook_data: &HookData,
	) -> Option<JsWord> {
		Some(ENTRY_HOOKS.clone())
	}
}

#[derive(Clone)]
pub struct SingleStrategy {
	map: Option<HashMap<String, JsWord>>,
}

impl SingleStrategy {
	pub const fn new(map: Option<HashMap<String, JsWord>>) -> Self {
		Self { map }
	}
}

impl EntryPolicy for SingleStrategy {
	fn get_entry_for_sym(
		&self,
		hash: &str,
		_path: &PathData,
		_context: &[String],
		_hook_data: &HookData,
	) -> Option<JsWord> {
		if let Some(map) = &self.map {
			let entry = map.get(hash);
			if let Some(entry) = entry {
				return Some(entry.clone());
			}
		}
		Some(ENTRY_HOOKS.clone())
	}
}

#[derive(Clone)]
pub struct PerHookStrategy {
	map: Option<HashMap<String, JsWord>>,
}

impl PerHookStrategy {
	pub const fn new(map: Option<HashMap<String, JsWord>>) -> Self {
		Self { map }
	}
}

impl EntryPolicy for PerHookStrategy {
	fn get_entry_for_sym(
		&self,
		hash: &str,
		_path: &PathData,
		_context: &[String],
		_hook_data: &HookData,
	) -> Option<JsWord> {
		if let Some(map) = &self.map {
			let entry = map.get(hash);
			if let Some(entry) = entry {
				return Some(entry.clone());
			}
		}
		None
	}
}

#[derive(Clone)]
pub struct PerComponentStrategy {
	map: Option<HashMap<String, JsWord>>,
}

impl PerComponentStrategy {
	pub const fn new(map: Option<HashMap<String, JsWord>>) -> Self {
		Self { map }
	}
}

impl EntryPolicy for PerComponentStrategy {
	fn get_entry_for_sym(
		&self,
		hash: &str,
		_path: &PathData,
		context: &[String],
		_hook_data: &HookData,
	) -> Option<JsWord> {
		if let Some(map) = &self.map {
			let entry = map.get(hash);
			if let Some(entry) = entry {
				return Some(entry.clone());
			}
		}
		context.first().map_or_else(
			|| Some(ENTRY_HOOKS.clone()),
			|root| Some(JsWord::from(["entry_", root].concat())),
		)
	}
}

#[derive(Clone)]
pub struct SmartStrategy {
	map: Option<HashMap<String, JsWord>>,
}

impl SmartStrategy {
	pub const fn new(map: Option<HashMap<String, JsWord>>) -> Self {
		Self { map }
	}
}
impl EntryPolicy for SmartStrategy {
	fn get_entry_for_sym(
		&self,
		hash: &str,
		_path: &PathData,
		context: &[String],
		hook_data: &HookData,
	) -> Option<JsWord> {
		if hook_data.scoped_idents.is_empty()
			&& (hook_data.ctx_kind != HookKind::Function || &hook_data.ctx_name == "event$")
		{
			return None;
		}
		if hook_data.ctx_name == *USE_SERVER_MOUNT {
			return Some(ENTRY_SERVER.clone());
		}
		if let Some(map) = &self.map {
			let entry = map.get(hash);
			if let Some(entry) = entry {
				return Some(entry.clone());
			}
		}
		Some(context.first().map_or_else(
			|| ENTRY_HOOKS.clone(),
			|root| JsWord::from(["entry_", root].concat()),
		))
	}
}

pub fn parse_entry_strategy(
	strategy: &EntryStrategy,
	manual_chunks: Option<HashMap<String, JsWord>>,
) -> Box<dyn EntryPolicy> {
	match strategy {
		EntryStrategy::Inline | EntryStrategy::Hoist => Box::<InlineStrategy>::default(),
		EntryStrategy::Hook => Box::new(PerHookStrategy::new(manual_chunks)),
		EntryStrategy::Single => Box::new(SingleStrategy::new(manual_chunks)),
		EntryStrategy::Component => Box::new(PerComponentStrategy::new(manual_chunks)),
		EntryStrategy::Smart => Box::new(SmartStrategy::new(manual_chunks)),
	}
}
