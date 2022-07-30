import { ComponentStylesPrefixContent, ComponentStylesPrefixHost } from '../util/markers';
import { hashCode } from '../util/hash_code';
import type { QRL } from '../import/qrl.public';

/**
 * @public
 */
export const styleKey = (qStyles: QRL<string>, index: number): string => {
  return `${hashCode(qStyles.getHash())}-${index}`;
};

/**
 * @public
 */
export const styleHost = (styleId: string | null): string | null => {
  if (styleId !== null) {
    return ComponentStylesPrefixHost + styleId;
  } else {
    return null;
  }
};

/**
 * @public
 */
export const styleContent = (styleId: string): string | null => {
  if (styleId !== null) {
    return ComponentStylesPrefixContent + styleId;
  } else {
    return null;
  }
};
