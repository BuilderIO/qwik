import { component$, jsx, SkipRerender, useContext } from '@builder.io/qwik';
import { ContentInternalContext } from './contexts';

/**
 * @public
 */
export const Content = component$(() => {
  const { contents } = useContext(ContentInternalContext);
  const contentsLen = contents.length;

  if (contentsLen > 0) {
    let cmp: any = jsx(contents[contentsLen - 1].default, {});

    for (let i = contentsLen - 2; i >= 0; i--) {
      cmp = jsx(contents[i].default, {
        children: cmp,
      });
    }

    return cmp;
  }

  return jsx(SkipRerender, {});
});
