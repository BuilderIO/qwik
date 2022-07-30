import type { ReplModuleInput } from '../../types';

export interface TutorialSection {
  id: string;
  title: string;
  apps: TutorialApp[];
}

export interface TutorialApp {
  id: string;
  title: string;
  problemInputs: ReplModuleInput[];
  solutionInputs: ReplModuleInput[];
  enableHtmlOutput?: boolean;
  enableClientOutput?: boolean;
  enableSsrOutput?: boolean;
}

/**
 * Generated at build-time.
 * See /docs/pages/tutorial/tutorial-menu.json
 */
const tutorialSections: TutorialSection[] = [];
export default tutorialSections;
