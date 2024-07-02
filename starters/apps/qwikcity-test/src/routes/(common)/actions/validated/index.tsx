import { component$ } from "@builder.io/qwik";
import {
  routeAction$,
  routeLoader$,
  validator$,
  z,
  zod$,
} from "@builder.io/qwik-city";
import type {
  CommonLoaderActionOptions,
  JSONObject,
  RequestEventAction,
  ValidatorErrorType,
} from "packages/qwik-city/runtime/src/types";

type TypedDataValidatorError = ValidatorErrorType<{
  category: "bird" | "dog" | "rat";
}>;

const typedDataValidator = zod$({
  category: z.enum(["bird", "dog", "rat"]),
});

interface DataValidatorError {
  message: string;
}

const dataValidator = validator$((ev) => {
  if (ev.query.get("secret") === "123") {
    return {
      success: true,
    };
  }
  return {
    success: false,
    error: {
      message: "Secret not found",
    } as DataValidatorError,
  };
});

interface ActionSuccessObject {
  actionSuccess: string;
}

interface ActionFailedObject {
  actionFail: string;
}

const actionQrl = (data: JSONObject, { fail }: RequestEventAction) => {
  if (Math.random() > 0.5) {
    return fail(500, {
      actionFail: "secret",
    } as ActionFailedObject);
  }

  return {
    actionSuccess: "シマエナガ",
  } as ActionSuccessObject;
};

export const useLoader = routeLoader$(() => {
  return {
    stuff: "hello",
  };
}, dataValidator);

export const useAction1 = routeAction$(actionQrl, {
  validation: [typedDataValidator, dataValidator],
} as CommonLoaderActionOptions);
export const useAction2 = routeAction$(actionQrl, {
  validation: [typedDataValidator],
} as CommonLoaderActionOptions);
export const useAction3 = routeAction$(actionQrl, {
  validation: [dataValidator],
} as CommonLoaderActionOptions);
export const useAction4 = routeAction$(
  actionQrl,
  typedDataValidator,
  dataValidator,
);
export const useAction5 = routeAction$(actionQrl, typedDataValidator);
export const useAction6 = routeAction$(actionQrl, dataValidator);
export const useAction7 = routeAction$(actionQrl);
export const useAction8 = routeAction$(actionQrl, { id: "id-action-8" });

export default component$(() => {
  const loader = useLoader();

  // Use options object, use typed data validator, use data validator
  const action1 = useAction1();
  if (action1.value) {
    if (action1.value.failed) {
      action1.value satisfies { failed: true } & (
        | TypedDataValidatorError
        | DataValidatorError
        | ActionFailedObject
      );
    } else {
      action1.value satisfies ActionSuccessObject;
    }
  }

  // Use options object, use typed data validator
  const action2 = useAction2();
  if (action2.value) {
    if (action2.value.failed) {
      action2.value satisfies { failed: true } & (
        | TypedDataValidatorError
        | ActionFailedObject
      );
    } else {
      action2.value satisfies ActionSuccessObject;
    }
  }

  // Use options object, use data validator
  const action3 = useAction3();
  if (action3.value) {
    if (action3.value.failed) {
      action3.value satisfies { failed: true } & (
        | DataValidatorError
        | ActionFailedObject
      );
    } else {
      action3.value satisfies ActionSuccessObject;
    }
  }

  // Use typed data validator, use data validator
  const action4 = useAction4();
  if (action4.value) {
    if (action4.value.failed) {
      action4.value satisfies { failed: true } & (
        | TypedDataValidatorError
        | DataValidatorError
        | ActionFailedObject
      );
    } else {
      action4.value satisfies ActionSuccessObject;
    }
  }

  // Use typed data validator
  const action5 = useAction5();
  if (action5.value) {
    if (action5.value.failed) {
      action5.value satisfies { failed: true } & (
        | TypedDataValidatorError
        | ActionFailedObject
      );
    } else {
      action5.value satisfies ActionSuccessObject;
    }
  }

  // Use data validator
  const action6 = useAction6();
  if (action6.value) {
    if (action6.value.failed) {
      action6.value satisfies { failed: true } & (
        | DataValidatorError
        | ActionFailedObject
      );
    } else {
      action6.value satisfies ActionSuccessObject;
    }
  }

  // No validators
  const action7 = useAction7();
  if (action7.value) {
    if (action7.value.failed) {
      action7.value satisfies { failed: true } & ActionFailedObject;
    } else {
      action7.value satisfies ActionSuccessObject;
    }
  }

  // No validators, with action id
  const action8 = useAction7();
  if (action8.value) {
    if (action8.value.failed) {
      action8.value satisfies { failed: true } & ActionFailedObject;
    } else {
      action8.value satisfies ActionSuccessObject;
    }
  }

  return (
    <div>
      <h1>Validated</h1>
      {loader.value.failed ? (
        <div>
          <p>Failed</p>
          <p>{loader.value.message}</p>
        </div>
      ) : (
        <div>
          <p>Success</p>
          <p>{loader.value.stuff}</p>
        </div>
      )}
    </div>
  );
});
