import { parseQRL, stringifyQRL } from '../import/qrl';
import { isQrl, QRLInternal } from '../import/qrl-class';
import type { ContainerState } from '../render/notify-render';
import { isResourceReturn, parseResourceReturn, serializeResource } from '../use/use-resource';
import {
  isSubscriberDescriptor,
  parseWatch,
  ResourceReturn,
  serializeWatch,
  SubscriberDescriptor,
} from '../use/use-watch';
import { isDocument } from '../util/element';
import type { GetObject, GetObjID } from './store';

export interface Serializer<T> {
  test: (obj: any) => boolean;
  serialize?: (obj: T, getObjID: GetObjID, containerState: ContainerState) => string;
  prepare: (data: string, containerState: ContainerState, doc: Document) => T;
  fill?: (obj: T, getObject: GetObject, containerState: ContainerState) => void;
}

const UndefinedSerializer: Serializer<undefined> = {
  test: (obj) => obj === undefined,
  prepare: () => undefined,
};

const QRLSerializer: Serializer<QRLInternal> = {
  test: (v) => isQrl(v),
  serialize: (obj, getObjId, containerState) => {
    return stringifyQRL(obj, {
      $platform$: containerState.$platform$,
      $getObjId$: getObjId,
    });
  },
  prepare: (data, containerState) => {
    return parseQRL(data, containerState.$containerEl$);
  },
  fill: (qrl, getObject) => {
    if (qrl.$capture$ && qrl.$capture$.length > 0) {
      qrl.$captureRef$ = qrl.$capture$.map(getObject);
      qrl.$capture$ = null;
    }
  },
};

const DocumentSerializer: Serializer<Document> = {
  test: (v) => isDocument(v),
  prepare: (_, _c, doc) => {
    return doc;
  },
};

const ResourceSerializer: Serializer<ResourceReturn<any>> = {
  test: (v) => isResourceReturn(v),
  serialize: (obj, getObjId) => {
    return serializeResource(obj, getObjId);
  },
  prepare: (data) => {
    return parseResourceReturn(data);
  },
  fill: (resource, getObject) => {
    if (resource.state === 'resolved') {
      resource.resolved = getObject(resource.resolved);
      resource.promise = Promise.resolve(resource.resolved);
    }
  },
};

const WatchSerializer: Serializer<SubscriberDescriptor> = {
  test: (v) => isSubscriberDescriptor(v),
  serialize: (obj, getObjId) => serializeWatch(obj, getObjId),
  prepare: (data) => parseWatch(data) as any,
  fill: (watch, getObject) => {
    watch.$el$ = getObject(watch.$el$ as any);
    watch.$qrl$ = getObject(watch.$qrl$ as any);
    if (watch.$resource$) {
      watch.$resource$ = getObject(watch.$resource$ as any);
    }
  },
};

const URLSerializer: Serializer<URL> = {
  test: (v) => v instanceof URL,
  serialize: (obj) => obj.href,
  prepare: (data) => new URL(data),
};

const DateSerializer: Serializer<Date> = {
  test: (v) => v instanceof Date,
  serialize: (obj) => obj.toISOString(),
  prepare: (data) => new Date(data),
};

const RegexSerializer: Serializer<RegExp> = {
  test: (v) => v instanceof RegExp,
  serialize: (obj) => `${obj.flags} ${obj.source}`,
  prepare: (data) => {
    const space = data.indexOf(' ');
    const source = data.slice(space + 1);
    const flags = data.slice(0, space);
    return new RegExp(source, flags);
  },
};

const serializers: Serializer<any>[] = [
  UndefinedSerializer,
  QRLSerializer,
  DocumentSerializer,
  ResourceSerializer,
  WatchSerializer,
  URLSerializer,
  RegexSerializer,
  DateSerializer,
];

export const canSerialize = (obj: any): boolean => {
  for (const s of serializers) {
    if (s.test(obj)) {
      return true;
    }
  }
  return false;
};

export const serializeValue = (obj: any, getObjID: GetObjID, containerState: ContainerState) => {
  for (let i = 0; i < serializers.length; i++) {
    const s = serializers[i];
    if (s.test(obj)) {
      let value = String.fromCharCode(i);
      if (s.serialize) {
        value += s.serialize(obj, getObjID, containerState);
      }
      return value;
    }
  }
  return undefined;
};

export interface Parser {
  prepare(data: string): any;
  fill(obj: any): boolean;
}

export const createParser = (
  getObject: GetObject,
  containerState: ContainerState,
  doc: Document
): Parser => {
  const map = new Map<any, Serializer<any>>();
  return {
    prepare(data: string) {
      for (let i = 0; i < serializers.length; i++) {
        const s = serializers[i];
        const prefix = String.fromCodePoint(i);
        if (data.startsWith(prefix)) {
          const value = s.prepare(data.slice(prefix.length), containerState, doc);
          if (s.fill) {
            map.set(value, s);
          }
          return value;
        }
      }
      return data;
    },
    fill(obj: any) {
      const serializer = map.get(obj);
      if (serializer) {
        serializer.fill!(obj, getObject, containerState);
        return true;
      }
      return false;
    },
  };
};
