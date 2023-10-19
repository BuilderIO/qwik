import { $, component$, useOn, useSignal, useStore, useTask$ } from '@builder.io/qwik';

import { isBrowser } from '@builder.io/qwik/build';
import qwikApiData from './qwik/api.json';
import qwikCityApiData from './qwik-city/api.json';
// TODO: load the content of these files using fs instead of importing them
import qwikCityMiddlewareAzureSwaApiData from './qwik-city-middleware-azure-swa/api.json';
import qwikCityMiddlewareCloudflarePagesApiData from './qwik-city-middleware-cloudflare-pages/api.json';
import qwikCityMiddlewareFirebaseApiData from './qwik-city-middleware-firebase/api.json';
import qwikCityMiddlewareNetlifyEdgeApiData from './qwik-city-middleware-netlify-edge/api.json';
import qwikCityMiddlewareNodeApiData from './qwik-city-middleware-node/api.json';
import qwikCityMiddlewareRequestHandlerApiData from './qwik-city-middleware-request-handler/api.json';
import qwikCityMiddlewareVercelEdgeApiData from './qwik-city-middleware-vercel-edge/api.json';
import qwikCityStaticApiData from './qwik-city-static/api.json';
import qwikCityViteAzureSwaApiData from './qwik-city-vite-azure-swa/api.json';
import qwikCityViteCloudRunApiData from './qwik-city-vite-cloud-run/api.json';
import qwikCityViteCloudflarePagesApiData from './qwik-city-vite-cloudflare-pages/api.json';
import qwikCityViteNetlifyEdgeApiData from './qwik-city-vite-netlify-edge/api.json';
import qwikCityViteNodeServerApiData from './qwik-city-vite-node-server/api.json';
import qwikCityViteStaticApiData from './qwik-city-vite-static/api.json';
import qwikCityViteVercelEdgeApiData from './qwik-city-vite-vercel-edge/api.json';
import qwikCityViteVercelServerlessApiData from './qwik-city-vite-vercel-serverless/api.json';
import qwikOptimizerApiData from './qwik-optimizer/api.json';
import qwikServerApiData from './qwik-server/api.json';
import qwikTestingApiData from './qwik-testing/api.json';
import { toSnakeCase } from '../../utils/utils';

const _KINDS = new Set<string>();

const apiData = {
  qwik: qwikApiData,
  'qwik-city': qwikCityApiData,
  'qwik-city-middleware-azure-swa': qwikCityMiddlewareAzureSwaApiData,
  'qwik-city-middleware-cloudflare-pages': qwikCityMiddlewareCloudflarePagesApiData,
  'qwik-city-middleware-netlify-edge': qwikCityMiddlewareNetlifyEdgeApiData,
  'qwik-city-middleware-node': qwikCityMiddlewareNodeApiData,
  'qwik-city-middleware-request-handler': qwikCityMiddlewareRequestHandlerApiData,
  'qwik-city-middleware-vercel-edge': qwikCityMiddlewareVercelEdgeApiData,
  'qwik-city-middleware-firebase': qwikCityMiddlewareFirebaseApiData,
  'qwik-city-static': qwikCityStaticApiData,
  'qwik-city-vite-azure-swa': qwikCityViteAzureSwaApiData,
  'qwik-city-vite-cloud-run': qwikCityViteCloudRunApiData,
  'qwik-city-vite-cloudflare-pages': qwikCityViteCloudflarePagesApiData,
  'qwik-city-vite-node-server': qwikCityViteNodeServerApiData,
  'qwik-city-vite-netlify-edge': qwikCityViteNetlifyEdgeApiData,
  'qwik-city-vite-static': qwikCityViteStaticApiData,
  'qwik-city-vite-vercel-edge': qwikCityViteVercelEdgeApiData,
  'qwik-city-vite-vercel-serverless': qwikCityViteVercelServerlessApiData,
  'qwik-optimizer': qwikOptimizerApiData,
  'qwik-server': qwikServerApiData,
  'qwik-testing': qwikTestingApiData,
};

const getUniqueKinds = () => {
  if (_KINDS.size) {
    return _KINDS;
  }

  apiData['qwik'].members.forEach((member) => _KINDS.add(toSnakeCase(member.kind)));
  return _KINDS;
};

const getInitialFilterState = () => {
  return (
    Array.from(getUniqueKinds()).reduce((acc: any, kind) => {
      if (typeof kind !== 'string') {
        return acc;
      }
      acc[kind] = true;
      return acc;
    }, {}) || {}
  );
};

export default component$(() => {
  const filters = useStore(getInitialFilterState());

  return (
    <>
      <h1 class="overview">API Reference</h1>

      <h2>Filters</h2>
      <div class="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-10">
        {Array.from(getUniqueKinds()).map((kind) => (
          <button
            key={`filter-${kind}`}
            onClick$={() => {
              filters[kind] = !filters[kind];
            }}
            class={`filter-item block text-sm rounded-md text-left ${
              filters[kind] ? 'active' : ''
            }`}
            data-kind-label={kind.substring(0, 1).toUpperCase()}
          >
            {kind.split('-').join(' ')}
          </button>
        ))}
      </div>

      <h2>References</h2>
      {Object.keys(apiData).map((key) => (
        <ApiMemberWrapper key={`api-member-wrapper-${apiData[key as keyof typeof apiData].id}`} id={apiData[key as keyof typeof apiData].id} data={apiData[key as keyof typeof apiData]} filters={filters} />
      ))}
    </>
  );
});

export const ApiMemberWrapper = component$(({ id, data, filters }: any) => {
  const isCollapsed = useSignal(true);

  useTask$(({track}) => {
    track(filters);
    if (isBrowser) {
      isCollapsed.value = false;
    }
  });

  // TODO: find a solution to get this work
  useOn('beforematch', $(() => {
    isCollapsed.value = false;
  }));

  if(!data.members.length) {
    return null;
  }

  return (
    <div class={`section ${isCollapsed.value}`}>
      <h2
        data-icon={isCollapsed.value ? '→' : '↓'}
        class="section-title cursor-pointer"
        onClick$={(e) => isCollapsed.value = !isCollapsed.value }
      >
        <span>{data.id}</span>
      </h2>
      <div hidden={isCollapsed.value ? 'until-found' : false}>
        <ApiMemberList id={id} data={data} filters={filters} />
      </div>
    </div>
  );
});


export const ApiMemberList = component$(({ id, data, filters }: any) => (
  <ul class="grid sm:grid-cols-2 lg:grid-cols-3 pb-5">
    {data.members.map((member: any) => {
      const kind = toSnakeCase(member.kind);

      if (!member.name) {
        return;
      }

      const name = member.name.toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '')
        .replace(/ /g, '-');


      return (
        <li
          key={`${id}-member-${member.id}-${kind}`}
          data-kind={kind}
          data-kind-label={kind.substring(0, 1).toUpperCase()}
          class={`api-item list-none text-xs ${
            (kind in filters && !filters[kind] && 'hidden') || ''
          }`}
        >
          <a href={`${data.id}#${name}`}>{member.name}</a>
        </li>
      );
    })}
  </ul>
));
