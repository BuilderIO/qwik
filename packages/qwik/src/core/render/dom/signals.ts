import type { SubscriberSignal } from '../../state/common';
import { tryGetContext } from '../../state/context';
import { jsxToString, serializeClassWithHost, stringifyStyle } from '../execute-component';
import type { RenderStaticContext } from '../types';
import { setProperty } from './operations';
// import { getVdom } from './render-dom';
import { smartSetProperty, SVG_NS } from './visitor';

export const executeSignalOperation = (
  staticCtx: RenderStaticContext,
  operation: SubscriberSignal
) => {
  try {
    const type = operation[0];
    switch (type) {
      case 1:
      case 2: {
        let elm;
        let hostElm;
        if (type === 1) {
          elm = operation[1];
          hostElm = operation[3];
        } else {
          elm = operation[3];
          hostElm = operation[1];
        }

        if (tryGetContext(elm) == null) {
          return;
        }
        const prop = operation[4];
        const isSVG = elm.namespaceURI === SVG_NS;
        let value = operation[2].value;
        if (prop === 'class') {
          value = serializeClassWithHost(value, tryGetContext(hostElm));
        } else if (prop === 'style') {
          value = stringifyStyle(value);
        }
        return smartSetProperty(staticCtx, elm, prop, value, isSVG);
      }
      case 3:
      case 4: {
        let elm;
        if (type === 3) {
          elm = operation[1];
          // hostElm = operation[3];
        } else {
          elm = operation[3];
          // hostElm = operation[1];
        }
        if (!staticCtx.$visited$.includes(elm)) {
          const value = operation[2].value;
          return setProperty(staticCtx, elm, 'data', jsxToString(value));
        }
      }
    }
  } catch (e) {
    // Ignore
  }
};

// export const executeSignalOperation = (
//   staticCtx: RenderStaticContext,
//   operation: SubscriberSignal
// ) => {
//   try {
//     const type = operation[0];
//     switch (type) {
//       case 1:
//       case 2: {
//         let elm;
//         let hostElm;
//         if (type === 1) {
//           elm = operation[1];
//           hostElm = operation[3];
//         } else {
//           elm = operation[3];
//           hostElm = operation[1];
//         }
//         const elCtx = tryGetContext(elm);
//         if (elCtx == null) {
//           return;
//         }
//         const prop = operation[4];
//         const isSVG = elm.namespaceURI === SVG_NS;
//         let value = operation[2].value;
//         if (prop === 'class') {
//           value = serializeClassWithHost(value, tryGetContext(hostElm));
//         } else if (prop === 'style') {
//           value = stringifyStyle(value);
//         }
//         // const vdom = getVdom(elCtx);
//         // if (vdom.$props$[prop] === value) {
//         //   return;
//         // }
//         // vdom.$props$[prop] = value;
//         return smartSetProperty(staticCtx, elm, prop, value, isSVG);
//       }
//       case 3:
//       case 4: {
//         let elm: Text;
//         if (type === 3) {
//           elm = operation[1] as Text;
//           // hostElm = operation[3];
//         } else {
//           elm = operation[3] as Text;
//           // hostElm = operation[1];
//         }
//         if (!staticCtx.$visited$.includes(elm)) {
//           // const vdom = getVdom(elm);
//           const value = operation[2].value;
//           // if (vdom.$text$ === value) {
//           //   return;
//           // }
//           return setProperty(staticCtx, elm, 'data', jsxToString(value));
//         }
//       }
//     }
//   } catch (e) {
//     // Ignore
//   }
// };
