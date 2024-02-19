import { component$, useSignal } from '@builder.io/qwik';
import { ensureDefaultFiles, type TutorialStore } from './layout';

export const TutorialContentFooter = component$(({ store }: TutorialContentFooterProps) => {
  let solutionViewState = useSignal(false);

  return (
    <div class="content-footer">
      <div>
        {solutionViewState.value ? (
          <button
            preventdefault:click
            class="show-me"
            onClick$={() => {
              store.files = ensureDefaultFiles(store.app.problemInputs);
              solutionViewState.value = false;
            }}
            type="button"
          >
            Reset
          </button>
        ) : (
          <button
            preventdefault:click
            class="show-me"
            onClick$={() => {
              store.files = ensureDefaultFiles(store.app.solutionInputs);
              solutionViewState.value = true;
            }}
            type="button"
          >
            Show Me
          </button>
        )}
      </div>
      <nav>
        {store.prev ? (
          <a title={store.prev.title} href={`/tutorial/${store.prev.id}/`} class="nav-link prev">
            &lt; Previous
          </a>
        ) : null}
        {store.next ? (
          <a title={store.next.title} href={`/tutorial/${store.next.id}/`} class="nav-link next">
            Next &gt;
          </a>
        ) : null}
      </nav>
    </div>
  );
});

interface TutorialContentFooterProps {
  store: TutorialStore;
}
