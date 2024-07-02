import {
  vercelServerlessAdapter,
  FUNCTION_DIRECTORY,
} from "@builder.io/qwik-city/adapters/vercel/serverless";
import { extendConfig } from "@builder.io/qwik-city/vite";
import baseConfig from "../../vite.config";

export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["src/entry.vercel-serverless.tsx", "@qwik-city-plan"],
      },
      outDir: `.vercel/output/functions/${FUNCTION_DIRECTORY}.func`,
    },
    plugins: [vercelServerlessAdapter()],
  };
});
