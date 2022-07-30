import { CodeBlock } from '../components/code-block/code-block';
import type { ReplModuleOutput } from './types';

export const ReplOutputModules = ({ outputs, headerText }: ReplOutputModulesProps) => {
  return (
    <div class="output-result output-modules">
      <div class="file-tree">
        <div class="file-tree-header">{outputs.length > 0 ? headerText : ''}</div>
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
              {o.path}
            </a>
          ))}
        </div>
      </div>
      <div class="file-modules">
        {outputs.map((o, i) => (
          <div class="file-item" data-file-item={i} key={o.path}>
            <div class="file-info">
              <span>{o.path}</span>
              {o.size ? <span class="file-size">({o.size})</span> : null}
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

interface ReplOutputModulesProps {
  headerText: string;
  outputs: ReplModuleOutput[];
}
