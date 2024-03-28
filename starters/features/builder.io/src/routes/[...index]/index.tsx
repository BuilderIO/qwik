import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { fetchOneEntry, Content } from "@builder.io/sdk-qwik";
import { CUSTOM_COMPONENTS } from "~/components/builder-registry";

export const BUILDER_MODEL = "page";

// Use Qwik City's `useBuilderContent` to get your content from Builder.
// `routeLoader$()` takes an async function to fetch content
// from Builder with `fetchOneEntry()`.
export const useBuilderContent = routeLoader$(async (event) => {
  const isPreviewing = event.url.searchParams.has("builder.preview");

  const builderContent = await fetchOneEntry({
    model: BUILDER_MODEL,
    apiKey: import.meta.env.PUBLIC_BUILDER_API_KEY,
    userAttributes: { urlPath: event.url.pathname },
    options: event.query,
  });

  // If there's no content, throw a 404.
  // You can use your own 404 component here
  if (!builderContent && !isPreviewing) {
    throw event.error(404, "Page not found");
  }
  // return content fetched from Builder, which is JSON
  return builderContent;
});

export default component$(() => {
  const content = useBuilderContent();

  // Content uses `content` to
  // render the content of the given model, here a page,
  // of your space (specified by the API Key)
  return (
    <Content
      model={BUILDER_MODEL}
      content={content.value}
      apiKey={import.meta.env.PUBLIC_BUILDER_API_KEY}
      customComponents={CUSTOM_COMPONENTS}
    />
  );
});
