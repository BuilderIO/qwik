import { component$, Host, Slot, useStyles$ } from '@builder.io/qwik';

export const Card = component$(() => {
  useStyles$(CSS);
  return (
    <Host class="card">
      <div class="title">
        <Slot name="title"></Slot>
      </div>
      <div class="body">
        <Slot></Slot>
      </div>
    </Host>
  );
});

export const App = component$(() => {
  return (
    <>
      <Card>
        <span q:slot="title">Qwik</span>
        <span>Qwik is a resumable framework for building instant web apps.</span>
      </Card>
      <Card>
        <span q:slot="title">Partytown</span>
      </Card>
      <Card>
        <span>
          Builder.io allows you to visually build on your tech stack Empower your entire team to
          visually create and optimize high-speed experiences on your sites and apps. Provide
          whole-team autonomy with a platform that is developer approved.
        </span>
      </Card>
    </>
  );
});

export const CSS = `
.card {
  border-radius: 5px;
  vertical-align: top;
  display: inline-block;
  border: 1px solid grey;
  width: 200px;
  margin: .5em;
}

.title {
  background-color: lightgray;
  padding: 0.5em;
  border-bottom: 1px solid black;
}

q\\:fallback {
  color: gray;
}

.body {
  padding: 0.5em;
}
`;
