export const ReplTabButtons = (props: ReplTabButtonsProps) => {
  return (
    <div class="repl-tab-buttons">
      <div class="repl-tab-buttons-inner">{props.children}</div>
    </div>
  );
};

interface ReplTabButtonsProps {
  children: any;
}
