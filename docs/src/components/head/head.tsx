import { partytownSnippet } from '@builder.io/partytown/integration';

export const Head = () => (
  <>
    <meta charSet="utf-8" />

    <title>Qwik</title>
    <meta name="viewport" content="width=device-width" />

    <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
    <link rel="icon" href="/favicons/favicon.svg" type="image/svg+xml" />

    <meta name="viewport" content="width=device-width" />
    <meta name="apple-mobile-web-app-title" content="Qwik" />
    <meta name="application-name" content="Qwik" />
    <meta name="theme-color" content="#ffffff" />

    <meta name="twitter:site" content="@QwikDev" />
    <meta name="twitter:creator" content="@QwikDev" />
    <meta name="twitter:card" content="summary_large_image" />

    <meta property="fb:app_id" content="676395883130092" />

    <meta name="og:url" content="https://qwik.builder.io/" />
    <meta name="og:type" content="website" />
    <meta name="og:title" content="Qwik" />
    <meta name="og:description" content="Qwik is Framework reimagined for the edge" />
    <meta
      property="og:image"
      content="https://cdn.builder.io/api/v1/image/assets%2Ffe30f73e01ef40558cd69a9493eba2a2%2F6566e6d9309f44b4b346ab50abb5fc6d?width=1200"
    />
    <meta
      property="og:image:alt"
      content="Image of Qwik Framework Logo, Framework reimagined for the edge. Code snippet npm init qwik@latest"
    />
    <meta property="og:locale" content="en_US" />
    <meta property="og:site_name" content="QwikDev" />

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
  </>
);
