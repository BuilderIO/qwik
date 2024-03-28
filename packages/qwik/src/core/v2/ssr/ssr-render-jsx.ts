import { isDev } from '@builder.io/qwik/build';
import { isQwikComponent } from '../../component/component.public';
import { isQrl } from '../../qrl/qrl-class';
import type { QRL } from '../../qrl/qrl.public';
import { dangerouslySetInnerHTML, serializeClass, stringifyStyle } from '../../render/execute-component';
import { Fragment } from '../../render/jsx/jsx-runtime';
import { Slot } from '../../render/jsx/slot.public';
import type { JSXNode, JSXOutput } from '../../render/jsx/types/jsx-node';
import type { ClassList, JSXChildren } from '../../render/jsx/types/jsx-qwik-attributes';
import { SubscriptionType } from '../../state/common';
import { SignalDerived, isSignal } from '../../state/signal';
import { trackSignal } from '../../use/use-core';
import { EMPTY_ARRAY } from '../../util/flyweight';
import { throwErrorAndStop } from '../../util/log';
import { ELEMENT_KEY } from '../../util/markers';
import { isPromise } from '../../util/promises';
import { type ValueOrPromise } from '../../util/types';
import {
  convertEventNameFromJsxPropToHtmlAttr,
  getEventNameFromJsxProp,
  isJsxPropertyAnEventName,
} from '../shared/event-names';
import { isClassAttr } from '../shared/scoped-styles';
import { qrlToString, type SerializationContext } from '../shared/shared-serialization';
import { DEBUG_TYPE, VirtualType, type fixMeAny } from '../shared/types';
import { applyInlineComponent, applyQwikComponentBody } from './ssr-render-component';
import type { SSRContainer, SsrAttrs } from './ssr-types';

type StackFn = () => ValueOrPromise<void>;
type StackValue = JSXOutput | StackFn | Promise<JSXOutput> | typeof Promise;

/** @internal */
export function _walkJSX(
  ssr: SSRContainer,
  value: JSXOutput,
  allowPromises: true
): ValueOrPromise<void>;
/** @internal */
export function _walkJSX(ssr: SSRContainer, value: JSXOutput, allowPromises: false): false;
/** @internal */
export function _walkJSX(
  ssr: SSRContainer,
  value: JSXOutput,
  allowPromises: boolean
): ValueOrPromise<void> | false {
  const stack: StackValue[] = [value];
  let resolveDrain: () => void;
  let rejectDrain: (reason: any) => void;
  const drained =
    allowPromises &&
    new Promise<void>((res, rej) => {
      resolveDrain = res;
      rejectDrain = rej;
    });
  const enqueue = (value: StackValue) => stack.push(value);
  const resolveValue = (value: JSXOutput) => {
    stack.push(value);
    drain();
  };
  const drain = (): void => {
    while (stack.length) {
      const value = stack.pop();
      if (typeof value === 'function') {
        if (value === Promise) {
          if (!allowPromises) {
            return throwErrorAndStop('Promises not expected here.');
          }
          (stack.pop() as Promise<JSXOutput>).then(resolveValue, rejectDrain);
          return;
        }
        const waitOn = (value as StackFn).apply(ssr);
        if (waitOn) {
          if (!allowPromises) {
            return throwErrorAndStop('Promises not expected here.');
          }
          waitOn.then(drain, rejectDrain);
          return;
        }
        continue;
      }
      processJSXNode(ssr, enqueue, value as JSXOutput);
    }
    if (stack.length === 0 && allowPromises) {
      resolveDrain();
    }
  };
  drain();
  return drained;
}

function processJSXNode(
  ssr: SSRContainer,
  enqueue: (
    value: ValueOrPromise<JSXOutput> | (() => ValueOrPromise<void>) | typeof Promise
  ) => void,
  value: JSXOutput
) {
  // console.log('processJSXNode', value);
  if (value === null || value === undefined) {
    ssr.textNode('');
  } else if (typeof value === 'boolean') {
    ssr.textNode('');
  } else if (typeof value === 'number') {
    ssr.textNode(String(value));
  } else if (typeof value === 'string') {
    ssr.textNode(value);
  } else if (typeof value === 'object') {
    if (Array.isArray(value)) {
      for (let i = value.length - 1; i >= 0; i--) {
        enqueue(value[i]);
      }
    } else if (isSignal(value)) {
      ssr.openFragment(isDev ? [DEBUG_TYPE, VirtualType.DerivedSignal] : EMPTY_ARRAY);
      const signalNode = ssr.getLastNode() as fixMeAny;
      // TODO(mhevery): It is unclear to me why we need to serialize host for SignalDerived.
      // const host = ssr.getComponentFrame(0)!.componentNode as fixMeAny;
      const host = signalNode;
      enqueue(ssr.closeFragment);
      enqueue(trackSignal(value, [SubscriptionType.TEXT_MUTABLE, host, value, signalNode]));
    } else if (isPromise(value)) {
      ssr.openFragment(isDev ? [DEBUG_TYPE, VirtualType.Awaited] : EMPTY_ARRAY);
      enqueue(ssr.closeFragment);
      enqueue(value);
      enqueue(Promise);
    } else {
      const jsx = value as JSXNode;
      const type = jsx.type;
      // Below, JSXChildren allows functions and regexes, but we assume the dev only uses those as appropriate.
      if (typeof type === 'string') {
        ssr.openElement(
          type,
          toSsrAttrs(jsx.varProps, ssr.serializationCtx),
          toSsrAttrs(jsx.constProps, ssr.serializationCtx, jsx.key)
        );
        const rawHTML = jsx.props[dangerouslySetInnerHTML];
        if (rawHTML) {
          ssr.htmlNode(rawHTML as string);
        }
        enqueue(ssr.closeElement);
        if (type === 'head') {
          enqueue(ssr.$appendHeadNodes$);
        }
        const children = jsx.children as JSXOutput;
        children != undefined && enqueue(children);
      } else if (typeof type === 'function') {
        if (type === Fragment) {
          ssr.openFragment(isDev ? [DEBUG_TYPE, VirtualType.Fragment] : EMPTY_ARRAY);
          enqueue(ssr.closeFragment);
          // In theory we could get functions or regexes, but we assume all is well
          const children = jsx.children as JSXOutput;
          children !== undefined && enqueue(children);
        } else if (type === Slot) {
          const componentFrame = ssr.getNearestComponentFrame()!;
          if (componentFrame) {
            const projectionAttrs = isDev ? [DEBUG_TYPE, VirtualType.Projection] : [];
            const compId = componentFrame.componentNode.id || '';
            projectionAttrs.push(':', compId);
            ssr.openProjection(projectionAttrs);
            const host = componentFrame.componentNode;
            let slotName: string = '';
            const node = ssr.getLastNode();
            const constProps = jsx.constProps;
            if (constProps && typeof constProps == 'object' && 'name' in constProps) {
              const constValue = constProps.name;
              if (constValue instanceof SignalDerived) {
                slotName = trackSignal(constValue, [
                  SubscriptionType.PROP_MUTABLE,
                  host as fixMeAny,
                  constValue,
                  node as fixMeAny,
                  'name',
                ]);
              }
            }
            slotName = String(slotName || jsx.props.name || '');
            enqueue(ssr.closeProjection);
            const slotDefaultChildren = (jsx.props.children || null) as JSXChildren | null;
            const slotChildren =
              componentFrame.consumeChildrenForSlot(node, slotName) || slotDefaultChildren;
            if (slotDefaultChildren && slotChildren !== slotDefaultChildren) {
              ssr.addUnclaimedProjection(node, '', slotDefaultChildren);
            }
            enqueue(slotChildren as JSXOutput);
          } else {
            // Even thought we are not projecting we still need to leave a marker for the slot.
            ssr.openFragment(isDev ? [DEBUG_TYPE, VirtualType.Projection] : EMPTY_ARRAY);
            ssr.closeFragment();
          }
        } else if (isQwikComponent(type)) {
          ssr.openComponent(isDev ? [DEBUG_TYPE, VirtualType.Component] : []);
          enqueue(ssr.closeComponent);
          ssr.getComponentFrame(0)!.distributeChildrenIntoSlots(jsx.children);
          const jsxOutput = applyQwikComponentBody(ssr, jsx, type);
          enqueue(jsxOutput);
          isPromise(jsxOutput) && enqueue(Promise);
        } else {
          ssr.openFragment(isDev ? [DEBUG_TYPE, VirtualType.InlineComponent] : EMPTY_ARRAY);
          enqueue(ssr.closeFragment);
          const component = ssr.getComponentFrame(0)!;
          const jsxOutput = applyInlineComponent(
            ssr,
            component && component.componentNode,
            type as fixMeAny,
            jsx
          );
          enqueue(jsxOutput);
          isPromise(jsxOutput) && enqueue(Promise);
        }
      }
    }
  }
}

export function toSsrAttrs(
  record: Record<string, unknown>,
  serializationCtx: SerializationContext,
  key?: string | null
): SsrAttrs;
export function toSsrAttrs(
  record: Record<string, unknown> | null | undefined,
  serializationCtx: SerializationContext,
  key?: string | null
): SsrAttrs | null;
export function toSsrAttrs(
  record: Record<string, unknown> | null | undefined,
  serializationCtx: SerializationContext,
  key?: string | null
): SsrAttrs | null {
  if (record == null) {
    return null;
  }
  const ssrAttrs: SsrAttrs = [];
  for (const key in record) {
    if (key === 'children') {
      continue;
    }
    let value = record[key];
    if (isJsxPropertyAnEventName(key)) {
      const eventValue = setEvent(serializationCtx, key, value);
      if (eventValue) {
        ssrAttrs.push(convertEventNameFromJsxPropToHtmlAttr(key), eventValue);
      }
      continue;
    }

    if (isSignal(value)) {
      // write signal as is. We will track this signal inside `writeAttrs`
      ssrAttrs.push(key, value);
      continue;
    }

    if (isClassAttr(key)) {
      value = serializeClass(value as ClassList);
    } else if (key === 'style') {
      value = stringifyStyle(value);
    } else {
      value = String(value);
    }

    ssrAttrs.push(key, value as string);
  }
  if (key != null) {
    ssrAttrs.push(ELEMENT_KEY, key);
  }
  return ssrAttrs;
}

function setEvent(serializationCtx: SerializationContext, key: string, rawValue: unknown) {
  let value: string | null = null;
  const qrls = rawValue;
  if (Array.isArray(qrls)) {
    for (let i = 0; i <= qrls.length; i++) {
      const qrl: unknown = qrls[i];
      if (isQrl(qrl)) {
        const first = i === 0;
        value = (first ? '' : value + '\n') + qrlToString(serializationCtx, qrl);
        addQwikEventToSerializationContext(serializationCtx, key, qrl);
      }
    }
  } else if (isQrl(qrls)) {
    value = qrlToString(serializationCtx, qrls);
    addQwikEventToSerializationContext(serializationCtx, key, qrls);
  }

  if (isJsxPropertyAnEventName(key)) {
    return value;
  }
  return null;
}

function addQwikEventToSerializationContext(
  serializationCtx: SerializationContext,
  key: string,
  qrl: QRL
) {
  const eventName = getEventNameFromJsxProp(key);
  if (eventName) {
    serializationCtx.$eventNames$.add(eventName);
    serializationCtx.$eventQrls$.add(qrl);
  }
}
