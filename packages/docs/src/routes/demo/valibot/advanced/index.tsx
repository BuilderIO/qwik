import { component$, useStylesScoped$ } from '@builder.io/qwik';
import { routeAction$, valibot$, Form } from '@builder.io/qwik-city';
import styles from './styles.css?inline';
import { string, object, minLength } from 'valibot';

export const useAddUser = routeAction$(
  async (user) => {
    return {
      success: true,
      firstName: user.firstName,
    };
  },
  // Valibot schema is used to validate that the FormData includes "firstName" and "lastName"
  valibot$((requestEvent) =>
    object({
      firstName: string([minLength(1)]),
      // The last name is optional if the url contains the query parameter "lastname=optional"
      lastName:
        requestEvent.url.searchParams.get('lastname') === 'optional'
          ? string()
          : string([minLength(1)]),
    })
  )
);

export default component$(() => {
  const action = useAddUser();
  useStylesScoped$(styles);

  return (
    <Form action={action} class="flow">
      <label>
        <span>First name:</span>
        <input name="firstName" />
        <p data-status="error">
          {action.value?.failed && (
            <span>{action.value.nested?.firstName}</span>
          )}
        </p>
      </label>

      <label>
        <span>Last name:</span>
        <input name="lastName" />
      </label>
      <p data-status="error">
        {action.value?.failed && <span>{action.value.nested?.lastName}</span>}
      </p>

      <button type="submit">Add user</button>

      {action.value?.success && (
        <p data-status="success">
          User {action.value.firstName} added successfully.
        </p>
      )}
    </Form>
  );
});
