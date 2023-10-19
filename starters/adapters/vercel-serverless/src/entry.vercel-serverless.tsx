/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for Vercel Serverless when building for production.
 *
 * Learn more about the Vercel Serverless integration here:
 * - https://qwik.builder.io/docs/deployments/vercel-serverless/
 *
 */
import {
  createQwikCity,
  type PlatformNode,
} from "@builder.io/qwik-city/middleware/node";
import qwikCityPlan from "@qwik-city-plan";
import { manifest } from "@qwik-client-manifest";
import render from "./entry.ssr";

declare global {
  interface QwikCityPlatform extends PlatformNode {}
}

export default createQwikCity({ render, qwikCityPlan, manifest });
