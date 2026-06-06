import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { createLocalDashboardApiPlugin } from "./scripts/local-dashboard-api.js";

const localRequire = createRequire(import.meta.url);
const repairedPackagePath = "C:/npm-cache/graham-repair/package.json";
const repairedRequire = existsSync(repairedPackagePath) ? createRequire(repairedPackagePath) : null;

function loadDevDependency(name) {
  try {
    return localRequire(name);
  } catch {
    if (!repairedRequire) throw new Error(`No se pudo cargar ${name}. Ejecuta npm install.`);
    return repairedRequire(name);
  }
}

function resolveDependency(name) {
  try {
    return localRequire.resolve(name);
  } catch {
    if (!repairedRequire) throw new Error(`No se pudo resolver ${name}. Ejecuta npm install.`);
    return repairedRequire.resolve(name);
  }
}

const { defineConfig } = loadDevDependency("vite");
const react = loadDevDependency("@vitejs/plugin-react").default;

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/graham-investment-suite/" : "/",
  plugins: [
    react(),
    command === "serve" ? createLocalDashboardApiPlugin() : null,
  ].filter(Boolean),
  resolve: {
    alias: [
      { find: /^react$/, replacement: resolveDependency("react") },
      { find: /^react\/jsx-runtime$/, replacement: resolveDependency("react/jsx-runtime") },
      { find: /^react-dom$/, replacement: resolveDependency("react-dom") },
      { find: /^react-dom\/client$/, replacement: resolveDependency("react-dom/client") },
    ],
  },
  test: {
    environment: "node",
  },
}));
