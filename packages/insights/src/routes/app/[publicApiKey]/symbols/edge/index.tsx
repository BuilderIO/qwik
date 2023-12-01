import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { getDB } from '~/db';
import { computeSymbolGraph, type Symbol } from '~/stats/edges';
import { getSymbolDetails, getEdges } from '~/db/query';
import { dbGetManifestHashes } from '~/db/sql-manifest';
import { SymbolIcon } from '~/components/icons/symbol';

export const useRootSymbol = routeLoader$(async ({ params, url }) => {
  const db = getDB();
  const limit = url.searchParams.get('limit')
    ? parseInt(url.searchParams.get('limit')!)
    : undefined;
  const manifestHashes = await dbGetManifestHashes(db, params.publicApiKey);
  const [symbols, details] = await Promise.all([
    getEdges(db, params.publicApiKey, { limit, manifestHashes }),
    getSymbolDetails(db, params.publicApiKey, { manifestHashes }),
  ]);
  return computeSymbolGraph(symbols, details);
});

export default component$(() => {
  const rootSymbol = useRootSymbol();
  return (
    <div>
      <h1 class="h3">
        <SymbolIcon />
        Edge
      </h1>
      <SymbolTree symbol={rootSymbol.value[0]} depth={0} />
    </div>
  );
});

function SymbolTree({ symbol, depth, count }: { symbol: Symbol; depth: number; count?: number }) {
  const nextDepth = depth + 1;
  symbol.children.sort(
    (a, b) => (b.to.depth === nextDepth ? b.count : 0) - (a.to.depth === nextDepth ? a.count : 0)
  );
  const terminal = symbol.depth !== depth;
  return (
    <section>
      {symbol.count > 0 && (
        <span>
          ({count} / {symbol.count}) {symbol.name} <code>{symbol.fullName}</code>{' '}
          <code>{symbol.fileSrc}</code> [{symbol.depth}]
        </span>
      )}
      {!terminal && (
        <ul>
          {symbol.children.map((edge) => (
            <li key={edge.to.name}>
              <SymbolTree symbol={edge.to} depth={nextDepth} count={edge.count} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
