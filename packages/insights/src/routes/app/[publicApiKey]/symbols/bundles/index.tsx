import { component$, useStore, type JSXNode, type ReadonlySignal } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { BundleCmp } from '~/components/bundle';
import { BundleIcon } from '~/components/icons/bundle';
import { SymbolTile } from '~/components/symbol-tile';
import { getDB } from '~/db';
import { getEdges, getSymbolDetails } from '~/db/query';
import { dbGetManifestHashes } from '~/db/sql-manifest';
import {
  computeBundles,
  computeSymbolGraph,
  computeSymbolVectors,
  type SymbolVectors,
  type Symbol,
  type Bundle,
} from '~/stats/edges';
import { vectorSum } from '~/stats/vector';

interface BundleInfo {
  vectors: SymbolVectors;
  bundles: Bundle[];
}

export const useData = routeLoader$<BundleInfo>(async ({ params, url }) => {
  const db = getDB();
  const limit = url.searchParams.get('limit')
    ? parseInt(url.searchParams.get('limit')!)
    : undefined;

  const manifestHashes = await dbGetManifestHashes(db, params.publicApiKey);
  const [edges, details] = await Promise.all([
    getEdges(db, params.publicApiKey, { limit, manifestHashes }),
    getSymbolDetails(db, params.publicApiKey, { manifestHashes }),
  ]);
  const rootSymbol = computeSymbolGraph(edges, details);
  const vectors = computeSymbolVectors(rootSymbol);
  const bundles = computeBundles(vectors);
  return { vectors, bundles };
});

export default component$(() => {
  const data: ReadonlySignal<BundleInfo> = useData();
  return (
    <div>
      <h1 class="h3">
        <BundleIcon />
        Correlation Matrix
      </h1>
      <CorrelationMatrix matrix={data.value.vectors.vectors} symbols={data.value.vectors.symbols} />

      <h2 class="h3">
        <BundleIcon />
        Bundles
      </h2>
      <ol>
        {data.value.bundles.map((bundle) => {
          return (
            <li key={bundle.name}>
              <BundleCmp name={bundle.name} />
              <ul>
                {bundle.symbols.map((symbol) => (
                  <li key={symbol.name}>
                    <SymbolTile symbol={symbol.name} />
                    {' ( '}
                    <code>{symbol.fullName}</code>
                    {' / '}
                    <code>{symbol.fileSrc}</code>
                    {' )'}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
      <hr />
    </div>
  );
});

export const CorrelationMatrix = component$<{
  matrix: number[][];
  symbols: Symbol[];
}>(({ matrix, symbols }) => {
  const callout = useStore({
    visible: false,
    value: 0,
    rowSymbol: '',
    colSymbol: '',
    x: 0,
    y: 0,
  });
  return (
    <>
      <div
        onMouseEnter$={() => (callout.visible = true)}
        onMouseLeave$={() => (callout.visible = false)}
        onMouseMove$={(e) => {
          callout.x = e.clientX;
          callout.y = e.clientY;
          const col = e.target as HTMLElement;
          const row = col.parentNode as HTMLElement;
          callout.value = parseFloat(col.dataset.value!);
          callout.colSymbol = col.dataset.colSymbol!;
          callout.rowSymbol = row.dataset.rowSymbol!;
        }}
      >
        <MatrixCells matrix={matrix} symbols={symbols} />
      </div>
      <div
        style={{
          display: callout.visible && !isNaN(callout.value) ? 'inline-block' : 'none',
          top: callout.y + 5 + 'px',
          left: callout.x + 5 + 'px',
        }}
      >
        <div>
          (<code>{Math.round(callout.value * 100)}%</code>)
        </div>
        <code>{callout.rowSymbol}</code>
        {` -> `}
        <code>{callout.colSymbol}</code>
      </div>
    </>
  );
});

export const MatrixCells = component$<{
  matrix: number[][];
  symbols: Symbol[];
}>(({ matrix, symbols }) => {
  const size = matrix.length;
  return (
    <>
      {matrix.map((row, rowIdx) => (
        <div
          style={{ height: 100 / size + '%' }}
          key={rowIdx}
          data-row-symbol={symbols[rowIdx].name}
        >
          {cells(row, symbols)}
        </div>
      ))}
    </>
  );
});

function cells(row: number[], symbols: Symbol[]) {
  const size = row.length;
  const cells: JSXNode[] = [];
  const total = vectorSum(row);
  let sparseSize = 0;
  for (let colIdx = 0; colIdx < row.length; colIdx++) {
    const value = row[colIdx];
    if (value / total > 0.05) {
      if (sparseSize) {
        cells.push(<div style={{ width: (sparseSize * 100) / size + '%' }} />);
        sparseSize = 0;
      }
      cells.push(
        <div
          key={colIdx}
          style={{
            width: 100 / size + '%',
            backgroundColor: toRGB(value),
          }}
          data-col-symbol={symbols[colIdx].name}
          data-value={value}
        ></div>
      );
    } else {
      sparseSize++;
    }
  }
  return cells;
}

function toRGB(value: number): string {
  const color = Math.round((1 - value) * 255);
  return `rgb(${color},${color},${color})`;
}
