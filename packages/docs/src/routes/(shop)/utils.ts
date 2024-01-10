import { createContextId } from '@builder.io/qwik';
import type { Product, ShopApp } from './types';
import type { Cookie } from '@builder.io/qwik-city';
import type { CookieOptions } from 'express';

export const COOKIE_CART_ID_KEY = 'cartid';

export const SHOP_CONTEXT = createContextId<ShopApp>('shop_context');

export const fetchFromShopify = async (body: unknown) =>
  await fetch(import.meta.env.PUBLIC_SHOPIFY_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': import.meta.env.PUBLIC_SHOPIFY_TOKEN,
    },
    body: JSON.stringify(body),
  });

export const mapProducts = (data: { node: Product }[]) =>
  data
    .filter(({ node }) => node.availableForSale)
    .map(({ node }) => ({
      id: node.id,
      title: node.title,
      availableForSale: node.availableForSale,
      descriptionHtml: node.descriptionHtml,
      image: node.images.edges[0].node,
      variants: node.variants.edges.map(({ node }) => node),
    }));

export const setCookie = (cookie: Cookie, name: string, value: string) => {
  const maxAge = 60 * 60 * 24 * 30;
  const options: CookieOptions = { maxAge, sameSite: 'strict', path: '/', secure: true };
  cookie.set(name, value, options);
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=-1; Secure; SameSite=Strict; path=/`;
};

export function formatPrice(value = 0, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}
