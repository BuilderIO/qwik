/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for Fastly when building for production.
 *
 * Learn more about the Fastly integration here:
 * - https://qwik.builder.io/docs/deployments/fastly/
 *
 */
import {
  createQwikCity,
  type PlatformFastly,
} from "@builder.io/qwik-city/middleware/fastly";
import qwikCityPlan from "@qwik-city-plan";
import { manifest } from "@qwik-client-manifest";
import render from "./entry.ssr";

declare global {
  interface QwikCityPlatform extends PlatformFastly {}
}

const fetch = createQwikCity({ render, qwikCityPlan, manifest });

export { fetch };
