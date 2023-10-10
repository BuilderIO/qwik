import {
  $,
  implicit$FirstArg,
  noSerialize,
  type QRL,
  useContext,
  type ValueOrPromise,
  _wrapSignal,
  useStore,
  _serializeData,
  _deserializeData,
  _getContextElement,
  _getContextEvent,
} from '@builder.io/qwik';

import type { RequestEventLoader } from '../../middleware/request-handler/types';
import { QACTION_KEY } from './constants';
import { RouteStateContext } from './contexts';
import type {
  ActionConstructor,
  ZodConstructor,
  ValibotConstructor,
  JSONObject,
  RouteActionResolver,
  RouteLocation,
  Editable,
  ActionStore,
  RequestEvent,
  ActionInternal,
  LoaderInternal,
  RequestEventAction,
  CommonLoaderActionOptions,
  DataValidator,
  ValidatorReturn,
  LoaderConstructor,
  ValidatorConstructor,
  ActionConstructorQRL,
  LoaderConstructorQRL,
  ZodConstructorQRL,
  ValidatorConstructorQRL,
  ServerConstructorQRL,
  ValibotConstructorQRL,
  ValibotObjectShapeOrSchema,
  ValibotSchema,
  ValibotObjectShape,
} from './types';
import { useAction, useLocation, useQwikCityEnv } from './use-functions';
import { z } from 'zod';
import { objectAsync, safeParseAsync, flatten } from 'valibot';
import { isDev, isServer } from '@builder.io/qwik/build';
import type { FormSubmitCompletedDetail } from './form-component';
import type { BaseSchema, BaseSchemaAsync, ObjectShape, ObjectShapeAsync } from 'valibot';

/**
 * @public
 */
export const routeActionQrl = ((
  actionQrl: QRL<(form: JSONObject, event: RequestEventAction) => any>,
  ...rest: (CommonLoaderActionOptions | DataValidator)[]
) => {
  const { id, validators } = getValidators(rest, actionQrl);
  function action() {
    const loc = useLocation() as Editable<RouteLocation>;
    const currentAction = useAction();
    const initialState: Editable<Partial<ActionStore<any, any>>> = {
      actionPath: `?${QACTION_KEY}=${id}`,
      isRunning: false,
      status: undefined,
      value: undefined,
      formData: undefined,
    };
    const state = useStore<Editable<ActionStore<any, any>>>(() => {
      const value = currentAction.value;
      if (value && value?.id === id) {
        const data = value.data;
        if (data instanceof FormData) {
          initialState.formData = data;
        }
        if (value.output) {
          const { status, result } = value.output;
          initialState.status = status;
          initialState.value = result;
        }
      }
      return initialState as ActionStore<any, any>;
    });

    const submit = $((input: any | FormData | SubmitEvent = {}) => {
      if (isServer) {
        throw new Error(`Actions can not be invoked within the server during SSR.
Action.run() can only be called on the browser, for example when a user clicks a button, or submits a form.`);
      }
      let data: any;
      let form: HTMLFormElement | undefined;
      if (input instanceof SubmitEvent) {
        form = input.target as HTMLFormElement;
        data = new FormData(form);
        if (
          (input.submitter instanceof HTMLInputElement ||
            input.submitter instanceof HTMLButtonElement) &&
          input.submitter.name
        ) {
          if (input.submitter.name) {
            data.append(input.submitter.name, input.submitter.value);
          }
        }
      } else {
        data = input;
      }
      return new Promise<RouteActionResolver>((resolve) => {
        if (data instanceof FormData) {
          state.formData = data;
        }
        state.isRunning = true;
        loc.isNavigating = true;
        currentAction.value = {
          data,
          id,
          resolve: noSerialize(resolve),
        };
      }).then(({ result, status }) => {
        state.isRunning = false;
        state.status = status;
        state.value = result;
        if (form) {
          if (form.getAttribute('data-spa-reset') === 'true') {
            form.reset();
          }
          const detail = { status, value: result } satisfies FormSubmitCompletedDetail<any>;
          form.dispatchEvent(
            new CustomEvent('submitcompleted', {
              bubbles: false,
              cancelable: false,
              composed: false,
              detail: detail,
            })
          );
        }
        return {
          status: status,
          value: result,
        };
      });
    });
    initialState.submit = submit;

    return state;
  }
  action.__brand = 'server_action' as const;
  action.__validators = validators;
  action.__qrl = actionQrl;
  action.__id = id;
  Object.freeze(action);

  return action satisfies ActionInternal;
}) as unknown as ActionConstructorQRL;

/**
 * @public
 */
export const globalActionQrl = ((
  actionQrl: QRL<(form: JSONObject, event: RequestEventAction) => any>,
  ...rest: (CommonLoaderActionOptions | DataValidator)[]
) => {
  const action = (routeActionQrl as any)(actionQrl, ...rest);
  if (isServer) {
    if (typeof (globalThis as any)._qwikActionsMap === 'undefined') {
      (globalThis as any)._qwikActionsMap = new Map();
    }
    (globalThis as any)._qwikActionsMap.set(action.__id, action);
  }
  return action;
}) as ActionConstructorQRL;

/**
 * @public
 */
export const routeAction$: ActionConstructor = /*#__PURE__*/ implicit$FirstArg(
  routeActionQrl
) as any;

/**
 * @public
 */
export const globalAction$: ActionConstructor = /*#__PURE__*/ implicit$FirstArg(
  globalActionQrl
) as any;

/**
 * @public
 */
export const routeLoaderQrl = ((
  loaderQrl: QRL<(event: RequestEventLoader) => unknown>,
  ...rest: (CommonLoaderActionOptions | DataValidator)[]
): LoaderInternal => {
  const { id, validators } = getValidators(rest, loaderQrl);
  function loader() {
    return useContext(RouteStateContext, (state) => {
      if (!(id in state)) {
        throw new Error(`routeLoader$ "${loaderQrl.getSymbol()}" was invoked in a route where it was not declared.
    This is because the routeLoader$ was not exported in a 'layout.tsx' or 'index.tsx' file of the existing route.
    For more information check: https://qwik.builder.io/qwikcity/route-loader/`);
      }
      return _wrapSignal(state, id);
    });
  }
  loader.__brand = 'server_loader' as const;
  loader.__qrl = loaderQrl;
  loader.__validators = validators;
  loader.__id = id;
  Object.freeze(loader);

  return loader;
}) as LoaderConstructorQRL;

/**
 * @public
 */
export const routeLoader$: LoaderConstructor = /*#__PURE__*/ implicit$FirstArg(routeLoaderQrl);

/**
 * @public
 */
export const validatorQrl = ((
  validator: QRL<(ev: RequestEvent, data: unknown) => ValueOrPromise<ValidatorReturn>>
): DataValidator => {
  if (isServer) {
    return {
      validate: validator,
    };
  }
  return undefined as any;
}) as ValidatorConstructorQRL;

/**
 * @public
 */
export const validator$: ValidatorConstructor = /*#__PURE__*/ implicit$FirstArg(validatorQrl);

/**
 * @public
 */
export const valibotQrl = ((
  qrl: QRL<ValibotObjectShapeOrSchema | ((ev: RequestEvent) => ValibotObjectShapeOrSchema)>
): DataValidator => {
  if (isServer) {
    return {
      async validate(ev, inputData) {
        const data = inputData ?? (await ev.parseBody());
        const schema: Promise<ValibotSchema> = qrl.resolve().then((obj) => {
          if (typeof obj === 'function') {
            obj = obj(ev);
          }

          if (typeof obj._parse === 'function') {
            return obj as ValibotSchema;
          } else {
            return objectAsync(obj as ValibotObjectShape);
          }
        });

        const result = await safeParseAsync(await schema, data);
        if (result.success) {
          return result;
        } else {
          if (isDev) {
            console.error(
              '\nVALIDATION ERROR\naction$() Valibot validation failed.',
              '\n  - Issues:',
              result.issues
            );
          }
          return {
            success: false,
            status: 400,
            error: flatten(result.issues),
          };
        }
      },
    };
  }
  return undefined as any;
}) as ValibotConstructorQRL;

/**
 * @public
 */
export const valibot$: ValibotConstructor = /*#__PURE__*/ implicit$FirstArg(valibotQrl);

/**
 * @public
 */
export const zodQrl = ((
  qrl: QRL<
    z.ZodRawShape | z.Schema | ((z: typeof import('zod').z, ev: RequestEvent) => z.ZodRawShape)
  >
): DataValidator => {
  if (isServer) {
    return {
      async validate(ev, inputData) {
        const schema: Promise<z.Schema> = qrl.resolve().then((obj) => {
          if (typeof obj === 'function') {
            obj = obj(z, ev);
          }
          if (obj instanceof z.Schema) {
            return obj;
          } else {
            return z.object(obj);
          }
        });
        const data = inputData ?? (await ev.parseBody());
        const result = await (await schema).safeParseAsync(data);
        if (result.success) {
          return result;
        } else {
          if (isDev) {
            console.error(
              '\nVALIDATION ERROR\naction$() zod validated failed',
              '\n  - Issues:',
              result.error.issues
            );
          }
          return {
            success: false,
            status: 400,
            error: result.error.flatten(),
          };
        }
      },
    };
  }
  return undefined as any;
}) as ZodConstructorQRL;

/**
 * @public
 */
export const zod$: ZodConstructor = /*#__PURE__*/ implicit$FirstArg(zodQrl) as any;

/**
 * @public
 */
export const serverQrl: ServerConstructorQRL = (qrl: QRL<(...args: any[]) => any>) => {
  if (isServer) {
    const captured = qrl.getCaptured();
    if (captured && captured.length > 0 && !_getContextElement()) {
      throw new Error('For security reasons, we cannot serialize QRLs that capture lexical scope.');
    }
  }

  function stuff() {
    return $(async function (this: any, ...args: any[]) {
      const signal =
        args.length > 0 && args[0] instanceof AbortSignal
          ? (args.shift() as AbortSignal)
          : undefined;
      if (isServer) {
        const requestEvent = [useQwikCityEnv()?.ev, this, _getContextEvent()].find(
          (v) =>
            v &&
            Object.prototype.hasOwnProperty.call(v, 'sharedMap') &&
            Object.prototype.hasOwnProperty.call(v, 'cookie')
        );
        return qrl.apply(requestEvent, args);
      } else {
        const ctxElm = _getContextElement();
        const filtered = args.map((arg) => {
          if (arg instanceof SubmitEvent && arg.target instanceof HTMLFormElement) {
            return new FormData(arg.target);
          } else if (arg instanceof Event) {
            return null;
          } else if (arg instanceof Node) {
            return null;
          }
          return arg;
        });
        const hash = qrl.getHash();
        const res = await fetch(`?qfunc=${hash}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/qwik-json',
            'X-QRL': hash,
          },
          signal,
          body: await _serializeData([qrl, ...filtered], false),
        });

        const contentType = res.headers.get('Content-Type');
        if (res.ok && contentType === 'text/qwik-json-stream' && res.body) {
          return (async function* () {
            try {
              for await (const result of deserializeStream(
                res.body!,
                ctxElm ?? document.documentElement,
                signal
              )) {
                yield result;
              }
            } finally {
              if (!signal?.aborted) {
                await res.body!.cancel();
              }
            }
          })();
        } else if (contentType === 'application/qwik-json') {
          const str = await res.text();
          const obj = await _deserializeData(str, ctxElm ?? document.documentElement);
          if (res.status === 500) {
            throw obj;
          }
          return obj;
        }
      }
    }) as any;
  }
  return stuff();
};

/**
 * @public
 */
export const server$ = /*#__PURE__*/ implicit$FirstArg(serverQrl);

const getValidators = (rest: (CommonLoaderActionOptions | DataValidator)[], qrl: QRL<any>) => {
  let id: string | undefined;
  const validators: DataValidator[] = [];
  if (rest.length === 1) {
    const options = rest[0];
    if (options && typeof options === 'object') {
      if ('validate' in options) {
        validators.push(options);
      } else {
        id = options.id;
        if (options.validation) {
          validators.push(...options.validation);
        }
      }
    }
  } else if (rest.length > 1) {
    validators.push(...(rest.filter((v) => !!v) as any));
  }

  if (typeof id === 'string') {
    if (isDev) {
      if (!/^[\w/.-]+$/.test(id)) {
        throw new Error(`Invalid id: ${id}, id can only contain [a-zA-Z0-9_.-]`);
      }
    }
    id = `id_${id}`;
  } else {
    id = qrl.getHash();
  }
  return {
    validators: validators.reverse(),
    id,
  };
};

const deserializeStream = async function* (
  stream: ReadableStream<Uint8Array>,
  ctxElm: unknown,
  signal?: AbortSignal
) {
  const reader = stream.getReader();
  try {
    let buffer = '';
    const decoder = new TextDecoder();
    while (!signal?.aborted) {
      const result = await reader.read();
      if (result.done) {
        break;
      }
      buffer += decoder.decode(result.value, { stream: true });
      const lines = buffer.split(/\n/);
      buffer = lines.pop()!;
      for (const line of lines) {
        yield await _deserializeData(line, ctxElm);
      }
    }
  } finally {
    reader.releaseLock();
  }
};
