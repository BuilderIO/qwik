import { component$ } from "@builder.io/qwik";
import { routeAction$, zod$, z } from "@builder.io/qwik-city";
import type { ValidatorErrorType } from "packages/qwik-city/runtime/src/types";

// This is a TypeScript type validation test only.

interface MyObject {
  value: number;
  optional?: string;
}

export const useSimpleObjectAction = routeAction$(
  async () => ({ value: 42 }) as MyObject,
);

export const useZodObjectAction = routeAction$(
  async () => ({ value: 42 }) as MyObject,
  zod$({ name: z.string() }),
);

export default component$(() => {
  const fooAction = useSimpleObjectAction();
  const fooValue = fooAction.value!;
  fooValue satisfies MyObject;

  const zodAction = useZodObjectAction();
  const zodValue = zodAction.value!;
  if (zodValue.failed) {
    zodValue satisfies { failed: true } & ValidatorErrorType<{
      name: string;
    }>;
  } else {
    zodValue satisfies MyObject;
  }
  return <>TEST</>;
});
