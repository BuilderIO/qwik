import type { ResolvedDocumentHead, RouteLocation } from '@builder.io/qwik-city';

export const Social = ({ head, loc }: SocialProps) => {
  const title = head.title;
  const desc = head.meta.find((m) => m.name === 'description')?.content;
  const img =
    'https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F56f46c6818704d47957a587157e2444f?width=1200';
  const imgAlt =
    'Image of Qwik Framework Logo, Framework reimagined for the edge. Code snippet npm init qwik@latest';

  return (
    <>
      {/*  Open Graph: https://ogp.me/  */}
      <meta property="og:url" content={loc.href} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:image:alt" content={imgAlt} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Qwik" />
      <meta property="og:locale" content="en_US" />

      {/*  Twitter: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards  */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@QwikDev" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      <meta name="twitter:image:alt" content={imgAlt} />

      {/*  Facebook  */}
      <meta property="fb:app_id" content="676395883130092" />
    </>
  );
};

interface SocialProps {
  loc: RouteLocation;
  head: ResolvedDocumentHead;
}
