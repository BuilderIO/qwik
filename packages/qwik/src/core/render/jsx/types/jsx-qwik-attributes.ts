/* eslint-disable */

import type { Ref } from '../../../use/use-store.public';
import type { QRL } from '../../../import/qrl.public';
import type { JSXNode } from './jsx-node';

export type PascalCaseEventNames =
  | 'Copy'
  | 'Cut'
  | 'Paste'
  | 'CompositionEnd'
  | 'CompositionStart'
  | 'CompositionUpdate'
  | 'Focus'
  | 'FocusIn'
  | 'FocusOut'
  | 'Blur'
  | 'Change'
  | 'Input'
  | 'Reset'
  | 'Submit'
  | 'Invalid'
  | 'Load'
  | 'Error'
  | 'KeyDown'
  | 'KeyPress'
  | 'KeyUp'
  | 'AuxClick'
  | 'Click'
  | 'ContextMenu'
  | 'DblClick'
  | 'Drag'
  | 'DragEnd'
  | 'DragEnter'
  | 'DragExit'
  | 'DragLeave'
  | 'DragOver'
  | 'DragStart'
  | 'Drop'
  | 'MouseDown'
  | 'MouseEnter'
  | 'MouseLeave'
  | 'MouseMove'
  | 'MouseOut'
  | 'MouseOver'
  | 'MouseUp'
  | 'TouchCancel'
  | 'TouchEnd'
  | 'TouchMove'
  | 'TouchStart'
  | 'PointerDown'
  | 'PointerMove'
  | 'PointerUp'
  | 'PointerCancel'
  | 'PointerEnter'
  | 'PointerLeave'
  | 'PointerOver'
  | 'PointerOut'
  | 'GotPointer'
  | 'LostPointer'
  | 'Scroll'
  | 'Wheel'
  | 'AnimationStart'
  | 'AnimationEnd'
  | 'AnimationIteration'
  | 'TransitionEnd';

export type GetEvent<K extends string> = Lowercase<K> extends keyof HTMLElementEventMap
  ? HTMLElementEventMap[Lowercase<K>]
  : Event;

type QwikEventMap = {
  [K in PascalCaseEventNames as `${K}${'' | 'Capture'}`]: GetEvent<K>;
};

export type PreventDefault = {
  [K in keyof QwikEventMap as `prevent${'default' | 'Default'}:${Lowercase<K>}`]?: boolean;
};

export interface QwikProps extends PreventDefault {
  class?: string | { [className: string]: boolean };
  innerHTML?: string;
  dangerouslySetInnerHTML?: string;
  ref?: Ref<Element>;

  /**
   *
   */
  'q:slot'?: string;

  /**
   * URL against which relative QRLs should be resolved to.
   */
  'q:obj'?: string;
  'q:host'?: string;
  'q:version'?: string;
  'q:container'?: '';
}

// Allows for Event Handlers to by typed as QwikEventMap[Key] or Event
// https://stackoverflow.com/questions/52667959/what-is-the-purpose-of-bivariancehack-in-typescript-types/52668133#52668133
export type BivariantEventHandler<T extends Event> = {
  bivarianceHack(event: T, element: Element): any;
}['bivarianceHack'];

/**
 * @public
 */
export type NativeEventHandler<T extends Event = Event> =
  | BivariantEventHandler<T>
  | BivariantEventHandler<T>[];

/**
 * @public
 */
export type QrlEvent<Type extends Event = Event> = QRL<NativeEventHandler<Type>>;

export interface QwikCustomEvents {
  [key: `${'document:' | 'window:' | ''}on${string}$`]: NativeEventHandler<Event> | undefined;
}
export type QwikKnownEvents = {
  [K in keyof QwikEventMap as `${'document:' | 'window:' | ''}on${K}$`]?: NativeEventHandler<
    QwikEventMap[K]
  >;
};
/**
 * @public
 */
export interface QwikEvents extends QwikKnownEvents, QwikCustomEvents {
  'document:onLoad$'?: BivariantEventHandler<Event>;

  'document:onScroll$'?: BivariantEventHandler<Event>;

  'document:onVisible$'?: BivariantEventHandler<Event>;

  'document:onVisibilityChange$'?: BivariantEventHandler<Event>;
}

interface CSSProperties {
  [key: string]: string | number;
}

/**
 * @public
 */
export type JSXTagName = keyof HTMLElementTagNameMap | Omit<string, keyof HTMLElementTagNameMap>;

export interface ComponentCustomEvents {
  [key: `${'host'}on:${string}$`]: NativeEventHandler<Event>;
  [key: `${'window' | 'document'}:on${string}$`]: NativeEventHandler<Event> | undefined;
}
export type ComponentKnownEvents = {
  [K in keyof QwikEventMap as `${'host' | 'window' | 'document'}:on${K}$`]?: NativeEventHandler<
    QwikEventMap[K]
  >;
};

/**
 * @public
 */
export interface ComponentBaseProps
  extends PreventDefault,
    ComponentCustomEvents,
    ComponentKnownEvents {
  class?: string | { [className: string]: boolean };
  className?: string | undefined;
  style?: CSSProperties | string | undefined;
  key?: string | number;
  id?: string | undefined;
  ref?: Ref<Element>;

  'q:slot'?: string;

  [key: `host:${string}`]: any;

  'host:tagName'?: JSXTagName;
  children?: JSXChildren;
}
export interface QwikAttributes extends QwikProps, QwikEvents {}

export type JSXChildren =
  | string
  | number
  | boolean
  | null
  | undefined
  | Function
  | RegExp
  | JSXChildren[]
  | Promise<JSXChildren>
  | JSXNode<any>;

/**
 * @public
 */
export interface DOMAttributes<T> extends QwikProps, QwikEvents {
  children?: JSXChildren;
  key?: string | number;
}
