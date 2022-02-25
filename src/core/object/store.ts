import { assertDefined } from '../assert/assert';
import { JSON_OBJ_PREFIX } from '../json/q-json';
import { getContext } from '../props/props';
import { ELEMENT_ID, ELEMENT_ID_SELECTOR, QObjAttr, QObjSelector } from '../util/markers';
import { qDev } from '../util/qdev';
import { QOjectSubsSymbol, QOjectTargetSymbol, _restoreQObject } from './q-object';

export interface Store {
  doc: Document;
  objs: Record<string, any>;
}

export function QStore_hydrate(doc: Document) {
  const script = doc.querySelector('script[type="qwik/json"]');
  (doc as any).qDehydrate = () => QStore_dehydrate(doc);
  if (script) {
    script.parentElement!.removeChild(script);
    const meta = JSON.parse(script.textContent || '{}') as any;
    const elements = new Map<string, Element>();
    doc.querySelectorAll(ELEMENT_ID_SELECTOR).forEach((el) => {
      const id = el.getAttribute(ELEMENT_ID)!;
      elements.set('#' + id, el);
    });

    reviveQObjects(meta.objs, meta.subs, elements);
    reviveNestedQObjects(meta.objs, meta.objs);

    doc.querySelectorAll(QObjSelector).forEach((el) => {
      const qobj = el.getAttribute(QObjAttr);
      const ctx = getContext(el);
      qobj!.split(' ').forEach((part) => {
        const obj = meta.objs[strToInt(part)];
        ctx.refMap.add(obj);
      });
    });
  }
}

/**
 * Serialize the current state of the application into DOM
 *
 * @param doc
 */
export function QStore_dehydrate(doc: Document) {
  const objSet = new Set<any>();

  // Find all Elements which have qObjects attached to them
  const elements = doc.querySelectorAll(QObjSelector);
  elements.forEach((node) => {
    const props = getContext(node);
    const qMap = props.refMap;
    qMap.array.forEach((v) => {
      collectQObjects(v, objSet);
    });
  });

  // Convert objSet to array
  const objArray = Array.from(objSet);
  objArray.sort((a, b) => {
    const isProxyA = a[QOjectTargetSymbol] !== undefined ? 0 : 1;
    const isProxyB = b[QOjectTargetSymbol] !== undefined ? 0 : 1;
    return isProxyA - isProxyB;
  });

  const objs = objArray.map((a) => {
    return a[QOjectTargetSymbol] ?? a;
  });

  const elementToIndex = new Map<Element, string>();

  const subs = objArray
    .map((a) => {
      const subs = a[QOjectSubsSymbol] as Map<Element, Set<string>>;
      if (subs) {
        return Object.fromEntries(
          Array.from(subs.entries()).map(([el, set]) => {
            if (el.isConnected) {
              let id = elementToIndex.get(el);
              if (id === undefined) {
                id = intToStr(elementToIndex.size);
                el.setAttribute(ELEMENT_ID, id);
                id = '#' + id;
                elementToIndex.set(el, id);
              }
              return [id, Array.from(set)];
            } else {
              return [undefined, undefined];
            }
          })
        );
      } else {
        return null;
      }
    })
    .filter((a) => !!a);

  const objToId = new Map<any, number>();
  let count = 0;
  for (const obj of objs) {
    objToId.set(obj, count);
    count++;
  }

  const data = {
    objs,
    subs,
  };

  // Write back to the dom
  elements.forEach((node) => {
    const props = getContext(node);
    const attribute = props.refMap.array.map((obj) => {
      const idx = objToId.get(obj[QOjectTargetSymbol])!;
      assertDefined(idx);
      return intToStr(idx);
    }).join(' ');
    node.setAttribute(QObjAttr, attribute);
  });

  // Serialize
  const script = doc.createElement('script');
  script.setAttribute('type', 'qwik/json');
  script.textContent = JSON.stringify(
    data,
    function (this: any, key: string, value: any) {
      if (key.startsWith('__')) return undefined;
      if (this === objs) return value;

      const idx = objToId.get(value);
      if (idx !== undefined) {
        return JSON_OBJ_PREFIX + intToStr(idx);
      }
      return elementToIndex.get(value) ?? value;
    },
    qDev ? '  ' : undefined
  );

  doc.body.appendChild(script);
}

function reviveQObjects(objs: object[], subs: any[], elementMap: Map<string, Element>) {
  for (let i = 0; i < objs.length; i++) {
    const sub = subs[i];
    if (sub) {
      const value = objs[i];
      const converted = new Map(
        Object.entries(sub).map((entry) => {
          const el = elementMap.get(entry[0])!;
          assertDefined(el);
          const set = new Set(entry[1] as any) as Set<string>;
          return [el, set];
        })
      );
      objs[i] = _restoreQObject(value, converted);
    }
  }
}

function reviveNestedQObjects(obj: any, map: object[]) {
  if (obj && typeof obj == 'object') {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const value = obj[i];
        if (typeof value == 'string' && value.startsWith(JSON_OBJ_PREFIX)) {
          obj[i] = map[strToInt(value.slice(JSON_OBJ_PREFIX.length))];
        } else {
          reviveNestedQObjects(value, map);
        }
      }
    } else {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          if (typeof value == 'string' && value.startsWith(JSON_OBJ_PREFIX)) {
            obj[key] = map[strToInt(value.slice(JSON_OBJ_PREFIX.length))];
          } else {
            reviveNestedQObjects(value, map);
          }
        }
      }
    }
  }
}

function collectQObjects(obj: any, seen: Set<any>) {
  if (obj && typeof obj == 'object') {
    if (seen.has(obj)) return;
    seen.add(obj);
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        collectQObjects(obj[i], seen);
      }
    } else {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          collectQObjects(value, seen);
        }
      }
    }
  }
}

export const intToStr = (nu: number) => {
  return nu.toString(36);
}

export const strToInt = (nu: string) => {
  return parseInt(nu, 36);
}