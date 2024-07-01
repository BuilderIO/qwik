/* eslint-disable @typescript-eslint/no-restricted-imports */
/**
 * @file
 *
 *   Importing directly from `qwik` is not allowed because the SSR package would end up with two
 *   copies of the code. Instead, the SSR package should import from `@builder.io/qwik`.
 *
 *   The exception to this rule is importing types, because those get elided by TypeScript. To make
 *   ensuring that this rule is followed, this file is the only place where relative `../` imports
 *   of types only are allowed.
 *
 *   Sum code we are OK by importing and making a copy because it will have no adverse affect. This
 *   file lists code which we are OK to have duplicated.
 */

export { dangerouslySetInnerHTML, serializeAttribute } from '../core/render/execute-component';
export { SubscriptionType } from '../core/state/common';
export {
  ELEMENT_ID,
  ELEMENT_KEY,
  ELEMENT_PROPS,
  ELEMENT_SEQ,
  ELEMENT_SEQ_IDX,
  OnRenderProp,
  QContainerAttr,
  QCtxAttr,
  QScopedStyle,
  QSlot,
  QSlotParent,
  QSlotRef,
  QStyle,
  QTemplate,
  QRenderAttr,
  QRuntimeAttr,
  QVersionAttr,
  QBaseAttr,
  QLocaleAttr,
  QManifestHashAttr,
  FLUSH_COMMENT,
  STREAM_BLOCK_END_COMMENT,
  STREAM_BLOCK_START_COMMENT,
  QDefaultSlot,
} from '../core/util/markers';
export { maybeThen } from '../core/util/promises';
export { mapApp_remove, mapArray_get, mapArray_set } from '../core/v2/client/vnode';
export {
  convertStyleIdsArrayToString,
  convertStyleIdsStringToArray,
  isClassAttr,
} from '../core/v2/shared/scoped-styles';
export { DEBUG_TYPE, VirtualType, QContainerValue } from '../core/v2/shared/types';
export { VNodeDataChar } from '../core/v2/shared/vnode-data-types';
export { VNodeDataSeparator } from '../core/v2/shared/vnode-data-types';
export { escapeHTML } from '../core/v2/shared/character-escaping';
