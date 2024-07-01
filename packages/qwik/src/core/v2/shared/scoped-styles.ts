import type { Props } from '../../render/jsx/jsx-runtime';
import { styleContent } from '../../style/qrl-styles';

export function hasClassAttr(props: Props): boolean {
  for (const key in props) {
    if (Object.prototype.hasOwnProperty.call(props, key) && isClassAttr(key)) {
      return true;
    }
  }
  return false;
}

export function isClassAttr(key: string): boolean {
  return key === 'class' || key === 'className';
}

export function getScopedStyleIdsAsPrefix(scopedStyleIds: Set<string>): string {
  return Array.from(scopedStyleIds)
    .map((styleId) => styleContent(styleId))
    .join(' ');
}

export function convertStyleIdsStringToArray(scopedStyleIds?: string | null): Array<string> | null {
  return scopedStyleIds?.split(' ') ?? null;
}

export function convertStyleIdsArrayToString(scopedStyleIds: Array<string>): string {
  return scopedStyleIds.join(' ');
}

export const addComponentStylePrefix = (styleId?: string | null): string | null => {
  if (styleId) {
    let idx = 0;
    do {
      styleId = styleId.substring(0, idx) + styleContent(styleId.substring(idx));
    } while ((idx = styleId.indexOf(' ', idx) + 1) !== 0);
  }
  return styleId || null;
};
