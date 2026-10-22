import { fileURLToPath } from "node:url";
import { defineConfig, transformWithOxc } from "vite";
import react from "@vitejs/plugin-react";

// The source uses JSX inside .js files; compile those as JSX before the React plugin runs.
const srcDir = fileURLToPath(new URL("./src/", import.meta.url));

const jsxInJs = {
  name: "jsx-in-js",
  enforce: "pre",
  transform: (code, id) =>
    id.startsWith(srcDir) && id.split("?")[0].endsWith(".js")
      ? transformWithOxc(code, id, { lang: "jsx", jsx: { runtime: "automatic" } })
      : null,
};

export default defineConfig({
  plugins: [jsxInJs, react({ include: /\.(js|jsx)$/ })],
  server: {
    port: 3218,
    // Forward API calls to the Express server during development.
    proxy: { "/api": "http://localhost:3233" },
  },
  build: { outDir: "build", sourcemap: false },
  test: { environment: "node", include: ["src/**/*.{test,spec}.{js,jsx}"], globals: true },
});
