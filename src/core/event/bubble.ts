import { getContext, getEvent } from '../props/props';
import { newInvokeContext, useInvoke } from '../use/use-core';
import { useHostElement } from '../use/use-host-element.public';
import { getDocument } from '../util/dom';
import { OnRenderSelector } from '../util/markers';

export function _bubble(eventType: string, payload: {}): void {
  let node = useHostElement() as HTMLElement | null;
  const doc = getDocument(node!);
  payload = { type: eventType, ...payload };
  const eventName = 'on:' + eventType;
  while (node) {
    const ctx = getContext(node) as any;
    const listener: undefined | (() => void) = getEvent(ctx, eventName);
    const hostElement = node.closest(OnRenderSelector)!;
    listener && useInvoke(newInvokeContext(doc, hostElement, node, payload), listener);
    node = node.parentElement;
  }
}
