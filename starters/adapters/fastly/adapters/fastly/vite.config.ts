import { fastlyAdapter } from "@builder.io/qwik-city/adapters/fastly/vite";
import { extendConfig } from "@builder.io/qwik-city/vite";
import baseConfig from "../../vite.config";

export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["src/entry.fastly.tsx", "@qwik-city-plan"],
        external: [/fastly:.*/],
      },
    },
    plugins: [fastlyAdapter()],
  };
});
