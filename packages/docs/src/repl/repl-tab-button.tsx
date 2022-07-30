import type { PropFunction } from '@builder.io/qwik';
import { CloseIcon } from '../components/svgs/close-icon';

export const ReplTabButton = (props: ReplTabButtonProps) => {
  return (
    <div
      key={props.text}
      class={{ 'active-tab': props.isActive, 'repl-tab-button': true, ...props.cssClass }}
    >
      <button
        class="repl-tab-button-select"
        onClick$={props.onClick$}
        type="button"
        preventDefault:click
      >
        {props.text}
      </button>
      {props.onClose$ && props.enableInputDelete ? (
        <button
          class="repl-tab-button-close"
          onClick$={props.onClose$}
          type="button"
          preventDefault:click
        >
          <CloseIcon width={9} height={9} />
        </button>
      ) : null}
    </div>
  );
};

interface ReplTabButtonProps {
  text: string;
  isActive: boolean;
  onClick$: PropFunction<() => void>;
  onClose$?: PropFunction<() => void>;
  cssClass?: Record<string, boolean>;
  enableInputDelete?: boolean;
}
