/* eslint-disable */
import {
  component$,
  createContextId,
  useContext,
  useContextProvider,
  useStore,
  useTask$,
} from "@builder.io/qwik";
import { isBrowser, isServer } from "@builder.io/qwik/build";

export const CTX = createContextId<{ message: string; count: number }>(
  "toggle",
);

export const CTX_LOCAL = createContextId<{ logs: string }>("logs");

export const Toggle = component$(() => {
  const store = useStore({
    message: "hello from root",
    count: 0,
  });
  useContextProvider(CTX, store);
  return (
    <div>
      <button id="increment" type="button" onClick$={() => store.count++}>
        Root increment
      </button>
      <ToggleShell />
    </div>
  );
});

export const ToggleShell = component$(() => {
  const store = useStore({
    cond: false,
    a: 2,
    logs: "",
  });

  useContextProvider(CTX_LOCAL, store);

  console.log("PARENT renders");
  return (
    <div>
      <Logs0 store={store} />
      {!store.cond ? <ToggleA root={store} /> : <ToggleB root={store} />}
      <button
        type="button"
        id="toggle"
        onClick$={() => (store.cond = !store.cond)}
      >
        Toggle
      </button>
    </div>
  );
});

export const Logs0 = component$((props: Record<string, any>) => {
  const rootState = useContext(CTX);
  const logs = useContext(CTX_LOCAL);

  useTask$(({ track }) => {
    const count = track(() => rootState.count);
    console.log("changed");
    logs.logs += `Log(${count})`;
  });
  console.log("created");

  return (
    <div>
      <Logs1 store={props.store} />
    </div>
  );
});

export const Logs1 = component$((props: Record<string, any>) => {
  return (
    <div>
      <Logs2 message={props.store.logs} />
    </div>
  );
});

export const Logs2 = component$((props: Record<string, any>) => {
  return <div id="logs">Logs: {props.message}</div>;
});

export const ToggleA = component$((props: { root: { logs: string } }) => {
  console.log("ToggleA renders");
  const rootState = useContext(CTX);

  const state = useStore({
    mount: "",
    copyCount: 0,
  });

  useTask$(({ cleanup }) => {
    if (state.mount !== "") {
      throw new Error("already mounted");
    }
    if (isServer) {
      state.mount = "mounted in server";
    }
    if (isBrowser) {
      state.mount = "mounted in client";
    }
    cleanup(() => {
      props.root.logs += "ToggleA()";
    });
  });

  useTask$(({ track }) => {
    track(() => rootState.count);
    state.copyCount = rootState.count;
  });

  return (
    <div>
      <h1>ToggleA</h1>
      <div id="mount">{state.mount}</div>
      <div id="root">
        {rootState.message} ({rootState.count}/{state.copyCount})
      </div>
      <Child />
    </div>
  );
});

export const ToggleB = component$((props: { root: { logs: string } }) => {
  console.log("ToggleB renders");
  const rootState = useContext(CTX);

  const state = useStore({
    mount: "",
    copyCount: 0,
  });

  useTask$(({ track }) => {
    state.copyCount = track(() => rootState.count);
  });

  useTask$(({ cleanup }) => {
    if (state.mount !== "") {
      throw new Error("already mounted");
    }
    if (isServer) {
      state.mount = "mounted in server";
    }
    if (isBrowser) {
      state.mount = "mounted in client";
    }
    cleanup(() => {
      props.root.logs += "ToggleB()";
    });
  });

  return (
    <div>
      <h1>ToggleB</h1>
      <div id="mount">{state.mount}</div>
      <div id="root">
        {rootState.message} ({rootState.count}/{state.copyCount})
      </div>
      <Child />
    </div>
  );
});

export const Child = component$(() => {
  const rootState = useContext(CTX);
  const logs = useContext(CTX_LOCAL);

  useTask$(({ track }) => {
    const count = track(() => rootState.count);
    console.log("Child", count);
    // TODO: (Shai) this is the problematic line 👇
    logs.logs += `Child(${count})`;
  });

  return <div>CHILD</div>;
});
