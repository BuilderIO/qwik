import type {
  Diagnostic,
  QwikManifest,
  QwikRollupPluginOptions,
  TransformModule,
} from '@builder.io/qwik/optimizer';
import type { NoSerialize } from '@builder.io/qwik';

export interface ReplAppInput {
  buildId: number;
  files: ReplModuleInput[];
  version: string;
  buildMode: 'development' | 'production';
  entryStrategy: string;
}

export interface ReplInputOptions extends Omit<QwikRollupPluginOptions, 'srcDir'> {
  buildId: number;
  srcInputs: ReplModuleInput[];
  version: string;
  buildMode: 'development' | 'production';
  serverUrl: string;
}

export interface ReplStore {
  clientId: string;
  html: string;
  transformedModules: TransformModule[];
  clientBundles: ReplModuleOutput[];
  ssrModules: ReplModuleOutput[];
  diagnostics: Diagnostic[];
  monacoDiagnostics: Diagnostic[];
  selectedInputPath: string;
  selectedOutputPanel: OutputPanel;
  selectedOutputDetail: OutputDetail;
  enableHtmlOutput: boolean;
  enableClientOutput: boolean;
  enableSsrOutput: boolean;
  ssrBuild: boolean;
  debug: boolean;
  serverUrl: string;
  serverWindow: NoSerialize<MessageEventSource> | null;
  versions: string[];
  events: ReplEvent[];
  isLoading: boolean;
}

export interface ReplModuleInput {
  path: string;
  code: string;
  hidden?: boolean;
}

export interface ReplModuleOutput {
  path: string;
  code: string;
  size?: string;
}

export interface ReplMessageBase {
  type: string;
  clientId: string;
}

export type ReplMessage =
  | ReplUpdateMessage
  | ReplEventMessage
  | ReplReadyMessage
  | ReplAppLoadedMessage
  | ReplResult;

export interface ReplUpdateMessage extends ReplMessageBase {
  type: 'update';
  options: ReplInputOptions;
}

export interface ReplEventMessage extends ReplMessageBase {
  type: 'event';
  event: ReplEvent;
}

export interface ReplReadyMessage extends ReplMessageBase {
  type: 'replready';
}

export interface ReplAppLoadedMessage extends ReplMessageBase {
  type: 'apploaded';
}

export interface ReplEvent {
  start: number;
  end?: number;
  kind:
    | 'console-log'
    | 'console-debug'
    | 'console-warn'
    | 'console-error'
    | 'symbol'
    | 'pause'
    | 'resume'
    | 'client-module'
    | 'prefetch';
  scope: 'ssr' | 'client' | 'build' | 'network';
  message: string[];
  element?: Element;
}

export interface ReplResult extends ReplMessageBase {
  type: 'result';
  buildId: number;
  html: string;
  transformedModules: TransformModule[];
  clientBundles: ReplModuleOutput[];
  ssrModules: ReplModuleOutput[];
  manifest: QwikManifest | undefined;
  diagnostics: Diagnostic[];
  events: ReplEvent[];
}

export type OutputPanel =
  | 'app'
  | 'html'
  | 'symbols'
  | 'clientBundles'
  | 'serverModules'
  | 'diagnostics';

export type OutputDetail = 'options' | 'console';
