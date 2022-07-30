export function createEl(tagName: string, doc: Document) {
  return {
    nodeType: 1,
    nodeName: tagName.toUpperCase,
    localName: tagName,
    ownerDocument: doc,
  };
}

export interface ServerDocument {
  nodeType: 9;
  parentElement: null;
  ownerDocument: null;
  createElement(tagName: string): any;
}

/**
 * Create emulated `Document` for server environment. Does not implement the full browser
 * `document` and `window` API. This api may be removed in the future.
 * @internal
 */
export function createSimpleDocument() {
  const doc = {
    nodeType: 9,
    parentElement: null,
    ownerDocument: null,
    createElement(tagName: string): any {
      return createEl(tagName, doc as any);
    },
  };
  return doc;
}
