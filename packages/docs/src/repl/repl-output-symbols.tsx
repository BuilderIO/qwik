import type { TransformModule } from '@builder.io/qwik/optimizer';
import { CodeBlock } from '../components/code-block/code-block';

export const ReplOutputSymbols = ({ outputs }: ReplOutputSymbolsProps) => {
  return (
    <div class="output-result output-modules">
      <div class="file-tree">
        <div class="file-tree-header">Symbols</div>
        <div class="file-tree-items">
          {outputs.map((o, i) => (
            <a
              href="#"
              onClick$={() => {
                const fileItem = document.querySelector(`[data-file-item="${i}"]`);
                if (fileItem) {
                  fileItem.scrollIntoView();
                }
              }}
              preventDefault:click
              key={o.path}
            >
              {o.hook?.canonicalFilename}
            </a>
          ))}
        </div>
      </div>
      <div class="file-modules">
        {outputs.map((o, i) => (
          <div class="file-item" data-file-item={i} key={o.path}>
            <div class="file-info">
              <span>{o.hook?.canonicalFilename}</span>
            </div>
            <div className="file-text">
              <CodeBlock path={o.path} code={o.code} theme="light" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ReplOutputSymbolsProps {
  outputs: TransformModule[];
}
