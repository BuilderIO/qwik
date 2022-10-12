import {
  component$,
  useRef,
  Ref,
  Signal,
  useSignal,
  useStore,
  useClientEffect$,
} from '@builder.io/qwik';

export const Signals = component$(() => {
  const ref = useRef();
  const ref2 = useSignal<Element>();
  const id = useSignal(0);
  const signal = useSignal('');
  const renders = useStore(
    {
      count: 0,
    },
    { reactive: false }
  );
  const store = useStore({
    foo: 10,
    attribute: 'even',
    signal,
  });

  const styles = useSignal('body { background: white}');

  useClientEffect$(() => {
    ref.current!.setAttribute('data-set', 'ref');
    ref2.value!.setAttribute('data-set', 'ref2');
  });

  renders.count++;
  return (
    <div aria-label={store.attribute}>
      <button
        id="count"
        onClick$={() => {
          store.foo++;
          store.attribute = store.foo % 2 === 0 ? 'even' : 'odd';
        }}
      >
        Increment
      </button>
      <button
        id="click"
        onClick$={() => {
          signal.value = 'clicked';
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
          styles.value = 'body { background: black }';
        }}
      >
        Black background
      </button>
      <div id="parent-renders">Parent renders: {renders.count}</div>
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
    </div>
  );
});

interface ChildProps {
  count: number;
  text: string;
  ref: Ref<Element>;
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
    { reactive: false }
  );
  renders.count++;
  return (
    <>
      <div id="child-renders">Child renders: {renders.count}</div>
      <div id="text" ref={props.ref}>
        Text: {props.text}
      </div>
      <Id id={props.id} />
      <div id="computed">{'computed: ' + props.signal.value}</div>
      <div id="stuff" ref={props.ref2}>
        Stuff: {props.count}
      </div>
      <style>{props.styles}</style>
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
      </button>{' '}
      <span id="issue-1681-return">
        <C who={'A'} count={signal.value} /> <C who={'B'} count={signal} />
      </span>
    </div>
  );
});
