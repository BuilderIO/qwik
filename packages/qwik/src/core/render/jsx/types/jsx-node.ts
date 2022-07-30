/**
 * @public
 */
export interface FunctionComponent<P = {}> {
  (props: P, key?: string): JSXNode | null;
}

/**
 * @public
 */
export interface JSXNode<T = any> {
  type: T;
  props: Record<string, any>;
  key: string | number | null;
}

export interface ProcessedJSXNode {
  $type$: string;
  $props$: Record<string, any> | null;
  $children$: ProcessedJSXNode[];
  $key$: string | null;
  $elm$: Node | null;
  $text$: string;
}
