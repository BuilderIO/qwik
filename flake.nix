{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, rust-overlay, nixpkgs }:
    let
      b = builtins;
      devShell = system: _pkgs:
        let
          overlays = [ (import rust-overlay) ];
          pkgs = import nixpkgs {
            inherit system overlays;
          };
        in
        {
          default = pkgs.mkShell {
            nativeBuildInputs = with pkgs; [
              bashInteractive
              gitMinimal

              nodejs_20
              corepack_20

              # Qwik optimizer deps
              wasm-pack
              # Provides rustc and cargo
              ((rust-bin.fromRustupToolchainFile
                ./rust-toolchain).override {
                # For rust-analyzer
                extensions = [ "rust-src" ];
                # For building wasm
                targets = [ "wasm32-unknown-unknown" ];
              })
            ];
          };
        };
    in
    {
      devShells = b.mapAttrs (devShell) nixpkgs.legacyPackages;
    };
}
