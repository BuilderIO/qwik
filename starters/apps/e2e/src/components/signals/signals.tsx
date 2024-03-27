import {
  component$,
  type Signal,
  useSignal,
  useStore,
  useVisibleTask$,
  useTask$,
  Slot,
  useStyles$,
  useResource$,
  type QwikIntrinsicElements,
  Resource,
  useComputed$,
} from "@builder.io/qwik";
import { delay } from "../resource/resource";
import {
  TestAC,
  TestACN,
  TestACNStr,
  TestACStr,
  TestC,
  TestCN,
  TestCNStr,
  TestCStr,
  TestCWithFlag,
} from "./utils/utils";
import { isBrowser } from "@builder.io/qwik/build";

export const Signals = component$(() => {
  const rerender = useSignal(0);
  return (
    <>
      <button id="rerender" onClick$={() => rerender.value++}>
        Rerender
      </button>
      <SignalsChildren key={rerender.value} />
    </>
  );
});
export const SignalsChildren = component$(() => {
  const ref = useSignal<Element>();
  const ref2 = useSignal<Element>();
  const id = useSignal(0);
  const signal = useSignal("");
  const renders = useStore(
    {
      count: 0,
    },
    { reactive: false },
  );
  const store = useStore({
    foo: 10,
    attribute: "even",
    signal,
  });

  const styles = useSignal("body { background: white}");

  useVisibleTask$(() => {
    ref.value!.setAttribute("data-set", "ref");
    ref2.value!.setAttribute("data-set", "ref2");
  });

  renders.count++;
  const rerenders = renders.count + 0;
  return (
    <div aria-label={store.attribute}>
      <button
        id="count"
        onClick$={() => {
          store.foo++;
          store.attribute = store.foo % 2 === 0 ? "even" : "odd";
        }}
      >
        Increment
      </button>
      <button
        id="click"
        onClick$={() => {
          signal.value = "clicked";
        }}
      >
        Click
      </button>
      <button
        id="increment-id"
        onClick$={() => {
          id.value++;
        }}
      >
        Increment ID
      </button>
      <button
        id="background"
        onClick$={() => {
          styles.value = "body { background: black }";
        }}
      >
        Black background
      </button>
      <div id="parent-renders">Parent renders: {rerenders}</div>
      <Child
        text="Message"
        count={store.foo}
        ref={ref}
        ref2={ref2}
        signal={signal}
        signal2={store.signal}
        id={id.value}
        styles={styles.value}
      />
      <Issue1681 />
      <Issue1733 />
      <SideEffect />
      <Issue1884 />
      <Issue2176 />
      <Issue2245 />
      <Issue2245B />
      <ComplexClassSignals />
      <Issue2311 />
      <Issue2344 />
      <Issue2928 />
      <Issue2930 />
      <Issue3212 />
      <FineGrainedTextSub />
      <FineGrainedUnsubs />
      <Issue3415 />
      <BindSignal />
      <Issue3482 />
      <Issue3663 />
      <Issue3440 />
      <Issue4174 />
      <Issue4249 />
      <Issue4228 />
      <Issue4368 />
      <Issue4868 />
      <Issue4979 />
    </div>
  );
});

interface ChildProps {
  count: number;
  text: string;
  ref: Signal<Element | undefined>;
  ref2: Signal<Element | undefined>;
  signal: Signal<string>;
  signal2: Signal<string>;
  id: number;
  styles: string;
}
export const Child = component$((props: ChildProps) => {
  const renders = useStore(
    {
      count: 0,
    },
    { reactive: false },
  );
  renders.count++;
  const rerenders = renders.count + 0;
  return (
    <>
      <div id="child-renders">Child renders: {rerenders}</div>
      <div id="text" ref={props.ref}>
        Text: {props.text}
      </div>
      <Id id={props.id} />
      <div id="computed">{"computed: " + props.signal.value}</div>
      <div id="stuff" ref={props.ref2}>
        Stuff: {props.count}
      </div>
      <style>{props.styles}</style>
      <textarea id="textarea" value={props.styles}></textarea>
    </>
  );
});

export const Id = (props: any) => <div id="id">Id: {props.id}</div>;

export const C = ({ who, count }: any) => (
  <>
    Count {who} is {count}
  </>
);

export const Issue1681 = component$(() => {
  const signal = useSignal(0);

  return (
    <div>
      <button id="issue-1681-btn" onClick$={() => signal.value++}>
        Click
      </button>{" "}
      <span id="issue-1681-return">
        <C who={"A"} count={signal.value} /> <C who={"B"} count={signal} />
      </span>
    </div>
  );
});

export const Issue1733 = component$(() => {
  const store = useStore({ open: false });
  return (
    <>
      <button id="issue1733-btn" onClick$={() => (store.open = !store.open)}>
        toggle
      </button>
      <p id="issue1733-signal">{store.open}</p>
      <p id="issue1733-false">{false}</p>
      <p id="issue1733-true">{true}</p>
      {store.open && <h1 id="issue1733-h1">Message</h1>}
    </>
  );
});

export const SideEffect = component$(() => {
  const signal = useSignal("initial");
  useTask$(async () => {
    await delay(100);
    signal.value = "set";
  });
  return (
    <>
      <div>{signal.value}</div>
    </>
  );
});

export const Issue1884 = component$(() => {
  const state = useStore({
    value: "",
    bool: false,
    counter: 0,
  });
  return (
    <>
      <button
        id="issue1884-btn"
        onClick$={() => {
          state.value = "test";
          state.counter++;
          state.bool = true;
        }}
      >
        Click me {state.counter}
      </button>
      <div>
        <Test active={state.value === "test"} />
        <Test active={state.bool ? true : false} />
        <Test active={state.bool} />
        <Test active={state.value} />
      </div>
    </>
  );
});

export const Test = component$(({ active }: { active: boolean | string }) => {
  return (
    <div class="issue1884-text" style={{ color: active && ("red" as any) }}>
      Should turn red
    </div>
  );
});

export const Issue2176 = component$(() => {
  const data = useSignal({ text: "testing", flag: false, num: 1 });
  const store = useStore({ text: "testing", flag: false, num: 1 });
  return (
    <div>
      <button
        id="issue-2176-btn"
        onClick$={() => {
          const nu = data.value.num + 1;
          const text = "testing" + nu;
          data.value = { text, flag: !data.value.flag, num: nu };
          store.num = nu;
          store.text = text;
          store.flag = !store.flag;
        }}
      >
        Click me to change the data
      </button>
      {/* <code>{JSON.stringify(data.value)}</code> */}

      <h2>Signal</h2>
      <ul>
        <li>
          <Test1
            text={data.value.text}
            flag={data.value.flag}
            num={data.value.num}
          >
            Nested value
          </Test1>
        </li>
        <li>
          <Test1Sig sig={data}>Raw </Test1Sig>
        </li>
        <li>
          <Test2
            text={`${data.value.text} flag=${data.value.flag ? "T" : "F"} num=${
              data.value.num
            }`}
          >
            Computed prop
          </Test2>
        </li>
        <li>
          <Test2Sig sig={data}>Raw + Computed</Test2Sig>
        </li>
        <li>
          <Test2Child>
            Slot{" "}
            <span class="issue-2176-result">
              {data.value.text} flag={data.value.flag ? "T" : "F"} num=
              {data.value.num}
            </span>
          </Test2Child>
        </li>
        <li>
          <Test2Child>
            Computed + Slot{" "}
            <span class="issue-2176-result">
              {`${data.value.text} flag=${data.value.flag ? "T" : "F"} num=${
                data.value.num
              }`}
            </span>
          </Test2Child>
        </li>
      </ul>

      <h2>Store</h2>
      <ul>
        <li>
          <Test1 text={store.text} flag={store.flag} num={store.num}>
            Nested value
          </Test1>
        </li>
        <li>
          <TestStore store={store}>Raw</TestStore>
        </li>
        <li>
          <Test2
            text={`${store.text} flag=${store.flag ? "T" : "F"} num=${
              store.num
            }`}
          >
            Computed prop
          </Test2>
        </li>
        <li>
          <Test2Store store={store}>Raw + Computed</Test2Store>
        </li>
        <li>
          <Test2Child>
            Slot{" "}
            <span class="issue-2176-result">
              {store.text} flag={store.flag ? "T" : "F"} num={store.num}
            </span>
          </Test2Child>
        </li>
        <li>
          <Test2Child>
            Computed + Slot{" "}
            <span class="issue-2176-result">
              {`${store.text} flag=${store.flag ? "T" : "F"} num=${store.num}`}
            </span>
          </Test2Child>
        </li>
      </ul>
    </div>
  );
});

export const Test1 = component$(
  (props: { text: string; flag: boolean; num: number }) => {
    return (
      <p>
        <Slot />{" "}
        <span class="issue-2176-result">
          {props.text} flag={props.flag ? "T" : "F"} num={props.num}
        </span>
      </p>
    );
  },
);
export const Test1Sig = component$((props: { sig: Signal }) => {
  return (
    <p>
      <Slot />{" "}
      <span class="issue-2176-result">
        {props.sig.value.text} flag={props.sig.value.flag ? "T" : "F"} num=
        {props.sig.value.num}
      </span>
    </p>
  );
});
export const TestStore = component$((props: { store: any }) => {
  return (
    <p>
      <Slot />{" "}
      <span class="issue-2176-result">
        {props.store.text} flag={props.store.flag ? "T" : "F"} num=
        {props.store.num}
      </span>
    </p>
  );
});
export const Test2 = component$((props: { text: string }) => {
  return (
    <p>
      <Slot /> <span class="issue-2176-result">{props.text}</span>
    </p>
  );
});
export const Test2Sig = component$((props: { sig: Signal }) => {
  return (
    <p>
      <Slot />{" "}
      <span class="issue-2176-result">
        {`${props.sig.value.text} flag=${
          props.sig.value.flag ? "T" : "F"
        } num=${props.sig.value.num}`}
      </span>
    </p>
  );
});
export const Test2Store = component$((props: { store: any }) => {
  return (
    <p>
      <Slot />{" "}
      <span class="issue-2176-result">
        {`${props.store.text} flag=${props.store.flag ? "T" : "F"} num=${
          props.store.num
        }`}
      </span>
    </p>
  );
});
export const Test2Child = component$(() => {
  return (
    <p>
      <Slot />
    </p>
  );
});

export const Issue2245 = component$(() => {
  useStyles$(`
span.true { font-weight: bold; }
span.false { font-style: italic; }
.row { display:flex; flex-direction: row; }
.column { display:flex; flex-direction: column; }
p { padding: 0.5em; border:1px solid; margin:0.2em }
.black { color: black; border-color: black; }
.red { color: red; border-color: red; }
.blue { color: blue; border-color: blue; }
.green { color: green; border-color: green; }
.purple { color: purple; border-color: purple; }
`);

  const colors = ["black", "red", "blue", "green", "purple"];
  const store = useStore({ color: "black", n: 0, flag: false });
  const colorSignal = useSignal("black");
  return (
    <div>
      <button
        id="issue-2245-btn"
        onClick$={() => {
          store.n++;
          store.flag = !store.flag;
          if (store.n >= colors.length) {
            store.n = 0;
          }
          store.color = colors[store.n];
          colorSignal.value = colors[store.n];
        }}
      >
        Click me to change the color
      </button>

      <div class="row">
        <div class="column issue-2245-results">
          <h3>Store - class</h3>
          <TestC color={store.color}>Class = OK</TestC>
          <TestAC color={store.color}>[Class] = OK</TestAC>
          <TestCStr color={store.color}>{`{Class}`} = OK</TestCStr>
          <TestACStr color={store.color}>{`[{Class}]`} = OK</TestACStr>

          <h3>Store - className</h3>
          <TestCN color={store.color}>ClassName = OK</TestCN>
          <TestACN color={store.color}>
            [ClassName] = OK (though JSX complains
          </TestACN>
          <TestCNStr color={store.color}>{`{ClassName}`} = OK</TestCNStr>
          <TestACNStr color={store.color}>{`[{ClassName}]`} = OK</TestACNStr>
        </div>

        <div class="column issue-2245-results">
          <h3>Signal - class</h3>
          <TestC color={colorSignal.value}>Class = OK</TestC>
          <TestAC color={colorSignal.value}>[Class] = OK</TestAC>
          <TestCStr color={colorSignal.value}>{`{Class}`} = OK</TestCStr>
          <TestACStr color={colorSignal.value}>{`[{Class}]`} = OK</TestACStr>

          <h3>Signal - className</h3>
          <TestCN color={colorSignal.value}>ClassName = Fail</TestCN>
          <TestACN color={colorSignal.value}>
            [ClassName] = OK (JSX complains)
          </TestACN>
          <TestCNStr color={colorSignal.value}>{`{ClassName}`} = OK</TestCNStr>
          <TestACNStr color={colorSignal.value}>
            {`[{ClassName}]`} = OK (JSX complains)
          </TestACNStr>
        </div>
      </div>
    </div>
  );
});

export const Issue2245B = component$(() => {
  const colors = ["black", "red", "blue", "green", "purple"];
  const store = useStore({ color: "black", n: 0, flag: false });
  const colorSignal = useSignal("black");
  const flagSignal = useSignal(false);
  return (
    <div>
      <button
        id="issue-2245-b-btn"
        onClick$={() => {
          store.n++;
          store.flag = !store.flag;
          flagSignal.value = !flagSignal.value;
          if (store.n >= colors.length) {
            store.n = 0;
          }
          store.color = colors[store.n];
          colorSignal.value = colors[store.n];
        }}
      >
        Click me to change the color
      </button>
      <div>
        FLAG: <code>{store.flag ? "bold" : "italic"} </code>
      </div>
      <div>
        <code>STORE: {JSON.stringify(store.color)}</code>
      </div>

      <div class="column issue-2245-b-results">
        <TestCWithFlag color={store.color} flag={store.flag}>
          Class = Fail
        </TestCWithFlag>
      </div>
    </div>
  );
});

export const ComplexClassSignals = component$(() => {
  const classes = useSignal(["initial", { hidden: false, visible: true }]);
  return (
    <div>
      <button
        id="complex-classes-btn"
        onClick$={() => {
          classes.value = ["change", { hidden: true, visible: false }];
        }}
      >
        Change classses
      </button>
      <div id="complex-classes-results" class={classes.value}>
        Div with classes
      </div>
    </div>
  );
});

type MyStore = {
  condition: boolean;
  text: string;
};

export const Issue2311 = component$(() => {
  const store = useStore<MyStore>({
    condition: false,
    text: "Hello",
  });

  useTask$(({ track }) => {
    const v = track(() => store.condition);
    if (v) {
      store.text = "Bye bye 👻";
    }
  });

  return (
    <div>
      <h1>Weird DOM update bug?</h1>

      <div>
        <button
          id="issue-2311-btn"
          onClick$={() => {
            store.condition = true;
          }}
        >
          Make it so
        </button>
      </div>

      <div id="issue-2311-results">
        <p>This text should not change</p>
        <>{store.condition ? <b>Done!</b> : <p>{store.text}</p>}</>

        <p>This text should not change</p>
        <>{store.condition ? <b>Done!</b> : <p>{store.text}</p>}</>

        <p>This text should not change</p>
        <>{store.condition ? <b>Done!</b> : <p>{store.text}</p>}</>

        <p>This text should not change</p>
        <>{store.condition ? <b>Done!</b> : <p>{store.text}</p>}</>

        <p>This text should not change</p>
        <>{store.condition ? <b>Done!</b> : <p>{store.text}</p>}</>
      </div>
    </div>
  );
});

export const Issue2344 = component$(() => {
  const classSig = useSignal("abc");
  return (
    <>
      <textarea id="issue-2344-results" value="Content" rows={5}></textarea>
      {classSig.value + ""}
      <p>
        <button
          id="issue-2344-btn"
          onClick$={() => {
            classSig.value = "bar";
          }}
        >
          Should not error
        </button>
      </p>
    </>
  );
});

export const Issue2928 = component$(() => {
  const store = useStore(
    {
      controls: {
        age: {
          value: 1,
          valid: true,
        },
      },
    },
    {
      deep: true,
    },
  );
  const group = {
    controls: store.controls,
  };

  return (
    <div>
      <button
        onClick$={async (e) => {
          group.controls.age.value++;
          await delayZero();
          group.controls.age.valid = false;
        }}
      >
        Increment
      </button>
      <FormDebug ctrl={group.controls.age} />
      {group.controls.age.value == 2 && <div>match!</div>}
    </div>
  );
});

export const FormDebug = component$<{ ctrl: any }>((props) => {
  return (
    <div>
      value:{" this_breaks!! "} -<>{props.ctrl.value} </>
      <>{props.ctrl.value + ""} </>
    </div>
  );
});

export const Issue2930 = component$(() => {
  const group = useStore(
    {
      controls: {
        ctrl: {
          value: "",
        },
      },
    },
    {
      deep: true,
    },
  );

  return (
    <div>
      <div>Type into input field:</div>
      <input
        id="issue-2930-input"
        style="border: 1px solid black"
        type="text"
        value={group.controls.ctrl.value}
        onInput$={(ev, el) => {
          group.controls.ctrl.value = el.value;
        }}
      />
      <Stringify data={group} />

      <Stringify data={group.controls} />

      <Stringify data={group.controls.ctrl} />

      <Stringify data={group.controls.ctrl.value} />
    </div>
  );
});

export const Stringify = component$<{
  data: any;
  style?: any;
}>((props) => {
  return <pre class="issue-2930-result">{JSON.stringify(props.data)}</pre>;
});

export const Issue3212Child = component$(
  (props: { signal: Signal<number> }) => {
    return <>{props.signal.value}</>;
  },
);

export function useMySignal() {
  const signal = useSignal<number>(1);
  return { signal };
}

export const Issue3212 = component$(() => {
  const stuff = useMySignal();
  const signal = stuff.signal;
  return (
    <div>
      <h2>Issue3212</h2>
      <div id="issue-3212-result-0">
        <Issue3212Child signal={stuff.signal} />
      </div>
      <div id="issue-3212-result-1">{stuff.signal.value}</div>
      <div id="issue-3212-result-2">{stuff.signal}</div>
      <div id="issue-3212-result-3">{signal}</div>
    </div>
  );
});

export const delayZero = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 1);
  });
};

export const FineGrainedTextSub = component$(() => {
  const count = useSignal(0);
  const computed = count.value + 2;

  return (
    <div>
      <h2>Fine Grained</h2>
      <div id="fine-grained-mutable" data-value={computed}>
        {computed}
      </div>
      <div>
        <button
          id="fine-grained-signal"
          data-value={count.value}
          onClick$={() => count.value++}
        >
          Increment {count.value}
        </button>
      </div>
    </div>
  );
});

export const FineGrainedUnsubs = component$(() => {
  const count = useSignal<{ nu: number } | undefined>({ nu: 1 });
  console.warn(count.value);

  return (
    <div>
      <h2>Fine Grained Unsubs</h2>
      <button
        id="fine-grained-unsubs-toggle"
        onClick$={() => {
          if (count.value) {
            count.value = undefined;
          } else {
            count.value = { nu: 123 };
          }
        }}
      >
        Toggle
      </button>

      {count.value && (
        <div id="fine-grained-unsubs" data-value={count.value.nu}>
          {count.value.nu}
        </div>
      )}
      <div>{count.value?.nu ?? "EMPTY"}</div>
    </div>
  );
});

export const Issue3415 = component$(() => {
  const signal = useSignal("<b>foo</b>");

  return (
    <>
      <button
        id="issue-3415-button"
        onClick$={() => {
          signal.value = "<i>bar</i>";
        }}
      >
        Toggle
      </button>
      <div id="issue-3415-result" dangerouslySetInnerHTML={signal.value} />
    </>
  );
});

export const BindSignal = component$(() => {
  const value = useSignal("initial");
  const checked = useSignal(false);

  return (
    <>
      <input id="bind-checkbox" type="checkbox" bind:checked={checked} />
      <input id="bind-input-1" bind:value={value} disabled={checked.value} />
      <div id="bind-text-1">Value: {value}</div>
      <div id="bind-text-2">Value: {value.value}</div>
      <textarea id="bind-input-2" bind:value={value} disabled={checked.value} />
      <input id="bind-checkbox-2" type="checkbox" bind:checked={checked} />
    </>
  );
});

export const Issue3482 = component$(() => {
  const count = useStore({
    "data-foo": 0,
  });

  return (
    <>
      <button
        id="issue-3482-button"
        data-count={count["data-foo"]}
        onClick$={() => count["data-foo"]++}
      >
        Increment {count["data-foo"]}
      </button>
      <div id="issue-3482-result" data-count={count["data-foo"]}>
        {count["data-foo"]}
      </div>
    </>
  );
});

export const Issue3663 = component$(() => {
  const store = useStore({
    "Custom Counter": 0,
  });
  const a = store["Custom Counter"] + 0;
  return (
    <div>
      <button id="issue-3663-button" onClick$={() => store["Custom Counter"]++}>
        Increment
      </button>
      <div class="issue-3663-result" data-value={store["Custom Counter"]}>
        {store["Custom Counter"]}
      </div>
      <Issue3663Cmp prop={store["Custom Counter"]} />
      <div class="issue-3663-result" data-value={a}>
        {a}
      </div>
    </div>
  );
});

function Issue3663Cmp(props: { prop: number }) {
  return (
    <div class="issue-3663-result" data-value={props.prop}>
      {props.prop}
    </div>
  );
}

export const Issue3440 = component$(() => {
  const name = useSignal("Demo");
  const blogs = useStore([
    {
      id: 1,
      title: "my first blog",
    },
    {
      id: 2,
      title: "my second blogs",
    },
    {
      id: 3,
      title: "my third blog",
    },
  ]);
  return (
    <>
      <div>
        <div>
          <h1>Name: {name.value}</h1>
          {blogs.map((blog) => (
            <div class="issue-3440-results" key={blog.id}>
              {blog.title}
            </div>
          ))}
          <button id="issue-3440-remove" onClick$={() => blogs.pop()}>
            Remove Blog
          </button>
        </div>
      </div>
    </>
  );
});

export const Issue4174 = component$(() => {
  const storeWithoutInit = useStore<{ value?: string }>({});

  useVisibleTask$(
    () => {
      storeWithoutInit.value = "visible-task";
    },
    { strategy: "document-ready" },
  );

  return (
    <>
      <div id="issue-4174-result">Store: {storeWithoutInit.value}</div>
    </>
  );
});

export const Issue4249 = component$(() => {
  const first = useSignal("");
  const second = useSignal("");

  return (
    <main>
      <div>
        <label for="first">
          {"First "}
          <input
            id="issue-4249-first"
            value={first.value}
            onInput$={(_, e) => (first.value = e.value)}
            placeholder="type here"
          />
        </label>
      </div>
      <div>
        <label for="second">
          {"Second "}
          <input
            id="issue-4249-second"
            value={second.value}
            onInput$={(_, e) => (second.value = e.value)}
            placeholder="type here"
          />
        </label>
      </div>

      <div
        id="issue-4249-result"
        data-value={
          first.value && second.value && first.value === second.value
            ? "collision"
            : "no-collision"
        }
      >
        {"Status: "}
        {first.value && second.value && first.value === second.value
          ? "Collision detected"
          : "No collision"}
      </div>
    </main>
  );
});

type Counters = {
  countA: number;
  countB: number;
  signal: Signal<number>;
};

type Props = {
  counters: Counters;
};

export const DisplayA = component$<Props>(({ counters }) => {
  return (
    <>
      Display A:{" "}
      <span id="issue-4228-result-a">{`${counters.countA}:${
        typeof (globalThis as any).countA === "number"
          ? (window as any).countA++
          : 0
      }`}</span>
    </>
  );
});
export const DisplayB = component$<Props>(({ counters }) => {
  return (
    <>
      Display B:{" "}
      <span id="issue-4228-result-b">{`${counters.countB}:${
        typeof (globalThis as any).countB === "number"
          ? (window as any).countB++
          : 0
      }`}</span>
    </>
  );
});
export const DisplaySignal = component$<Props>(({ counters }) => {
  return (
    <>
      Display C:{" "}
      <span id="issue-4228-result-c">{`${counters.signal.value}:${
        typeof (globalThis as any).countC === "number"
          ? (window as any).countC++
          : 0
      }`}</span>
    </>
  );
});
export const DisplayTotal = component$<Props>(({ counters }) => {
  return (
    <>
      Display Total:{" "}
      <span id="issue-4228-result-total">{`${
        counters.countA + counters.countB + counters.signal.value
      }:${
        typeof (globalThis as any).countD === "number"
          ? (window as any).countD++
          : 0
      }`}</span>
    </>
  );
});
export const Issue4228 = component$(() => {
  const signal = useSignal(0);
  const counter = useStore({
    countA: 0,
    countB: 0,
    signal,
  });
  useTask$(() => {
    if (isBrowser) {
      (window as any).countA = -1;
      (window as any).countB = -1;
      (window as any).countC = -1;
      (window as any).countD = -1;
    }
  });
  useVisibleTask$(
    () => {
      (window as any).countA = 1;
      (window as any).countB = 1;
      (window as any).countC = 1;
      (window as any).countD = 1;
    },
    {
      strategy: "document-ready",
    },
  );
  return (
    <>
      <p>
        <button id="issue-4228-button-a" onClick$={() => counter.countA++}>
          +1 A
        </button>
        <DisplayA counters={counter} />
      </p>
      <p>
        <button id="issue-4228-button-b" onClick$={() => counter.countB++}>
          +1 B
        </button>
        <DisplayB counters={counter} />
      </p>
      <p>
        <button id="issue-4228-button-c" onClick$={() => signal.value++}>
          +1 Signal
        </button>
        <DisplaySignal counters={counter} />
      </p>
      <p>
        <DisplayTotal counters={counter} />
      </p>
    </>
  );
});

const MyButton = component$<QwikIntrinsicElements["button"]>(
  ({ type, ...rest }) => {
    return (
      <button id="issue-4368-button" type={type || "button"} {...rest}>
        <Slot />
      </button>
    );
  },
);

const MyTextButton = component$<{ text: string }>((props) => {
  return (
    <MyButton disabled={!props.text}>
      {props.text ? "Example button" : "Text is empty"}
    </MyButton>
  );
});

export const Issue4368 = component$(() => {
  const text = useSignal("");

  const textResource = useResource$(async (ctx) => {
    return ctx.track(() => text.value);
  });

  return (
    <>
      <input
        id="issue-4368-input"
        bind:value={text}
        placeholder="type something here"
      />

      <Resource
        value={textResource}
        onRejected={() => <p>Error</p>}
        onPending={() => <p>Loading</p>}
        onResolved={(resolved) => (
          <>
            <MyTextButton text={resolved} />
          </>
        )}
      />
    </>
  );
});

export const __CFG__ = { noImg: "https://placehold.co/600x400?text=No%20IMG" };

export type PropsType = {
  data: { id: number; src?: string };
};

const options = [
  {
    src: "https://placehold.co/400x400?text=1",
    id: 1,
  },
  {
    src: "https://placehold.co/500x500?text=2",
    id: 2,
  },
];

export const Issue4868 = component$(() => {
  const selected = useSignal<{ id: number; src?: string }>(options[0]);
  return (
    <div>
      <Issue4868BigCard data={selected.value} />
      {options.map((d) => (
        <>
          <button
            key={d.id}
            onClick$={() => (selected.value = d)}
            style={{ padding: "2rem", cursor: "pointer" }}
            id={`issue-4868-btn-${d.id}`}
          >
            {d.id}
          </button>
        </>
      ))}
    </div>
  );
});

export const Issue4868BigCard = component$<PropsType>((props) => {
  // Using a reference to another const will somehow prevent the useComputed$ in the Card element to use the correct context
  const noImg = __CFG__.noImg;

  // Assigning static value here will make the Card component and useComputed$ within work as expected
  // const noImg = 'https://placehold.co/600x400?text=No%20IMG';

  return (
    <div
      style={{
        flexDirection: "column",
        border: "1px solid red",
        padding: "1rem",
        gap: "1rem",
      }}
    >
      <Issue4868Card src={props.data.src || noImg} />
      <div id="issue-4868-json">{JSON.stringify(props.data)}</div>
    </div>
  );
});

export const Issue4868Card = component$((props: { src: string }) => {
  const { src } = props;

  const src$ = useComputed$(() => {
    // do something very important with the src
    return props.src + "&useComputed$";
  });

  return (
    <div style={{ border: "1px solid white", padding: "1rem" }}>
      <p id="issue-4868-props">Card props.src: {src}</p>
      <p id="issue-4868-usecomputed">Card useComputed$: {src$.value}</p>
    </div>
  );
});

export const Issue4979 = component$(() => {
  const count = useSignal(123);
  return (
    <div class="issue-4979">
      <button class="issue" onClick$={() => (count.value += 1)}>
        Issue4979
      </button>
      {[count.value].map((o) => (
        <Issue4979Child key={o} value={o} />
      ))}
    </div>
  );
});

export const Issue4979Child = component$<{ value: number }>((props) => {
  const foo = useComputed$(() => props.value);
  return <div class="result">{JSON.stringify(foo.value)}</div>;
});
