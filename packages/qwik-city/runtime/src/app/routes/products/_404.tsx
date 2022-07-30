import { component$, Host } from '@builder.io/qwik';
import { useLocation, DocumentHead } from '~qwik-city-runtime';

export default component$(() => {
  const { params } = useLocation();

  return (
    <Host>
      <h1>Product {params.id} not found</h1>
    </Host>
  );
});

export const head: DocumentHead = ({ params }) => {
  return {
    title: `Product ${params.id} Not Found`,
  };
};
