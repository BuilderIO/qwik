import { partytownSnippet } from '@builder.io/partytown/integration';

export const Vendor = () => {
  return (
    <>
      {/*  Analytics  */}
      <script
        innerHTML={partytownSnippet({
          forward: ['dataLayer.push'],
        })}
      />
      <script
        type="text/partytown"
        innerHTML={`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NR2STLN');`}
      />

      <script
        type="text/partytown"
        src="https://cdn.jsdelivr.net/npm/@builder.io/persist-attribution@0.0.1-beta-2/dist/persist-attribution.min.js"
        id="persist-attribution-init"
        data-send-page-view-events="true"
      />

      {/*  DNS Prefetch  */}
      <link rel="dns-prefetch" href="https://cdn.jsdelivr.net/" />
      <link rel="dns-prefetch" href="https://cdn.builder.io/" />
    </>
  );
};
