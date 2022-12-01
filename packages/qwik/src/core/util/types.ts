/**
 * @private
 */
export const isHtmlElement = (node: any): node is Element => {
  return node ? node.nodeType === 1 : false;
};

export const isSerializableObject = (v: any) => {
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};

export const isObject = (v: any): v is any => {
  return v && typeof v === 'object';
};

export const isArray = (v: any): v is any[] => {
  return Array.isArray(v);
};

export const isString = (v: any): v is string => {
  return typeof v === 'string';
};

export const isFunction = (v: any): v is Function => {
  return typeof v === 'function';
};

export const isNumber = (v: any): v is number => {
  return typeof v === 'number';
};

export const isBoolean = (v: any): v is boolean => {
  return typeof v === 'boolean';
};

export const isSymbol = (v: any): v is symbol => {
  return typeof v === 'symbol';
};

export const isDef = (v: any): v is any => {
  return v !== undefined;
};

/**
 * Type representing a value which is either resolve or a promise.
 * @public
 */
export type ValueOrPromise<T> = T | Promise<T>;
