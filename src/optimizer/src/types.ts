// OPTIONS ***************

/**
 * @alpha
 */
export type MinifyOption = boolean | undefined | null;

/**
 * @alpha
 */
export type SourceMapsOption = 'external' | 'inline' | undefined | null;

/**
 * @alpha
 */
export type TranspileOption = boolean | undefined | null;

/**
 * @alpha
 */
interface TransformOptions {
  entryStrategy?: EntryStrategy;
  minify?: MinifyOption;
  sourceMaps?: SourceMapsOption;
  transpile?: boolean;
}

/**
 * @alpha
 */
export interface TransformModulesOptions extends TransformOptions {
  rootDir: string;
  input: TransformModuleInput[];
}

/**
 * @alpha
 */
export interface TransformFsOptions extends TransformOptions {
  rootDir: string;

  // **/*.qwik.{js,jsx,ts,tsx}
  glob?: string;
}

// OPTION INPUTS ***************

/**
 * @alpha
 */
export interface TransformModuleInput {
  path: string;
  code: string;
}

// RESULT ***************

/**
 * @alpha
 */
export interface TransformResult {
  rootDir: string;
  modules: TransformModule[];
  diagnostics: Diagnostic[];
  isTypeScript: boolean;
  isJsx: boolean;
  hooks: HookAnalysis[];
}

/**
 * @alpha
 */
export interface HookAnalysis {
  origin: string;
  name: string;
  entry: string | null;
  canonicalFilename: string;
  localDecl: string[];
  localIdents: string[];
}

// RESULT OUTPUT ***************

/**
 * @alpha
 */
export interface TransformModule {
  path: string;
  isEntry: boolean;
  code: string | null;
  map: string;
}

// DIAGNOSTICS ***************

/**
 * @alpha
 */
export interface Diagnostic {
  message: string;
  severity: DiagnosticType;
  documentation_url?: string;
  show_environment: boolean;
  hints?: string[];
}

/**
 * @alpha
 */
export type DiagnosticType = 'error' | 'warn' | 'info';

// ENTRY STRATEGY ***************

/**
 * @alpha
 */
export type EntryStrategy = SingleEntryStrategy | PerHookEntryStrategy | ManualEntryStrategy;

/**
 * @alpha
 */
export interface SingleEntryStrategy {
  type: 'single';
}

/**
 * @alpha
 */
export interface PerHookEntryStrategy {
  type: 'per-hook';
}

/**
 * @alpha
 */
export interface ManualEntryStrategy {
  type: 'manual';
  entries: string[][];
}

// OUTPUT ENTRY MAP ***************

/**
 * @alpha
 */
export interface OutputEntryMap {}
