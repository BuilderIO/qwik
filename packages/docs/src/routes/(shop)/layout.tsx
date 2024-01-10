import { $, component$, Slot, useContextProvider, useStore, useTask$ } from '@builder.io/qwik';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { routeLoader$, type RequestHandler } from '@builder.io/qwik-city';
import {
  COOKIE_CART_ID_KEY,
  fetchFromShopify,
  mapProducts,
  setCookie,
  SHOP_CONTEXT,
} from './utils';
import { checkoutQuery, productsQuery } from './query';
import { checkoutCreateMutation } from './mutation';
import { useImageProvider, type ImageTransformerProps } from 'qwik-image';
import type { CheckoutQuery, ProductsQuery, CheckoutCreateMutation, ShopApp } from './types';

export const onRequest: RequestHandler = async (request) => {
  request.cacheControl(600);
};

export const useProductsLoader = routeLoader$(async () => {
  const response = await fetchFromShopify(productsQuery());
  const {
    data: { node },
  }: ProductsQuery = await response.json();
  return mapProducts(node.products.edges);
});

export const useCartLoader = routeLoader$(async ({ cookie }) => {
  const cartId = cookie.get(COOKIE_CART_ID_KEY)?.value;
  const body = cartId ? checkoutQuery(cartId) : checkoutCreateMutation();
  const response = await fetchFromShopify(body);
  const { data }: CheckoutQuery | CheckoutCreateMutation = await response.json();

  const cart = 'node' in data ? data.node : data.checkoutCreate.checkout;

  if (!cartId && cart.id) {
    setCookie(cookie, COOKIE_CART_ID_KEY, cart.id);
  }
  return cart;
});

export default component$(() => {
  const cart = useCartLoader();
  useImageProvider({ imageTransformer$: $(({ src }: ImageTransformerProps): string => src) });
  const appShop = useStore<ShopApp>({ products: useProductsLoader().value });
  useContextProvider(SHOP_CONTEXT, appShop);

  useTask$(() => {
    appShop.cart = cart.value;
  });

  return (
    <>
      <Header />
      <main>
        <Slot />
      </main>
      <div class="px-4">
        <Footer />
      </div>
    </>
  );
});
