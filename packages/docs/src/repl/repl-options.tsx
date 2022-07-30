import type { ReplAppInput } from './types';

export const ReplOptions = ({ input, versions }: ReplOptionsProps) => {
  return (
    <div class="output-detail detail-options">
      <StoreOption
        label="Entry Strategy"
        inputProp="entryStrategy"
        options={ENTRY_STRATEGY_OPTIONS}
        input={input}
      />

      <StoreOption label="Mode" inputProp="buildMode" options={BUILD_MODE_OPTIONS} input={input} />

      <StoreOption
        label="Version"
        inputProp="version"
        options={versions}
        input={input}
        isLoading={versions.length === 0}
      />
    </div>
  );
};

const StoreOption = (props: StoreOptionProps) => {
  return (
    <label>
      <span>{props.label}</span>
      <select
        onChange$={(ev?: any) => {
          const select: HTMLSelectElement = ev.target;
          (props.input as any)[props.inputProp] = select.value as any;
        }}
        disabled={!!props.isLoading}
      >
        {props.options.map((value) => (
          <option
            value={value}
            selected={value === props.input[props.inputProp] ? true : undefined}
            key={value}
          >
            {value}
          </option>
        ))}
        {props.isLoading ? <option>Loading...</option> : null}
      </select>
    </label>
  );
};

export const BUILD_MODE_OPTIONS = ['development', 'production'];

export const ENTRY_STRATEGY_OPTIONS = ['component', 'hook', 'single', 'smart', 'inline'];

interface StoreOptionProps {
  label: string;
  options: string[];
  input: ReplAppInput;
  inputProp: keyof ReplAppInput;
  isLoading?: boolean;
}

interface ReplOptionsProps {
  input: ReplAppInput;
  versions: string[];
}
