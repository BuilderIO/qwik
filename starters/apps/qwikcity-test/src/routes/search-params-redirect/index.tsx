import { routeAction$, routeLoader$, Form } from "@builder.io/qwik-city";
import { component$ } from "@builder.io/qwik";

export const useLoader = routeLoader$(
  ({ query }) => `${query.has("redirected")}`,
);

export const useAction = routeAction$((_, { redirect, url }) => {
  const dest = new URL(url.pathname, url);

  dest.search = new URLSearchParams([["redirected", "true"]]).toString();

  throw redirect(302, dest.href.replace(dest.origin, ""));
});

export default component$(() => {
  const data = useLoader();
  const action = useAction();

  return (
    <div>
      <Form action={action}>
        <button type="submit">Submit</button>
      </Form>

      <div id="redirected-result">{data.value}</div>
    </div>
  );
});
