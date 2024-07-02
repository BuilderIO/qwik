/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for Vercel Edge when building for production.
 *
 * Learn more about the Vercel Edge integration here:
 * - https://qwik.dev/docs/deployments/vercel-edge/
 *
 */
import {
  createQwikCity,
  type PlatformVercelServerless,
} from "@builder.io/qwik-city/middleware/vercel/serverless";
import qwikCityPlan from "@qwik-city-plan";
import { manifest } from "@qwik-client-manifest";
import render from "./entry.ssr";

declare global {
  interface QwikCityPlatform extends PlatformVercelServerless {}
}

export default createQwikCity({ render, qwikCityPlan, manifest });
