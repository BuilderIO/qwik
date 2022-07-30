export const Manifest = () => {
  return (
    <>
      {/*  App Manifest  */}
      <link rel="manifest" href="/app.webmanifest" />
      <meta name="apple-mobile-web-app-title" content="Qwik" />
      <meta name="application-name" content="Qwik" />
      <meta name="apple-mobile-web-app-title" content="MyApp" />
      <meta name="theme-color" content="#0093ee" />

      {/*  App Icons  */}
      <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
      <link rel="icon" href="/favicons/favicon.svg" type="image/svg+xml" />
    </>
  );
};
