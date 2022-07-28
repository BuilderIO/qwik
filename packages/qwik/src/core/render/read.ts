import { QContainerAttr, QHostAttr } from "../util/markers";
import { getChildren, getKey } from "./cursor";
import { ProcessedJSXNodeImpl } from "./jsx/jsx-runtime"

export const buildTree = (root: Element): ProcessedJSXNodeImpl => {
  const children = getChildren(root, 'default').map(node => {
    if (node.nodeType === 1) {
      if (shouldWalk(node as Element)) {
        return buildTree(node as Element);
      } else {
        return getVnode(node as Element, []);
      }
    } else if (node.nodeType === 3) {
      return new ProcessedJSXNodeImpl(root.nodeName, null, [], null);
    }
    throw new Error('invalid node')
  });
  return getVnode(root, children);
}

const shouldWalk = (root: Element): boolean => {
  const isComponent = root.hasAttribute(QHostAttr);
  const isContainer = root.hasAttribute(QContainerAttr);
  return !isComponent && !isContainer;
}

const getVnode = (root: Element, children: ProcessedJSXNodeImpl[]) => {
  return new ProcessedJSXNodeImpl(root.localName, {}, children, getKey(root as Element));
}