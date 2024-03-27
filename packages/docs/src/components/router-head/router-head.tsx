/* eslint-disable no-console */
import { component$ } from '@builder.io/qwik';
import { useDocumentHead, useLocation } from '@builder.io/qwik-city';
import { Social } from './social';
import { Vendor } from './vendor';
import { ThemeScript } from './theme-script';

export const RouterHead = component$(() => {
  const { url } = useLocation();
  const head = useDocumentHead();
  const title = head.title
    ? `${head.title} 📚 Qwik Documentation`
    : `Qwik - Framework reimagined for the edge`;
  const description =
    head.meta.find((m) => m.name === 'description')?.content ||
    `No hydration, auto lazy-loading, edge-optimized, and fun 🎉!`;

  const OGImage = {
    imageURL: '',
    ogImgTitle: '',
    ogImgSubTitle: '' as string | undefined,

    get URL() {
      //turn the title into array with [0] -> Title [1] -> subTitle
      const arrayedTitle = title.split(' | ');
      const ogImageUrl = new URL('https://opengraphqwik.vercel.app/api/og?level=1');

      // biggerTitle
      this.ogImgTitle = arrayedTitle[0];
      //smallerTitle
      this.ogImgSubTitle = arrayedTitle[1]
        ? arrayedTitle[1].replace(' 📚 Qwik Documentation', '')
        : undefined;

      //decide whether or not to show dynamic OGimage or use docs default social card
      if (this.ogImgSubTitle == undefined || this.ogImgTitle == undefined) {
        this.imageURL = new URL(`/logos/social-card.jpg`, url).href;

        return this.imageURL;
      } else {
        ogImageUrl.searchParams.set('title', this.ogImgTitle);
        ogImageUrl.searchParams.set('subtitle', this.ogImgSubTitle);
        // ogImageUrl.searchParams.set('level', this.routeLevel.toString());

        this.imageURL = ogImageUrl.toString();

        return this.imageURL;
      }
    },
  };

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url.href} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="apple-mobile-web-app-title" content="Qwik" />
      <meta name="application-name" content="Qwik" />
      <meta name="apple-mobile-web-app-title" content="Qwik" />
      <meta name="theme-color" content="#006ce9" />
      <meta name="color-scheme" content="dark light" />

      <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
      <link rel="icon" href="/favicons/favicon.svg" type="image/svg+xml" />

      {import.meta.env.PROD && (
        <>
          <Social title={title} description={description} href={url.href} ogImage={OGImage.URL} />
          <Vendor />
        </>
      )}

      {head.meta
        // Skip description because that was already added at the top
        .filter((s) => s.name !== 'description')
        .map((m, key) => (
          <meta key={key} {...m} />
        ))}

      {head.links.map((l, key) => (
        <link key={key} {...l} />
      ))}

      {head.styles.map((s, key) => (
        <style key={key} {...s.props} dangerouslySetInnerHTML={s.style} />
      ))}

      <ThemeScript />
    </>
  );
});
