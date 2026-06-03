import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/graham-investment-suite/" : "/",
  plugins: [react()],
  test: {
    environment: "node",
  },
});
