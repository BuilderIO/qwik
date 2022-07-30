import { component$, Host, useStyles$, useStore, useWatch$ } from '@builder.io/qwik';

interface ContainerProps {
  url: string;
}

export const Containers = component$(() => {
  return (
    <Host class="my-app p-20">
      <Container url="/e2e/slot"></Container>
      <Container url="/e2e/two-listeners"></Container>
      <Container url="/e2e/lexical-scope"></Container>
      <Container url="/e2e/await"></Container>
    </Host>
  );
});

export const Container = component$((props: ContainerProps) => {
  useStyles$(`
    .container {
      margin: 20px;
      padding: 5px;
      border: 1px solid black;
      border-radius: 10px;
    }
    .frame {
      padding: 5px;
      border: 1px solid grey;
      border-radius: 5px;
    }
    .url {
      background: #d1d1d1;
      border-radius: 10px;
      padding: 5px 10px;
      margin-bottom: 10px;
    }
    `);
  const state = useStore({
    url: '',
    html: '',
  });

  useWatch$(async (track) => {
    track(props, 'url');
    const url = `http://localhost:3300${props.url}?fragment&loader=false`;
    const res = await fetch(url);
    state.url = await res.text();
    state.html = await res.text();
  });

  return (
    <Host class="container">
      <div class="url">{state.url}</div>
      <div class="frame" dangerouslySetInnerHTML={state.html} />
    </Host>
  );
});
