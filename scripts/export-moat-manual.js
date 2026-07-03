import { exportLocalMoatManualToPublic } from "./moat-manual-store.js";

const result = exportLocalMoatManualToPublic();

console.log(`Moat manual exportado: ${result.count} tickers.`);
console.log(`data/public: ${result.dataPublicPath}`);
console.log(`public/data: ${result.publicSitePath}`);
