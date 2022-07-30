import type { ReplModuleInput } from '../../types';

export interface ExampleSection {
  id: string;
  title: string;
  apps: ExampleApp[];
}

export interface ExampleApp {
  id: string;
  title: string;
  description: string;
  icon: string;
  inputs: ReplModuleInput[];
}

/**
 * Generated at build-time.
 * See /docs/pages/examples/examples-menu.json
 */
const exampleSections: ExampleSection[] = [];
export default exampleSections;
