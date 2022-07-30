import { isQrl } from '../core/import/qrl-class';
import { stringifyClassOrStyle } from '../core/props/props';
import { promiseAll, then } from '../core/util/promises';
import type { ValueOrPromise } from '../core/util/types';

interface StaticRenderContex {
  enqueue(chunk: string): void;
}

type StaticFactory = (ctx: StaticRenderContex) => Promise<void>;

export const createElement = (segments: any[] | Function): StaticFactory => {
  return async (ctx) => {
    if (typeof segments === 'function') {
      return segments(ctx);
    } else {
      for (const value of segments) {
        const t = typeof value;
        if (t === 'number') {
          ctx.enqueue(String(value));
        } else if (t === 'string') {
          ctx.enqueue(value);
        } else if (t === 'function') {
          await value(ctx);
        }
      }
    }
  };
};

type Factory = (attrs: Record<string, any>) => ValueOrPromise<StaticFactory | null>;

export const createVirtual = (factory: Factory, attributes: Record<string, any>): StaticFactory => {
  return async (ctx) => {
    const generator = await factory(attributes);
    if (generator) {
      return generator(ctx);
    }
  };
};

export const renderToString = async (root: StaticFactory): Promise<string> => {
  const chunks: string[] = [];

  const ctx: StaticRenderContex = {
    enqueue(chunk) {
      chunks.push(chunk);
    },
  };
  await root(ctx);
  return chunks.join('');
};

export const createProp = (key: string, value: any) => {
  return (ctx: StaticRenderContex) => {
    const t = typeof value;
    if (key === 'class' || key === 'classname') {
      ctx.enqueue(stringifyClassOrStyle(value, true));
    } else if (key === 'style') {
      ctx.enqueue(stringifyClassOrStyle(value, false));
    } else if (value === true) {
      ctx.enqueue(` ${key}`);
    } else if (t === 'string') {
      ctx.enqueue(` ${key}=${JSON.stringify(value)}`);
    } else if (t === 'number') {
      ctx.enqueue(` ${key}=${String(value)}`);
    } else if (t === 'object' && isQrl(t)) {
      ctx.enqueue(` ${key}=${JSON.stringify(t.serialize({}))}`);
    }
  };
};
