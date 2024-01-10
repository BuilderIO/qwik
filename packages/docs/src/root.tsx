import { component$, useContextProvider, useStore } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from '@builder.io/qwik-city';
import RealMetricsOptimization from './components/real-metrics-optimization/real-metrics-optimization';
import { RouterHead } from './components/router-head/router-head';
import { GlobalStore, type SiteStore } from './context';
import './global.css';
import { BUILDER_PUBLIC_API_KEY } from './constants';
import { Insights } from '@builder.io/qwik-labs';

export default component$(() => {
  const store = useStore<SiteStore>({
    headerMenuOpen: false,
    sideMenuOpen: false,
    theme: 'auto',
    pkgManager: 'npm',
  });

  useContextProvider(GlobalStore, store);

  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <RouterHead />
        <ServiceWorkerRegister />
        {/* <script dangerouslySetInnerHTML={`(${collectSymbols})()`} /> */}
        <Insights publicApiKey={import.meta.env.PUBLIC_QWIK_INSIGHTS_KEY} />
      </head>
      <body
        class={{
          'header-open': store.headerMenuOpen,
          'menu-open': store.sideMenuOpen,
        }}
      >
        <RouterOutlet />
        <RealMetricsOptimization builderApiKey={BUILDER_PUBLIC_API_KEY} />
      </body>
    </QwikCityProvider>
  );
});

export function collectSymbols() {
  (window as any).symbols = [];
  document.addEventListener('qsymbol', (e) => (window as any).symbols.push((e as any).detail));
}
