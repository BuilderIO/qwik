install-rust:
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

install-rust-deps:
	rustup update
	cargo install cargo-insta
	cargo install wasm-pack
	rustup component add clippy

install-all: install-rust install-rust-deps

install-cli:
	cd src/optimizer/cli && cargo install --path .

fmt-core:
	cd src/optimizer/core && cargo fmt

fmt-cli:
	cd src/optimizer/cli && cargo fmt

fmt-napi:
	cd src/napi && cargo fmt

fmt-wasm:
	cd src/wasm && cargo fmt

fmt: fmt-core fmt-cli fmt-napi fmt-wasm fmt-wasm

check-core:
	cd src/optimizer/core && cargo check

check-cli:
	cd src/optimizer/cli && cargo check

check-napi:
	cd src/napi && cargo check

check-wasm:
	cd src/wasm && cargo check

check: check-core check-cli check-napi check-wasm check-wasm

lint-core:
	cd src/optimizer/core && cargo clippy

lint-cli:
	cd src/optimizer/cli && cargo clippy

lint-napi:
	cd src/napi && cargo clippy

lint-wasm:
	cd src/wasm && cargo clippy

lint: lint-core lint-cli lint-napi lint-wasm lint-wasm


test-core:
	cd src/optimizer/core && cargo check

test: test-core

publish-core:
	cd src/optimizer/core && cargo publish --all-features

publish-cli:
	cd src/optimizer/cli && cargo publish

publish: publish-core publish-cli

validate: check lint test
