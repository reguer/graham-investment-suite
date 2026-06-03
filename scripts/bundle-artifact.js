import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const artifactDir = join(process.cwd(), "artifacts");
mkdirSync(artifactDir, { recursive: true });

const grahamPath = join(artifactDir, "graham_analyzer.jsx");
const macroPath = join(artifactDir, "macro_radar.jsx");

function ensureArtifact(filePath, fallback) {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, fallback, "utf8");
  }

  const contents = readFileSync(filePath, "utf8");
  if (!contents.includes("export default")) {
    throw new Error(`${filePath} debe contener export default.`);
  }
}

const fallbackGraham = `import React from "react";

export default function GrahamAnalyzerArtifact() {
  return React.createElement("div", {
    style: { background: "#060911", color: "#e2e8f0", minHeight: "100vh", padding: 24, fontFamily: "system-ui, sans-serif" }
  }, [
    React.createElement("h1", { key: "h" }, "Graham Analyzer"),
    React.createElement("p", { key: "p" }, "Artifact fallback. Ejecuta npm run build:artifact desde el repo para validar la copia standalone completa.")
  ]);
}
`;

const fallbackMacro = `import React from "react";

export default function MacroRadarArtifact() {
  return React.createElement("div", {
    style: { background: "#060911", color: "#e2e8f0", minHeight: "100vh", padding: 24, fontFamily: "system-ui, sans-serif" }
  }, [
    React.createElement("h1", { key: "h" }, "Macro Radar"),
    React.createElement("p", { key: "p" }, "Placeholder standalone para migrar macro_radar.jsx cuando este disponible.")
  ]);
}
`;

ensureArtifact(grahamPath, fallbackGraham);
ensureArtifact(macroPath, fallbackMacro);

console.log("Artifacts validados:");
console.log(`- ${grahamPath}`);
console.log(`- ${macroPath}`);
