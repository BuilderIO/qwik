import { assertDefined } from '../assert/assert';
import { getInvokeContext } from './use-core';

// <docs markdown="../readme.md#useHostElement">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#useHostElement instead)
/**
 * Retrieves the Host Element of the current component.
 *
 * NOTE: `useHostElement` method can only be used in the synchronous portion of the callback
 * (before any `await` statements.)
 *
 * ```tsx
 * const Section = component$(
 *   () => {
 *     const hostElement = useHostElement();
 *     console.log(hostElement); // hostElement is a HTMLSectionElement
 *
 *     return <Host>I am a section</Host>;
 *   },
 *   {
 *     tagName: 'section',
 *   }
 * );
 * ```
 *
 * @public
 */
// </docs>
export function useHostElement(): Element {
  const element = getInvokeContext().hostElement!;
  assertDefined(element);
  return element;
}
