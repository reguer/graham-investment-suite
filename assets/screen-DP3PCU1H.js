import{A as g,j as C,S as T,a as Y,b as W}from"./index-Du49NGBX.js";import{D as K}from"./Dot-0EihOKZy.js";function Re(e,a){if(e===null||a===null||a===0)return null;const i=e/a;return Number.isFinite(i)?i:null}function Q(e,a){return e===null||a===null||e<=0||a<=0?null:Math.sqrt(22.5*e*a)}function z({grahamFormula:e,pricePe20:a,pricePb2:i}){return e!==null&&i!==null?Math.min(e,a,i):a}function j(e,a){return e!==null&&a?(e-a)/a:null}const J="default",R={default:{id:"default",label:"Graham defensivo clásico",thresholds:{peMax:20,pbMax:2,pePbMax:22.5,debtMax:1,currentMin:2,quickMin:1},omit:[],useTangibleBook:!1},financial:{id:"financial",label:"Financiero (bancos / seguros)",thresholds:{peMax:20,pbMax:2,pePbMax:22.5,debtMax:null,currentMin:null,quickMin:null},omit:["current","quick","debt"],useTangibleBook:!1},utilities:{id:"utilities",label:"Utilities (deuda regulada)",thresholds:{peMax:20,pbMax:2,pePbMax:22.5,debtMax:2.5,currentMin:1,quickMin:null},omit:["quick"],useTangibleBook:!1},reit:{id:"reit",label:"Real Estate / REIT",thresholds:{peMax:20,pbMax:null,pePbMax:null,debtMax:null,currentMin:null,quickMin:null},omit:["pb","pePb","current","quick","debt"],useTangibleBook:!1},tech:{id:"tech",label:"Tecnología (intangible-intensiva)",thresholds:{peMax:20,pbMax:2.5,pePbMax:22.5,debtMax:1,currentMin:1.5,quickMin:1},omit:[],useTangibleBook:!0},healthcare:{id:"healthcare",label:"Salud / Farma",thresholds:{peMax:20,pbMax:2.5,pePbMax:22.5,debtMax:1.2,currentMin:1.5,quickMin:1},omit:[],useTangibleBook:!0},consumer_staples:{id:"consumer_staples",label:"Consumo defensivo",thresholds:{peMax:20,pbMax:2,pePbMax:22.5,debtMax:1.2,currentMin:1.5,quickMin:null},omit:["quick"],useTangibleBook:!1},industrial:{id:"industrial",label:"Industrial / Consumo cíclico",thresholds:{peMax:20,pbMax:2,pePbMax:22.5,debtMax:1,currentMin:2,quickMin:1},omit:[],useTangibleBook:!1},energy:{id:"energy",label:"Energía (petróleo / gas / midstream)",thresholds:{peMax:20,pbMax:2.5,pePbMax:22.5,debtMax:1.5,currentMin:1,quickMin:null},omit:["quick"],useTangibleBook:!1},basic_materials:{id:"basic_materials",label:"Materiales básicos (minería / metales)",thresholds:{peMax:20,pbMax:2.5,pePbMax:22.5,debtMax:1.5,currentMin:1,quickMin:null},omit:["quick"],useTangibleBook:!1}},I=R.default;function Z(e){return R[e]||I}function De(e){const a=I.thresholds,i={};for(const n of Object.keys(a))e.thresholds[n]!==a[n]&&(i[n]={base:a[n],adjusted:e.thresholds[n]});return i}function $(e){return e.roe>.1&&e.roa>.05&&e.tie>5&&e.quickRatio>=1&&e.fcf>0}function v(e){return e!=null&&e!==""&&Number.isFinite(Number(e))}function ee(e,a=I){const i=a.thresholds,n=new Set(a.omit||[]),t=a.useTangibleBook?e.pbTangible:e.pb,r=a.useTangibleBook?e.pePbTangible:e.pePb,o=(m,p,S)=>m||v(p)&&S;if(o(n.has("pePb"),r,r<=i.pePbMax)&&o(n.has("debt"),e.debtRatio,e.debtRatio<i.debtMax)&&o(n.has("current"),e.currentRatio,e.currentRatio>=i.currentMin)&&o(n.has("pe"),e.pe,e.pe<=i.peMax)&&o(n.has("pb"),t,t<=i.pbMax)&&e.epsAllPositive===!0)return{id:"graham_approved",label:"APROBADA GRAHAMIANA",color:g.green,reason:"Cumple valuación defensiva, liquidez, deuda controlada y EPS positivo.",sectorId:a.id};const c=(n.has("pePb")?v(e.pe)&&v(i.peMax)&&e.pe>i.peMax:v(r)&&r>i.pePbMax)&&$(e)&&e.epsAllPositive===!0;return c&&e.epsGrowing===!0?{id:"excellent_expensive",label:"EXCELENTE, PERO CARA",color:g.yellow,reason:"Empresa fuerte, pero cotiza fuera del rango Graham defensivo.",sectorId:a.id}:c&&e.epsGrowing===!1?{id:"good_overvalued",label:"BUENA EMPRESA, SOBREVALORADA",color:g.orange,reason:"La calidad financiera existe, pero el crecimiento de EPS no es consistente y la valuación excede el límite del sector.",sectorId:a.id}:{id:"rejected",label:"RECHAZADA",color:g.red,reason:"No cumple los criterios mínimos defensivos de Graham.",sectorId:a.id}}const ae=[{id:"reit",keywords:["reit","real estate"]},{id:"financial",keywords:["financial","bank","insurance","insurer","capital markets","asset management"]},{id:"utilities",keywords:["utilit","regulated electric","power generation","water","gas distribution"]},{id:"energy",keywords:["energy","oil","gas e&p","petroleum","midstream","drilling","refin","pipeline","exploration"]},{id:"tech",keywords:["technology","software","semiconductor","internet","information technology","it services","electronic"]},{id:"healthcare",keywords:["healthcare","health care","pharmaceutic","biotech","medical","drug"]},{id:"consumer_staples",keywords:["consumer defensive","consumer staples","packaged foods","beverages","household","tobacco"]},{id:"basic_materials",keywords:["basic material","mining","metals","gold","silver","copper","steel","aluminum","iron","coal","chemical","precious metals"]},{id:"industrial",keywords:["industrial","construction","consumer cyclical","manufactur","aerospace","machinery","auto"]}];function ie(e){const a=Number(e);return Number.isFinite(a)?a>=6e3&&a<=6199||a>=6300&&a<=6411?"financial":a>=6500&&a<=6799?"reit":a>=1300&&a<=1399||a>=2900&&a<=2999||a>=4610&&a<=4619?"energy":a>=4900&&a<=4991?"utilities":a>=7370&&a<=7379||a>=3570&&a<=3589||a>=3670&&a<=3679?"tech":a>=2833&&a<=2836||a>=8e3&&a<=8099?"healthcare":a>=2e3&&a<=2199?"consumer_staples":a>=1e3&&a<=1099||a>=1200&&a<=1299||a>=1400&&a<=1499||a>=2800&&a<=2829||a>=3300&&a<=3399?"basic_materials":a>=3400&&a<=3999||a>=1500&&a<=1799?"industrial":null:null}function P(e){const a=String(e||"").toLowerCase();if(!a.trim())return null;for(const i of ae)if(i.keywords.some(n=>a.includes(n)))return i.id;return null}function re({sector:e,industry:a,sicCode:i}={}){const n=ie(i);if(n)return n;const t=P(e);if(t)return t;const r=P(a);return r||J}function ne(e){var a;return((a=Object.entries(g).find(([,i])=>i===e))==null?void 0:a[0])||"gray"}function Ne({label:e,value:a,sublabel:i,note:n,color:t=g.gray}){const r=ne(t);return C.jsxs("article",{style:{background:W[r],border:`3px solid ${Y[r]}`,borderRadius:0,padding:14,minHeight:126,boxShadow:`5px 5px 0 ${T.shadow}`},children:[C.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,color:T.text,fontSize:12,fontWeight:900,textTransform:"uppercase"},children:[C.jsx(K,{color:t}),C.jsx("span",{children:e})]}),C.jsx("div",{style:{marginTop:10,fontFamily:"IBM Plex Mono, monospace",color:T.text,fontSize:26,fontWeight:900,wordBreak:"break-word"},children:a}),i?C.jsx("div",{style:{marginTop:8,color:T.muted,fontSize:12},children:i}):null,n?C.jsx("div",{style:{marginTop:6,color:g.redText,fontSize:11,fontWeight:800},children:n}):null]})}const D="2026-06-10",u="Yahoo Finance quoteSummary/key-statistics",d=D,oe=[{ticker:"CEG",companyName:"Constellation Energy",sector:"Utilities / Nuclear AI Infrastructure",price:251.65,pe:21.86,pb:2.72,pePb:59.54,debtRatio:.66,currentRatio:1.36,quickRatio:.48,fcf:-4478.88,epsAllPositive:!1,source:u,sourceDate:d,note:"Utility nuclear con exposicion directa a demanda electrica de data centers. Calidad estrategica alta, pero Graham exige cautela por P/B elevado y FCF negativo."},{ticker:"VST",companyName:"Vistra",sector:"Utilities / Power Generation",price:146.22,pe:24.45,pb:18.86,pePb:461.15,debtRatio:3.55,currentRatio:.9,quickRatio:.26,fcf:476.88,epsAllPositive:!1,source:u,sourceDate:d,note:"Generacion electrica ligada a demanda de energia para AI. Sigue en radar, pero no es compra Graham defensiva por deuda, liquidez y P/B muy altos."},{ticker:"ETR",companyName:"Entergy",sector:"Utilities / Regulated Electric",price:109.66,pe:27.97,pb:2.89,pePb:80.96,debtRatio:1.93,currentRatio:.96,quickRatio:.61,fcf:-3913.1,epsAllPositive:null,source:u,sourceDate:d,note:"Utility regulada con exposicion al sur de EE.UU. y carga electrica industrial. La tesis es infraestructura, no aprobacion Graham: FCF negativo y deuda alta."},{ticker:"HUBB",companyName:"Hubbell",sector:"Industrials / Electrical Equipment",price:486.47,pe:28.73,pb:6.82,pePb:196,debtRatio:.72,currentRatio:1.58,quickRatio:.84,fcf:541.45,epsAllPositive:null,source:u,sourceDate:d,note:"Infraestructura electrica para redes, electrificacion y data centers. Empresa de calidad, aunque fuera del rango defensivo Graham por valuacion."},{ticker:"INGR",companyName:"Ingredion",sector:"Consumer Defensive / Packaged Foods",price:101.64,pe:9.77,pb:1.46,pePb:14.28,debtRatio:.41,currentRatio:2.76,quickRatio:1.78,fcf:357.75,epsAllPositive:!0,source:u,sourceDate:d,note:"Defensiva de ingredientes y alimentos con P/E bajo, P/B razonable, deuda controlada y liquidez superior a 2. Es la candidata Graham mas limpia del grupo."},{ticker:"PFE",companyName:"Pfizer",sector:"Healthcare / Pharmaceuticals",price:25.7,pe:19.62,pb:1.63,pePb:31.89,debtRatio:.72,currentRatio:1.25,quickRatio:.85,fcf:12376.63,epsAllPositive:!0,source:u,sourceDate:d,note:"Farmaceutica grande con FCF positivo y P/E bajo 20. No pasa Graham estricta por liquidez menor a 2 y P/E x P/B sobre 22.5."},{ticker:"GIS",companyName:"General Mills",sector:"Consumer Defensive / Packaged Foods",price:33.72,pe:8.24,pb:3.26,pePb:26.85,debtRatio:2.18,currentRatio:.56,quickRatio:.3,fcf:2263.38,epsAllPositive:!0,source:u,sourceDate:d,note:"Consumo defensivo con P/E bajo y FCF positivo. Se mantiene en observacion por deuda alta, liquidez baja y P/B mayor al limite defensivo."},{ticker:"REGN",companyName:"Regeneron Pharmaceuticals",sector:"Healthcare / Biotechnology",price:616.18,pe:15.04,pb:2,pePb:30.06,debtRatio:.09,currentRatio:3.57,quickRatio:2.84,fcf:3273.35,epsAllPositive:!0,source:u,sourceDate:d,note:"Salud rentable con balance muy fuerte, liquidez amplia y FCF positivo. Queda cerca, pero P/E x P/B supera el umbral 22.5."},{ticker:"BAC",companyName:"Bank of America",sector:"Financial Services / Banks",price:54.42,pe:13.5,pb:1.41,pePb:19.01,debtRatio:null,currentRatio:null,quickRatio:null,fcf:null,epsAllPositive:!0,source:u,sourceDate:d,note:"Banco diversificado con P/B menor a 1.5 y ROE sobre 10%. En financieras los ratios current/quick/debt no son comparables con industriales."},{ticker:"USB",companyName:"U.S. Bancorp",sector:"Financial Services / Banking",price:55.52,pe:12.05,pb:1.48,pePb:17.83,debtRatio:null,currentRatio:null,quickRatio:null,fcf:null,epsAllPositive:!0,source:u,sourceDate:d,note:"Banco regional con valuacion moderada y largo historial de dividendos. P/E x P/B dentro del umbral Graham para financieras. Metricas industriales no aplican."},{ticker:"CFG",companyName:"Citizens Financial Group",sector:"Financial Services / Banking",price:63.78,pe:16.35,pb:1.11,pePb:18.15,debtRatio:null,currentRatio:null,quickRatio:null,fcf:null,epsAllPositive:!0,source:u,sourceDate:d,note:"Banco regional con P/B menor a 1.2 y P/E x P/B dentro del rango Graham. Menor capitalizacion que los grandes; mas sensible a ciclos crediticios."},{ticker:"TRV",companyName:"The Travelers Companies",sector:"Financial Services / Insurance",price:299.6,pe:8.58,pb:1.99,pePb:17.07,debtRatio:null,currentRatio:null,quickRatio:null,fcf:null,epsAllPositive:!0,source:u,sourceDate:d,note:"Aseguradora P&C con P/E bajo y P/B cerca del limite 2. Pasa la regla 22.5 con margen. Clave evaluar siniestralidad y ROE; metricas industriales no aplican."},{ticker:"PRU",companyName:"Prudential Financial",sector:"Financial Services / Insurance",price:103.7,pe:10.68,pb:1.13,pePb:12.03,debtRatio:null,currentRatio:null,quickRatio:null,fcf:10379,epsAllPositive:null,source:u,sourceDate:d,note:"Aseguradora con P/B bajo, ROE cercano a criterio y FCF positivo. Requiere lectura financiera especifica antes de compararla contra industriales."},{ticker:"QCOM",companyName:"QUALCOMM",sector:"Technology / Semiconductors",price:205.42,pe:22.09,pb:7.97,pePb:176.15,debtRatio:.56,currentRatio:2.37,quickRatio:1.45,fcf:9589.62,epsAllPositive:!0,source:u,sourceDate:d,note:"Tecnologia rentable, FCF fuerte y liquidez suficiente. Es razonable frente a growth puro, pero no Graham por P/B elevado."},{ticker:"CTSH",companyName:"Cognizant Technology Solutions",sector:"Technology / IT Services",price:52.94,pe:11.48,pb:1.67,pePb:19.12,debtRatio:.07,currentRatio:2.23,quickRatio:1.74,fcf:1908.88,epsAllPositive:!0,source:u,sourceDate:d,note:"Tecnologia no especulativa: P/E bajo, liquidez fuerte, deuda minima y FCF positivo. Cumple gran parte del perfil defensivo."},{ticker:"ORCL",companyName:"Oracle Corporation",sector:"Technology / Software Infrastructure",price:212.08,pe:38.01,pb:18.18,pePb:690.91,debtRatio:7.21,currentRatio:.75,quickRatio:.75,fcf:-890,epsAllPositive:!0,epsGrowing:!0,source:"Yahoo Finance fundamentalsTimeSeries + FX",sourceDate:"2025-05-31",note:"Software de base de datos y nube empresarial. EPS creciente y positivo, pero rechazada Graham: P/E 38, P/B 18 (P/E x P/B ~691), deuda elevada (7.2x patrimonio), liquidez inferior a 1 y FCF negativo. Perfil de crecimiento, no defensivo."}],te=oe.map(e=>({...e,captureDate:e.captureDate||D}));function N(e){return e!=null&&e!==""&&Number.isFinite(Number(e))}function k(e){return N(e)?Number(e).toFixed(2):"N/D"}function se(e,a=I){const i=a.thresholds,n=new Set(a.omit||[]),t=a.useTangibleBook?e.pbTangible:e.pb,r=a.useTangibleBook?e.pePbTangible:e.pePb,o=[{key:"pe",label:"P/E",value:e.pe,limit:i.peMax,op:"<=",sym:">"},{key:"pb",label:a.useTangibleBook?"P/B tang.":"P/B",value:t,limit:i.pbMax,op:"<=",sym:">"},{key:"pePb",label:"P/E×P/B",value:r,limit:i.pePbMax,op:"<=",sym:">"},{key:"debt",label:"Deuda",value:e.debtRatio,limit:i.debtMax,op:"<",sym:">="},{key:"current",label:"Corriente",value:e.currentRatio,limit:i.currentMin,op:">=",sym:"<"}],l=[];for(const s of o){if(n.has(s.key)||s.limit===null||s.limit===void 0)continue;if(!N(s.value)){l.push(`${s.label} N/D`);continue}const c=Number(s.value);(s.op==="<="?c<=s.limit:s.op==="<"?c<s.limit:c>=s.limit)||l.push(`${s.label} ${k(c)} ${s.sym} ${k(s.limit)}`)}return e.epsAllPositive!==!0&&l.push("EPS no siempre positivo"),e.hasNegativeEquity&&l.push("Patrimonio negativo"),l}function ce(e,a=I){const i=se(e,a);return i.length===0?"Cumple los criterios defensivos del sector.":`Falla: ${i.join(" · ")}`}const y={graham_approved:{id:"graham_approved",label:"Aprobada Graham",group:"opportunity",rank:0,color:"#22c55e"},near_defensive:{id:"near_defensive",label:"Cerca de rango defensivo",group:"opportunity",rank:1,color:"#eab308"},excellent_expensive:{id:"excellent_expensive",label:"Excelente, pero cara",group:"watch",rank:2,color:"#eab308"},good_overvalued:{id:"good_overvalued",label:"Buena empresa, sobrevalorada",group:"watch",rank:3,color:"#f97316"},rejected_model:{id:"rejected_model",label:"Rechazada por modelo",group:"discarded",rank:4,color:"#ef4444"},watch_observation:{id:"watch_observation",label:"En observacion",group:"watch",rank:5,color:"#64748b"},pending_fundamentals:{id:"pending_fundamentals",label:"Pendiente de fundamentales",group:"pending",rank:6,color:"#38bdf8"},manual_review:{id:"manual_review",label:"Revision manual",group:"pending",rank:7,color:"#a78bfa"},unsupported_analysis:{id:"unsupported_analysis",label:"No soportada",group:"pending",rank:8,color:"#94a3b8"},index_reference:{id:"index_reference",label:"Referencia de mercado",group:"reference",rank:9,color:"#38bdf8"}};function le(e){var a,i,n,t,r;return e.alertLevel==="reference"||e.analysisStatus==="index_reference"||e.analysisStatus==="market_reference"||e.validationStatus==="index_reference"||e.validationStatus==="market_reference"||["INDEX","ETF","FUTURE"].includes(String(e.quoteType||"").toUpperCase())?y.index_reference:e.alertLevel==="approved"||((a=e.classification)==null?void 0:a.id)==="graham_approved"?y.graham_approved:e.alertLevel==="near"?y.near_defensive:((i=e.classification)==null?void 0:i.id)==="excellent_expensive"?y.excellent_expensive:((n=e.classification)==null?void 0:n.id)==="good_overvalued"?y.good_overvalued:((t=e.classification)==null?void 0:t.id)==="rejected"||((r=e.classification)==null?void 0:r.label)==="RECHAZADA"||e.validationStatus==="yahoo_model_rejected"?y.rejected_model:e.validationStatus==="needs_manual_review"||e.validationStatus==="yahoo_partial_incomplete"||e.validationStatus==="source_required"||e.analysisStatus==="analysis_external_pending"?y.manual_review:String(e.analysisStatus||"").startsWith("analysis_")?y.unsupported_analysis:e.analysisStatus==="pending_fundamentals"||e.alertLevel==="pending"?y.pending_fundamentals:y.watch_observation}function Fe(){return Object.values(y).sort((e,a)=>e.rank-a.rank)}const b="2026-06-10",F=[{rawTicker:"Index100",ticker:"INDEX100",yahooSymbol:"^NDX",companyName:"Nasdaq-100 Index",quoteType:"INDEX",market:"US",analysisStatus:"index_reference",validationStatus:"index_reference",tags:["index_reference","benchmark","nasdaq-100"],notes:"Indice Nasdaq-100 de referencia. No se analiza con reglas Graham defensivas."},{rawTicker:"SP500",ticker:"SP500",yahooSymbol:"^GSPC",companyName:"S&P 500",quoteType:"INDEX",market:"US",analysisStatus:"index_reference",validationStatus:"index_reference",tags:["index_reference","benchmark","sp500"],notes:"Indice S&P 500 de referencia. No se analiza con reglas Graham defensivas."},{rawTicker:"MU",ticker:"MU",yahooSymbol:"MU.MX",companyName:"Micron Technology, Inc.",sector:"Technology",industry:"Semiconductors",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"MRVL",ticker:"MRVL",yahooSymbol:"MRVL1.MX",companyName:"Marvell Technology, Inc.",sector:"Technology",industry:"Semiconductors",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx_alias"},{rawTicker:"SNDK",ticker:"SNDK",yahooSymbol:"SNDK1.MX",companyName:"Sandisk Corporation",sector:"Technology",industry:"Data Storage",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx_alias"},{rawTicker:"NVDA",ticker:"NVDA",yahooSymbol:"NVDA.MX",companyName:"NVIDIA Corporation",sector:"Technology",industry:"Semiconductors",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"INTC",ticker:"INTC",yahooSymbol:"INTC.MX",companyName:"Intel Corporation",sector:"Technology",industry:"Semiconductors",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"SKHYNIX",ticker:"SKHYNIX",yahooSymbol:"000660.KS",companyName:"SK hynix Inc.",sector:"Technology",industry:"Semiconductors",quoteType:"EQUITY",market:"Korea Exchange",validationStatus:"validated_yahoo_not_mx"},{rawTicker:"BB",ticker:"BB",yahooSymbol:"BB",companyName:"BlackBerry Limited",sector:"Technology",industry:"Software Infrastructure",quoteType:"EQUITY",market:"NYSE",validationStatus:"validated_yahoo_not_mx"},{rawTicker:"MSTR",ticker:"MSTR",yahooSymbol:"MSTR.MX",companyName:"Strategy Inc",sector:"Financial Services",industry:"Asset Management",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"BIDU",ticker:"BIDU",yahooSymbol:"BIDU",companyName:"Baidu, Inc.",sector:"Communication Services",industry:"Internet Content & Information",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"TSLA",ticker:"TSLA",yahooSymbol:"TSLA.MX",companyName:"Tesla, Inc.",sector:"Consumer Cyclical",industry:"Auto Manufacturers",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"AMD",ticker:"AMD",yahooSymbol:"AMD.MX",companyName:"Advanced Micro Devices, Inc.",sector:"Technology",industry:"Semiconductors",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"GOLD",ticker:"GOLD",yahooSymbol:"GC=F",companyName:"Gold Futures",quoteType:"FUTURE",market:"COMEX",analysisStatus:"market_reference",validationStatus:"market_reference",tags:["market_reference","commodity","gold"],notes:"Futuro de oro para contexto macro. No se analiza con reglas Graham defensivas."},{rawTicker:"SILVER",ticker:"SILVER",yahooSymbol:"SI=F",companyName:"Silver Futures",quoteType:"FUTURE",market:"COMEX",analysisStatus:"market_reference",validationStatus:"market_reference",tags:["market_reference","commodity","silver"],notes:"Futuro de plata para contexto macro. No se analiza con reglas Graham defensivas."},{rawTicker:"COPPER",ticker:"COPPER",yahooSymbol:"HG=F",companyName:"Copper Futures",quoteType:"FUTURE",market:"COMEX",analysisStatus:"market_reference",validationStatus:"market_reference",tags:["market_reference","commodity","copper"],notes:"Futuro de cobre para contexto macro/ciclo industrial. No se analiza con reglas Graham defensivas."},{rawTicker:"META",ticker:"META",yahooSymbol:"META.MX",companyName:"Meta Platforms, Inc.",sector:"Communication Services",industry:"Internet Content & Information",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"MOS",ticker:"MOS",yahooSymbol:"MOS.MX",companyName:"The Mosaic Company",sector:"Basic Materials",industry:"Agricultural Inputs",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"BAER",ticker:"BAER",yahooSymbol:"BAER",companyName:"Bridger Aerospace Group Holdings, Inc.",sector:"Industrials",industry:"Aerial Firefighting & Emergency Services",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"SHMD",ticker:"SHMD",yahooSymbol:"SHMD",companyName:"SCHMID Group N.V.",sector:"Technology",industry:"Semiconductor Equipment & Materials",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"CBRS",ticker:"CBRS",yahooSymbol:"CBRS",companyName:"Cerebras Systems Inc.",sector:"Technology",industry:"AI Accelerators & Systems",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"SPACEX",ticker:"SPACEX",yahooSymbol:"SPCX",companyName:"Space Exploration Technologies Corp.",sector:"Technology",industry:"Space Connectivity & Launch Infrastructure",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo_alias",tags:["requested","ai-infrastructure","space-connectivity"],notes:"Yahoo expone SpaceX como SPCX; se conserva rawTicker=SPACEX para busqueda del usuario."},{rawTicker:"TR",ticker:"TR",yahooSymbol:"TR",companyName:"Tootsie Roll Industries, Inc.",sector:"Consumer Defensive",industry:"Confectioners",quoteType:"EQUITY",market:"NYSE",validationStatus:"validated_yahoo"},{rawTicker:"SIVE",ticker:"SIVE",yahooSymbol:"SIVE.ST",companyName:"Sivers Semiconductors AB",sector:"Technology",industry:"Semiconductors",quoteType:"EQUITY",market:"Stockholm",validationStatus:"validated_yahoo_alias"},{rawTicker:"IQE",ticker:"IQE",yahooSymbol:"IQE.L",companyName:"IQE plc",sector:"Technology",industry:"Semiconductor Materials",quoteType:"EQUITY",market:"London Stock Exchange",validationStatus:"validated_yahoo_alias"},{rawTicker:"AAOI",ticker:"AAOI",yahooSymbol:"AAOI",companyName:"Applied Optoelectronics, Inc.",sector:"Technology",industry:"Communication Equipment",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"OPTX",ticker:"OPTX",yahooSymbol:"OPTX",companyName:"Syntec Optics Holdings, Inc.",sector:"Technology",industry:"Electronic Components",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"IREN",ticker:"IREN",yahooSymbol:"IREN",companyName:"IREN Limited",sector:"Technology",industry:"AI Cloud & Data Center Infrastructure",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"BRUN",ticker:"BRUN",yahooSymbol:"BRUN",companyName:"Boost Run, Inc.",sector:"Technology",industry:"AI Cloud & HPC Infrastructure",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"CRWV",ticker:"CRWV",yahooSymbol:"CRWV",companyName:"CoreWeave, Inc.",sector:"Technology",industry:"AI Cloud Infrastructure",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"HIVE",ticker:"HIVE",yahooSymbol:"HIVE",companyName:"HIVE Digital Technologies Ltd.",sector:"Technology",industry:"HPC & Digital Infrastructure",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"CLSK",ticker:"CLSK",yahooSymbol:"CLSK",companyName:"CleanSpark, Inc.",sector:"Technology",industry:"Digital Infrastructure",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"ASYS",ticker:"ASYS",yahooSymbol:"ASYS",companyName:"Amtech Systems, Inc.",sector:"Technology",industry:"Semiconductor Equipment & Materials",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"ICHR",ticker:"ICHR",yahooSymbol:"ICHR",companyName:"Ichor Holdings, Ltd.",sector:"Technology",industry:"Semiconductor Equipment & Materials",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"INTT",ticker:"INTT",yahooSymbol:"INTT",companyName:"InTest Corporation",sector:"Technology",industry:"Semiconductor Equipment & Materials",quoteType:"EQUITY",market:"NYSE American",validationStatus:"validated_yahoo"},{rawTicker:"PENG",ticker:"PENG",yahooSymbol:"PENG",companyName:"Penguin Solutions, Inc.",sector:"Technology",industry:"Computer Hardware",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"AMPG",ticker:"AMPG",yahooSymbol:"AMPG",companyName:"AmpliTech Group, Inc.",sector:"Technology",industry:"Communication Equipment",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"SILC",ticker:"SILC",yahooSymbol:"SILC",companyName:"Silicom Ltd.",sector:"Technology",industry:"Communication Equipment",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"NOK",ticker:"NOK",yahooSymbol:"NOK",companyName:"Nokia Oyj",sector:"Technology",industry:"Communication Equipment",quoteType:"EQUITY",market:"NYSE",validationStatus:"validated_yahoo"},{rawTicker:"XFAB",ticker:"XFAB",yahooSymbol:"XFAB.PA",companyName:"X-FAB Silicon Foundries SE",sector:"Technology",industry:"Semiconductor Foundry",quoteType:"EQUITY",market:"Euronext Paris",validationStatus:"validated_yahoo_alias"},{rawTicker:"MCHP",ticker:"MCHP",yahooSymbol:"MCHP",companyName:"Microchip Technology Incorporated",sector:"Technology",industry:"Semiconductors",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"MX",ticker:"MX",yahooSymbol:"MX",companyName:"Magnachip Semiconductor Corporation",sector:"Technology",industry:"Semiconductors",quoteType:"EQUITY",market:"NYSE",validationStatus:"validated_yahoo"},{rawTicker:"AMBQ",ticker:"AMBQ",yahooSymbol:"AMBQ",companyName:"Ambiq Micro, Inc.",sector:"Technology",industry:"Semiconductors",quoteType:"EQUITY",market:"NYSE",validationStatus:"validated_yahoo"},{rawTicker:"AKAM",ticker:"AKAM",yahooSymbol:"AKAM",companyName:"Akamai Technologies, Inc.",sector:"Technology",industry:"Software Infrastructure",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"}],ue=`
AAPL|AAPL.MX|Apple Inc.|Technology|Consumer Electronics
MSFT|MSFT.MX|Microsoft Corporation|Technology|Software Infrastructure
NVDA|NVDA.MX|NVIDIA Corporation|Technology|Semiconductors
AMZN|AMZN.MX|Amazon.com, Inc.|Consumer Cyclical|Internet Retail
META|META.MX|Meta Platforms, Inc.|Communication Services|Internet Content & Information
GOOGL|GOOGL.MX|Alphabet Inc.|Communication Services|Internet Content & Information
GOOG|GOOG.MX|Alphabet Inc.|Communication Services|Internet Content & Information
AVGO|AVGO.MX|Broadcom Inc.|Technology|Semiconductor - Broad Line
TSLA|TSLA.MX|Tesla, Inc.|Consumer Cyclical|Auto Manufacturers
LLY|LLY.MX|Eli Lilly and Company|Healthcare|Drug Manufacturers General
JPM|JPM.MX|JPMorgan Chase & Co.|Financial Services|Banks Diversified
V|V.MX|Visa Inc.|Financial Services|Credit Services
MA|MA.MX|Mastercard Incorporated|Financial Services|Credit Services
XOM|XOM.MX|Exxon Mobil Corporation|Energy|Oil & Gas Integrated
UNH|UNH.MX|UnitedHealth Group Incorporated|Healthcare|Healthcare Plans
COST|COST.MX|Costco Wholesale Corporation|Consumer Defensive|Discount Stores
NFLX|NFLX.MX|Netflix, Inc.|Communication Services|Entertainment
WMT|WMT.MX|Walmart Inc.|Consumer Defensive|Discount Stores
HD|HD.MX|The Home Depot, Inc.|Consumer Cyclical|Home Improvement Retail
PG|PG.MX|The Procter & Gamble Company|Consumer Defensive|Household & Personal Products
JNJ|JNJ.MX|Johnson & Johnson|Healthcare|Drug Manufacturers General
ABBV|ABBV.MX|AbbVie Inc.|Healthcare|Drug Manufacturers General
BAC|BAC.MX|Bank of America Corporation|Financial Services|Banks Diversified
KO|KO.MX|The Coca-Cola Company|Consumer Defensive|Beverages Non-Alcoholic
PLTR|PLTR.MX|Palantir Technologies Inc.|Technology|Software Application
PM|PM.MX|Philip Morris International Inc.|Consumer Defensive|Tobacco
CSCO|CSCO.MX|Cisco Systems, Inc.|Technology|Communication Equipment
IBM|IBM.MX|International Business Machines Corporation|Technology|Information Technology Services
CRM|CRM.MX|Salesforce, Inc.|Technology|Software Application
ORCL|ORCL.MX|Oracle Corporation|Technology|Software Infrastructure
CVX|CVX.MX|Chevron Corporation|Energy|Oil & Gas Integrated
MCD|MCD.MX|McDonald's Corporation|Consumer Cyclical|Restaurants
WFC|WFC.MX|Wells Fargo & Company|Financial Services|Banks Diversified
ABT|ABT.MX|Abbott Laboratories|Healthcare|Medical Devices
DIS|DIS.MX|The Walt Disney Company|Communication Services|Entertainment
AMD|AMD.MX|Advanced Micro Devices, Inc.|Technology|Semiconductors
MRK|MRK.MX|Merck & Co., Inc.|Healthcare|Drug Manufacturers General
TMO|TMO.MX|Thermo Fisher Scientific Inc.|Healthcare|Diagnostics & Research
ISRG|ISRG.MX|Intuitive Surgical, Inc.|Healthcare|Medical Instruments & Supplies
PEP|PEP.MX|PepsiCo, Inc.|Consumer Defensive|Beverages Non-Alcoholic
INTU|INTU.MX|Intuit Inc.|Technology|Software Application
GS|GS.MX|The Goldman Sachs Group, Inc.|Financial Services|Capital Markets
QCOM|QCOM.MX|QUALCOMM Incorporated|Technology|Semiconductors
VZ|VZ.MX|Verizon Communications Inc.|Communication Services|Telecom Services
BKNG|BKNG.MX|Booking Holdings Inc.|Consumer Cyclical|Travel Services
TXN|TXN.MX|Texas Instruments Incorporated|Technology|Semiconductors
AXP|AXP.MX|American Express Company|Financial Services|Credit Services
MS|MS.MX|Morgan Stanley|Financial Services|Capital Markets
SPGI|SPGI.MX|S&P Global Inc.|Financial Services|Financial Data & Stock Exchanges
AMGN|AMGN.MX|Amgen Inc.|Healthcare|Drug Manufacturers General
C|C.MX|Citigroup Inc.|Financial Services|Banks Diversified
PGR|PGR.MX|The Progressive Corporation|Financial Services|Insurance Property & Casualty
BSX|BSX.MX|Boston Scientific Corporation|Healthcare|Medical Devices
AMAT|AMAT.MX|Applied Materials, Inc.|Technology|Semiconductor Equipment & Materials
LOW|LOW.MX|Lowe's Companies, Inc.|Consumer Cyclical|Home Improvement Retail
HON|HON.MX|Honeywell International Inc.|Industrials|Conglomerates
UBER|UBER.MX|Uber Technologies, Inc.|Technology|Software Application
PFE|PFE.MX|Pfizer Inc.|Healthcare|Drug Manufacturers General
BLK|BLK.MX|BlackRock, Inc.|Financial Services|Asset Management
SYK|SYK.MX|Stryker Corporation|Healthcare|Medical Devices
TJX|TJX.MX|The TJX Companies, Inc.|Consumer Cyclical|Apparel Retail
DHR|DHR.MX|Danaher Corporation|Healthcare|Diagnostics & Research
SCHW|SCHW.MX|The Charles Schwab Corporation|Financial Services|Capital Markets
GILD|GILD.MX|Gilead Sciences, Inc.|Healthcare|Drug Manufacturers General
CMCSA|CMCSA.MX|Comcast Corporation|Communication Services|Telecom Services
PANW|PANW.MX|Palo Alto Networks, Inc.|Technology|Software Infrastructure
COP|COP.MX|ConocoPhillips|Energy|Oil & Gas E&P
ADI|ADI.MX|Analog Devices, Inc.|Technology|Semiconductors
MU|MU.MX|Micron Technology, Inc.|Technology|Semiconductors
BMY|BMY.MX|Bristol-Myers Squibb Company|Healthcare|Drug Manufacturers General
MO|MO.MX|Altria Group, Inc.|Consumer Defensive|Tobacco
NKE|NKE.MX|NIKE, Inc.|Consumer Cyclical|Footwear & Accessories
UPS|UPS.MX|United Parcel Service, Inc.|Industrials|Integrated Freight & Logistics
SO|SO.MX|The Southern Company|Utilities|Utilities Regulated Electric
ELV|ELV.MX|Elevance Health, Inc.|Healthcare|Healthcare Plans
KLAC|KLAC.MX|KLA Corporation|Technology|Semiconductor Equipment & Materials
ICE|ICE.MX|Intercontinental Exchange, Inc.|Financial Services|Financial Data & Stock Exchanges
ANET|ANET.MX|Arista Networks, Inc.|Technology|Computer Hardware
SBUX|SBUX.MX|Starbucks Corporation|Consumer Cyclical|Restaurants
MCO|MCO.MX|Moody's Corporation|Financial Services|Financial Data & Stock Exchanges
SHW|SHW.MX|The Sherwin-Williams Company|Basic Materials|Specialty Chemicals
CDNS|CDNS.MX|Cadence Design Systems, Inc.|Technology|Software Application
PH|PH.MX|Parker-Hannifin Corporation|Industrials|Specialty Industrial Machinery
APH|APH.MX|Amphenol Corporation|Technology|Electronic Components
CRWD|CRWD.MX|CrowdStrike Holdings, Inc.|Technology|Software Infrastructure
HCA|HCA.MX|HCA Healthcare, Inc.|Healthcare|Medical Care Facilities
CTAS|CTAS.MX|Cintas Corporation|Industrials|Specialty Business Services
MMM|MMM.MX|3M Company|Industrials|Conglomerates
SNPS|SNPS.MX|Synopsys, Inc.|Technology|Software Infrastructure
CL|CL.MX|Colgate-Palmolive Company|Consumer Defensive|Household & Personal Products
CME|CME.MX|CME Group Inc.|Financial Services|Financial Data & Stock Exchanges
DUK|DUK.MX|Duke Energy Corporation|Utilities|Utilities Regulated Electric
MSI|MSI.MX|Motorola Solutions, Inc.|Technology|Communication Equipment
CVS|CVS.MX|CVS Health Corporation|Healthcare|Healthcare Plans
MCK|MCK.MX|McKesson Corporation|Healthcare|Medical Distribution
USB|USB.MX|U.S. Bancorp|Financial Services|Banks Regional
MAR|MAR.MX|Marriott International, Inc.|Consumer Cyclical|Lodging
ECL|ECL.MX|Ecolab Inc.|Basic Materials|Specialty Chemicals
REGN|REGN.MX|Regeneron Pharmaceuticals, Inc.|Healthcare|Biotechnology
PNC|PNC.MX|The PNC Financial Services Group, Inc.|Financial Services|Banks Regional
ORLY|ORLY.MX|O'Reilly Automotive, Inc.|Consumer Cyclical|Auto Parts
CEG|CEG.MX|Constellation Energy Corporation|Utilities|Utilities Independent Power Producers
ETR|ETR.MX|Entergy Corporation|Utilities|Utilities Regulated Electric
HUBB|HUBB.MX|Hubbell Incorporated|Industrials|Electrical Equipment & Parts
ETN|ETN.MX|Eaton Corporation plc|Industrials|Specialty Industrial Machinery
GEV|GEV.MX|GE Vernova Inc.|Industrials|Electrical Equipment & Parts
NEE|NEE.MX|NextEra Energy, Inc.|Utilities|Utilities Regulated Electric
XEL|XEL.MX|Xcel Energy Inc.|Utilities|Utilities Regulated Electric
EXC|EXC.MX|Exelon Corporation|Utilities|Utilities Regulated Electric
WEC|WEC.MX|WEC Energy Group, Inc.|Utilities|Utilities Regulated Electric
ED|ED.MX|Consolidated Edison, Inc.|Utilities|Utilities Regulated Electric
FE|FE.MX|FirstEnergy Corp.|Utilities|Utilities Regulated Electric
NRG|NRG.MX|NRG Energy, Inc.|Utilities|Utilities Independent Power Producers
CMS|CMS.MX|CMS Energy Corporation|Utilities|Utilities Regulated Electric
AWK|AWK.MX|American Water Works Company, Inc.|Utilities|Utilities Regulated Water
DTE|DTE.MX|DTE Energy Company|Utilities|Utilities Regulated Electric
ATO|ATO.MX|Atmos Energy Corporation|Utilities|Utilities Regulated Gas
AES|AES.MX|The AES Corporation|Utilities|Utilities Diversified
AEE|AEE.MX|Ameren Corporation|Utilities|Utilities Regulated Electric
CNP|CNP.MX|CenterPoint Energy, Inc.|Utilities|Utilities Regulated Electric
EIX|EIX.MX|Edison International|Utilities|Utilities Regulated Electric
ES|ES.MX|Eversource Energy|Utilities|Utilities Regulated Electric
EVRG|EVRG.MX|Evergy, Inc.|Utilities|Utilities Regulated Electric
LNT|LNT.MX|Alliant Energy Corporation|Utilities|Utilities Regulated Electric
NI|NI.MX|NiSource Inc.|Utilities|Utilities Regulated Gas
OGE|OGE.MX|OGE Energy Corp.|Utilities|Utilities Regulated Electric
PNW|PNW.MX|Pinnacle West Capital Corporation|Utilities|Utilities Regulated Electric
POR|POR.MX|Portland General Electric Company|Utilities|Utilities Regulated Electric
PPL|PPL.MX|PPL Corporation|Utilities|Utilities Regulated Electric
WTRG|WTRG.MX|Essential Utilities, Inc.|Utilities|Utilities Regulated Water
ADM|ADM.MX|Archer-Daniels-Midland Company|Consumer Defensive|Farm Products
BF-B|BF-B.MX|Brown-Forman Corporation|Consumer Defensive|Beverages Wineries & Distilleries
CAG|CAG.MX|Conagra Brands, Inc.|Consumer Defensive|Packaged Foods
CHD|CHD.MX|Church & Dwight Co., Inc.|Consumer Defensive|Household & Personal Products
CLX|CLX.MX|The Clorox Company|Consumer Defensive|Household & Personal Products
CPB|CPB.MX|The Campbell's Company|Consumer Defensive|Packaged Foods
HRL|HRL.MX|Hormel Foods Corporation|Consumer Defensive|Packaged Foods
LW|LW.MX|Lamb Weston Holdings, Inc.|Consumer Defensive|Packaged Foods
MKC|MKC.MX|McCormick & Company, Incorporated|Consumer Defensive|Packaged Foods
SJM|SJM.MX|The J. M. Smucker Company|Consumer Defensive|Packaged Foods
TAP|TAP.MX|Molson Coors Beverage Company|Consumer Defensive|Beverages Brewers
TSN|TSN.MX|Tyson Foods, Inc.|Consumer Defensive|Farm Products
BAX|BAX.MX|Baxter International Inc.|Healthcare|Medical Instruments & Supplies
BDX|BDX.MX|Becton, Dickinson and Company|Healthcare|Medical Instruments & Supplies
CAH|CAH.MX|Cardinal Health, Inc.|Healthcare|Medical Distribution
COO|COO.MX|The Cooper Companies, Inc.|Healthcare|Medical Instruments & Supplies
DGX|DGX.MX|Quest Diagnostics Incorporated|Healthcare|Diagnostics & Research
DVA|DVA.MX|DaVita Inc.|Healthcare|Medical Care Facilities
HOLX|HOLX.MX|Hologic, Inc.|Healthcare|Medical Instruments & Supplies
HUM|HUM.MX|Humana Inc.|Healthcare|Healthcare Plans
TECH|TECH.MX|Bio-Techne Corporation|Healthcare|Biotechnology
VTRS|VTRS.MX|Viatris Inc.|Healthcare|Drug Manufacturers Specialty & Generic
CFG|CFG.MX|Citizens Financial Group, Inc.|Financial Services|Banks Regional
CINF|CINF.MX|Cincinnati Financial Corporation|Financial Services|Insurance Property & Casualty
CMA|CMA.MX|Comerica Incorporated|Financial Services|Banks Regional
FITB|FITB.MX|Fifth Third Bancorp|Financial Services|Banks Regional
HBAN|HBAN.MX|Huntington Bancshares Incorporated|Financial Services|Banks Regional
KEY|KEY.MX|KeyCorp|Financial Services|Banks Regional
MTB|MTB.MX|M&T Bank Corporation|Financial Services|Banks Regional
PRU|PRU.MX|Prudential Financial, Inc.|Financial Services|Insurance Life
RF|RF.MX|Regions Financial Corporation|Financial Services|Banks Regional
RJF|RJF.MX|Raymond James Financial, Inc.|Financial Services|Capital Markets
TFC|TFC.MX|Truist Financial Corporation|Financial Services|Banks Regional
AKAM|AKAM.MX|Akamai Technologies, Inc.|Technology|Software Infrastructure
FFIV|FFIV.MX|F5, Inc.|Technology|Software Infrastructure
GEN|GEN.MX|Gen Digital Inc.|Technology|Software Infrastructure
GLW|GLW.MX|Corning Incorporated|Technology|Electronic Components
JNPR|JNPR.MX|Juniper Networks, Inc.|Technology|Communication Equipment
NTAP|NTAP.MX|NetApp, Inc.|Technology|Computer Hardware
SWKS|SWKS.MX|Skyworks Solutions, Inc.|Technology|Semiconductors
TER|TER.MX|Teradyne, Inc.|Technology|Semiconductor Equipment & Materials
COF|COF.MX|Capital One Financial Corporation|Financial Services|Credit Services
AJG|AJG.MX|Arthur J. Gallagher & Co.|Financial Services|Insurance Brokers
CI|CI.MX|The Cigna Group|Healthcare|Healthcare Plans
WDAY|WDAY.MX|Workday, Inc.|Technology|Software Application
MDLZ|MDLZ.MX|Mondelez International, Inc.|Consumer Defensive|Confectioners
ZTS|ZTS.MX|Zoetis Inc.|Healthcare|Drug Manufacturers Specialty & Generic
FTNT|FTNT.MX|Fortinet, Inc.|Technology|Software Infrastructure
AZO|AZO.MX|AutoZone, Inc.|Consumer Cyclical|Auto Parts
CSX|CSX.MX|CSX Corporation|Industrials|Railroads
EOG|EOG.MX|EOG Resources, Inc.|Energy|Oil & Gas E&P
TRV|TRV.MX|The Travelers Companies, Inc.|Financial Services|Insurance Property & Casualty
CARR|CARR.MX|Carrier Global Corporation|Industrials|Building Products & Equipment
CPRT|CPRT.MX|Copart, Inc.|Industrials|Specialty Business Services
PYPL|PYPL.MX|PayPal Holdings, Inc.|Financial Services|Credit Services
AEP|AEP.MX|American Electric Power Company, Inc.|Utilities|Utilities Regulated Electric
FCX|FCX.MX|Freeport-McMoRan Inc.|Basic Materials|Copper
VST|VST.MX|Vistra Corp.|Utilities|Utilities Independent Power Producers
ADSK|ADSK.MX|Autodesk, Inc.|Technology|Software Application
HL|HL.MX|HECLA MINING CO|Basic Materials|Other Precious Metals & Mining
TGT|TGT.MX|Target Corporation|Consumer Defensive|Discount Stores
URI|URI.MX|United Rentals, Inc.|Industrials|Rental & Leasing Services
GM|GM.MX|General Motors Company|Consumer Cyclical|Auto Manufacturers
KMB|KMB.MX|Kimberly-Clark Corporation|Consumer Defensive|Household & Personal Products
MNST|MNST.MX|Monster Beverage Corporation|Consumer Defensive|Beverages Non-Alcoholic
MPC|MPC.MX|Marathon Petroleum Corporation|Energy|Oil & Gas Refining & Marketing
ALL|ALL.MX|Allstate Corporation|Financial Services|Insurance Property & Casualty
OKE|OKE.MX|ONEOK INC|Energy|Oil & Gas Midstream
RCL|RCL.MX|Royal Caribbean Cruises Ltd.|Consumer Cyclical|Travel Services
HLT|HLT.MX|Hilton Worldwide Holdings Inc.|Consumer Cyclical|Lodging
GWW|GWW.MX|W.W. Grainger, Inc.|Industrials|Industrial Distribution
FDX|FDX.MX|FedEx Corporation|Industrials|Integrated Freight & Logistics
MET|MET.MX|MetLife, Inc.|Financial Services|Insurance Life
SRE|SRE.MX|Sempra|Utilities|Utilities Diversified
AMP|AMP.MX|Ameriprise Financial, Inc.|Financial Services|Asset Management
NDAQ|NDAQ.MX|Nasdaq, Inc.|Financial Services|Financial Data & Stock Exchanges
AFL|AFL.MX|Aflac Incorporated|Financial Services|Insurance Life
PSX|PSX.MX|Phillips 66|Energy|Oil & Gas Refining & Marketing
AIG|AIG.MX|American International Group, Inc.|Financial Services|Insurance Diversified
ROST|ROST.MX|Ross Stores, Inc.|Consumer Cyclical|Apparel Retail
ODFL|ODFL.MX|Old Dominion Freight Line, Inc.|Industrials|Trucking
KR|KR.MX|The Kroger Co.|Consumer Defensive|Grocery Stores
VLO|VLO.MX|Valero Energy Corporation|Energy|Oil & Gas Refining & Marketing
D|D.MX|Dominion Energy, Inc.|Utilities|Utilities Regulated Electric
MSCI|MSCI.MX|MSCI Inc.|Financial Services|Financial Data & Stock Exchanges
FANG|FANG.MX|Diamondback Energy, Inc.|Energy|Oil & Gas E&P
KDP|KDP.MX|Keurig Dr Pepper Inc.|Consumer Defensive|Beverages Non-Alcoholic
KMI|KMI.MX|Kinder Morgan, Inc.|Energy|Oil & Gas Midstream
CTVA|CTVA.MX|Corteva, Inc.|Basic Materials|Agricultural Inputs
CMI|CMI.MX|Cummins Inc.|Industrials|Specialty Industrial Machinery
PEG|PEG.MX|PUBLIC SERVICE ENTERPRISE GROUP|Utilities|Utilities Regulated Electric
GEHC|GEHC.MX|GE HealthCare Technologies Inc.|Healthcare|Medical Devices
KHC|KHC.MX|The Kraft Heinz Company|Consumer Defensive|Packaged Foods
KVUE|KVUE.MX|KENVUE INC|Consumer Defensive|Household & Personal Products
COR|COR.MX|Cencora, Inc.|Healthcare|Medical Distribution
VRSK|VRSK.MX|Verisk Analytics, Inc.|Industrials|Consulting Services
FIS|FIS.MX|Fidelity National Information Services, Inc.|Technology|Information Technology Services
STZ|STZ.MX|Constellation Brands, Inc.|Consumer Defensive|Beverages Brewers
EA|EA.MX|Electronic Arts Inc.|Communication Services|Electronic Gaming & Multimedia
PCG|PCG.MX|PG&E Corporation|Utilities|Utilities Regulated Electric
MLM|MLM.MX|Martin Marietta Materials, Inc.|Basic Materials|Building Materials
A|A.MX|Agilent Technologies, Inc.|Healthcare|Diagnostics & Research
STT|STT.MX|State Street Corporation|Financial Services|Asset Management
HIG|HIG.MX|THE HARTFORD INSURANCE GROUP IN|Financial Services|Insurance Diversified
MPWR|MPWR.MX|Monolithic Power Systems, Inc.|Technology|Semiconductors
CHTR|CHTR.MX|Charter Communications, Inc.|Communication Services|Telecom Services
DAL|DAL.MX|Delta Air Lines, Inc.|Industrials|Airlines
IQV|IQV.MX|IQVIA Holdings Inc.|Healthcare|Diagnostics & Research
YUM|YUM.MX|Yum! Brands, Inc.|Consumer Cyclical|Restaurants
GIS|GIS.MX|General Mills, Inc.|Consumer Defensive|Packaged Foods
HSY|HSY.MX|The Hershey Company|Consumer Defensive|Confectioners
DD|DD.MX|DuPont de Nemours, Inc.|Basic Materials|Specialty Chemicals
EFX|EFX.MX|Equifax Inc.|Industrials|Consulting Services
HPQ|HPQ.MX|HP Inc.|Technology|Computer Hardware
NUE|NUE.MX|Nucor Corporation|Basic Materials|Steel
CNC|CNC.MX|Centene Corporation|Healthcare|Healthcare Plans
IDXX|IDXX.MX|IDEXX Laboratories, Inc.|Healthcare|Diagnostics & Research
MCHP|MCHP.MX|Microchip Technology Incorporated|Technology|Semiconductors
XYL|XYL.MX|Xylem Inc.|Industrials|Specialty Industrial Machinery
OTIS|OTIS.MX|Otis Worldwide Corporation|Industrials|Specialty Industrial Machinery
EBAY|EBAY.MX|eBay Inc.|Consumer Cyclical|Internet Retail
WAB|WAB.MX|Westinghouse Air Brake Technologies Corporation|Industrials|Railroads
HPE|HPE.MX|Hewlett Packard Enterprise Company|Technology|Communication Equipment
BR|BR.MX|Broadridge Financial Solutions Inc.|Technology|Information Technology Services
GDDY|GDDY.MX|GoDaddy Inc.|Technology|Software Infrastructure
DXCM|DXCM.MX|DexCom, Inc.|Healthcare|Medical Devices
SLB|SLB.MX|SLB (Schlumberger)|Energy|Oil & Gas Equipment & Services
MRO|MRO.MX|Marathon Oil Corporation|Energy|Oil & Gas E&P
DVN|DVN.MX|Devon Energy Corporation|Energy|Oil & Gas E&P
HAL|HAL.MX|Halliburton Company|Energy|Oil & Gas Equipment & Services
ITW|ITW.MX|Illinois Tool Works Inc.|Industrials|Specialty Industrial Machinery
EMR|EMR.MX|Emerson Electric Co.|Industrials|Specialty Industrial Machinery
ROK|ROK.MX|Rockwell Automation Inc.|Industrials|Specialty Industrial Machinery
PNR|PNR.MX|Pentair plc|Industrials|Specialty Industrial Machinery
AME|AME.MX|AMETEK Inc.|Industrials|Specialty Industrial Machinery
SYY|SYY.MX|Sysco Corporation|Consumer Defensive|Food Distribution
K|K.MX|Kellanova|Consumer Defensive|Packaged Foods
GPC|GPC.MX|Genuine Parts Company|Consumer Defensive|Specialty Retail
MDT|MDT.MX|Medtronic plc|Healthcare|Medical Devices
DFS|DFS.MX|Discover Financial Services|Financial Services|Credit Services
SYF|SYF.MX|Synchrony Financial|Financial Services|Credit Services
ALLY|ALLY.MX|Ally Financial Inc.|Financial Services|Credit Services
ZION|ZION.MX|Zions Bancorporation|Financial Services|Banks Regional
NTRS|NTRS.MX|Northern Trust Corporation|Financial Services|Asset Management
FNF|FNF.MX|Fidelity National Financial Inc.|Financial Services|Insurance Specialty
WRB|WRB.MX|W.R. Berkley Corporation|Financial Services|Insurance Property & Casualty
CB|CB.MX|Chubb Limited|Financial Services|Insurance Property & Casualty
APD|APD.MX|Air Products and Chemicals Inc.|Basic Materials|Specialty Chemicals
LIN|LIN.MX|Linde plc|Basic Materials|Specialty Chemicals
NEM|NEM.MX|Newmont Corporation|Basic Materials|Gold
STLD|STLD.MX|Steel Dynamics Inc.|Basic Materials|Steel
CLF|CLF.MX|Cleveland-Cliffs Inc.|Basic Materials|Steel
X|X.MX|United States Steel Corporation|Basic Materials|Steel
AA|AA.MX|Alcoa Corporation|Basic Materials|Aluminum
ALB|ALB.MX|Albemarle Corporation|Basic Materials|Specialty Chemicals
CF|CF.MX|CF Industries Holdings Inc.|Basic Materials|Agricultural Inputs
MOS|MOS.MX|The Mosaic Company|Basic Materials|Agricultural Inputs
TSM|TSM.MX|Taiwan Semiconductor Manufacturing Company Limited|Technology|Semiconductors
ASML|ASML.MX|ASML Holding N.V.|Technology|Semiconductor Equipment & Materials
LRCX|LRCX.MX|Lam Research Corporation|Technology|Semiconductor Equipment & Materials
ON|ON.MX|ON Semiconductor Corporation|Technology|Semiconductors
NXPI|NXPI.MX|NXP Semiconductors N.V.|Technology|Semiconductors
VRT|VRT.MX|Vertiv Holdings Co|Industrials|Electrical Equipment & Parts
SMCI|SMCI.MX|Super Micro Computer Inc.|Technology|Computer Hardware
DELL|DELL.MX|Dell Technologies Inc.|Technology|Computer Hardware
WDC|WDC.MX|Western Digital Corporation|Technology|Data Storage
STX|STX.MX|Seagate Technology Holdings plc|Technology|Data Storage
FSLR|FSLR.MX|First Solar Inc.|Technology|Solar
ENPH|ENPH.MX|Enphase Energy Inc.|Technology|Solar
POWL|POWL.MX|Powell Industries Inc.|Industrials|Electrical Equipment & Parts
GNRC|GNRC.MX|Generac Holdings Inc.|Industrials|Electrical Equipment & Parts
WM|WM.MX|Waste Management Inc.|Industrials|Waste Management
RSG|RSG.MX|Republic Services Inc.|Industrials|Waste Management
AOS|AOS.MX|A. O. Smith Corporation|Industrials|Specialty Industrial Machinery
BG|BG.MX|Bunge Global SA|Consumer Defensive|Farm Products
INGR|INGR.MX|Ingredion Incorporated|Consumer Defensive|Packaged Foods
CALM|CALM.MX|Cal-Maine Foods Inc.|Consumer Defensive|Farm Products
RMD|RMD.MX|ResMed Inc.|Healthcare|Medical Instruments & Supplies
VRTX|VRTX.MX|Vertex Pharmaceuticals Incorporated|Healthcare|Biotechnology
BIIB|BIIB.MX|Biogen Inc.|Healthcare|Biotechnology
`.trim();function de(e){return e.split(`
`).map(a=>{const[i,n,t,r,o]=a.split("|");return{rawTicker:i,ticker:i,yahooSymbol:n,companyName:t,sector:r||"Sin sector",industry:o||"Sin industria",quoteType:"EQUITY",market:"BMV SIC",source:"Yahoo Finance Search",sourceDate:b,validationStatus:"validated_yahoo_mx"}})}function pe(e){const a=new Map;for(const i of e){const n=i.ticker.toUpperCase();a.has(n)||a.set(n,i)}return[...a.values()]}const B=de(ue),U=pe([...F.map(e=>({...e,sector:e.sector||"Solicitados",industry:e.industry||e.quoteType,source:"User requested batch + Yahoo Finance Search",sourceDate:b,priority:"requested"})),...B]),me={sourceDate:b,requestedCount:F.length,bmvSicCount:B.length,totalCount:U.length,sources:["Yahoo Finance Search","Grupo BMV Mercado Global/SIC"]},G={nearPePb:28,nearPe:22,nearPb:2.3,nearDebtRatio:1.2,nearCurrentRatio:1.8,grahamDistancePct:.15};function ye(e){const a=["manual-candidate"];return e.pePb<=22.5&&e.pe<=20&&e.pb<=2&&a.push("graham-watch"),e.sector&&a.push(String(e.sector).split("/")[0].trim().toLowerCase().replace(/\s+/g,"-")),a}const L=te.map(e=>({...e,analysisStatus:"analyzed",yahooSymbol:e.yahooSymbol||e.ticker,market:e.market||"US",watchReason:e.note,tags:ye(e)})),Me=new Map(L.map(e=>[e.ticker.toUpperCase(),e]));function Se(e){return{...e,yahooSymbol:e.yahooSymbol||e.yahoo_symbol||e.ticker,companyName:e.companyName||e.company_name||e.name||e.ticker,quoteType:e.quoteType||e.quote_type||"EQUITY",analysisStatus:e.analysisStatus||e.analysis_status||"pending_fundamentals",validationStatus:e.validationStatus||e.validation_status||"needs_manual_review",sourceDate:e.sourceDate||e.source_date,notes:e.notes||e.note||""}}async function Be(e=fetch,a="/"){try{const i=await e(`${a.replace(/\/?$/,"/")}data/companies.json`);if(!i.ok)throw new Error(`No se pudo cargar companies.json: ${i.status}`);const n=await i.json();return Array.isArray(n)?n.map(Se):[]}catch{return[]}}function Ce(e){const a=new Map;for(const i of e)for(const n of i){const t=n.ticker.toUpperCase();a.set(t,{...a.get(t)||{},...n})}return[...a.values()]}function he(e=[]){const a=Ce([U,e]),i=a.map(r=>{var l,s,c,m,p;const o=Me.get(r.ticker.toUpperCase());return o?{...r,...o,yahooSymbol:o.yahooSymbol||o.ticker,market:o.market||"US",validationStatus:r.validationStatus||"manual_snapshot"}:r.analysisStatus==="analyzed"?{...r,yahooSymbol:r.yahooSymbol||r.ticker,market:r.market||"US",watchReason:r.watchReason||r.notes||"Analisis Graham automatico desde export publico.",tags:(l=r.tags)!=null&&l.length?r.tags:["sec-auto-analysis"]}:String(r.analysisStatus||"").startsWith("analysis_")?{...r,yahooSymbol:r.yahooSymbol||r.ticker,watchReason:r.watchReason||r.notes||"No se pudo completar el analisis automatico.",tags:(s=r.tags)!=null&&s.length?r.tags:["analysis-review"]}:r.analysisStatus==="index_reference"||r.analysisStatus==="market_reference"||r.validationStatus==="index_reference"||r.validationStatus==="market_reference"||(c=r.tags)!=null&&c.includes("index_reference")||(m=r.tags)!=null&&m.includes("market_reference")||["INDEX","ETF","FUTURE"].includes(String(r.quoteType||"").toUpperCase())?{...r,yahooSymbol:r.yahooSymbol||r.ticker,watchReason:r.watchReason||r.notes||"Referencia de mercado. No requiere analisis Graham.",tags:(p=r.tags)!=null&&p.length?r.tags:["market_reference"]}:{...r,analysisStatus:"pending_fundamentals",watchReason:"Pendiente de primer analisis Graham: requiere fundamentales de Yahoo Finance o captura manual validada.",tags:[r.priority==="requested"?"requested":"bmv-sic","pending-analysis"]}}),n=new Set(a.map(r=>r.ticker.toUpperCase())),t=L.filter(r=>!n.has(r.ticker.toUpperCase()));return[...i,...t]}function ge(e,a=[]){return{...me,publicExportCount:a.length,analyzedCount:e.filter(i=>i.analysisStatus==="analyzed").length,referenceCount:e.filter(i=>i.analysisStatus==="index_reference"||i.validationStatus==="index_reference").length,pendingCount:e.filter(i=>i.analysisStatus!=="analyzed"&&i.analysisStatus!=="index_reference").length,totalCount:e.length}}function Ie(e){return Array.isArray(e)?e.map(a=>String(a).trim()).filter(Boolean):String(e||"").split(",").map(a=>a.trim()).filter(Boolean)}function Ue(e){const a=new Set;for(const i of e)for(const n of Ie(i.tags))a.add(n);return[...a].sort((i,n)=>i.localeCompare(n))}function Ge(e){const a=new Set;for(const i of e){const n=String(i.sector||"").trim();n&&a.add(n)}return[...a].sort((i,n)=>i.localeCompare(n))}const H=[],fe=he(H);ge(fe,H);const Te=["pe","pb","debtRatio","currentRatio","fcf"];function _(e){return Z(re({sector:e.sector,industry:e.industry,sicCode:e.sicCode}))}function w(e){const a=new Set(_(e).omit||[]);return a.has("current")&&a.has("debt")}function M(e){return e!=null&&e!==""&&Number.isFinite(Number(e))}function ve(e,a=e.price){if(!Ee(e))return null;const i=e.price/e.pe,n=e.hasNegativeEquity===!0,t=n?null:e.pb?e.price/e.pb:null,r=a/i,o=t!==null&&t>0?a/t:null,l=r!==null&&o!==null?r*o:null,s=Q(i,t),c=i*20,m=t!==null&&t>0?t*2:null,p=z({grahamFormula:s,pricePe20:c,pricePb2:m});return{pe:r,pb:o,pePb:l,hasNegativeEquity:n||null,debtRatio:e.debtRatio,currentRatio:e.currentRatio,quickRatio:e.quickRatio,fcf:e.fcf,epsAllPositive:e.epsAllPositive,epsGrowing:e.epsGrowing??null,roe:e.roe??null,roa:e.roa??null,tie:e.tie??null,epsAdj:i,bvps:t,price:a,grahamFormula:s,pricePe20:c,pricePb2:m,maxDefensivePrice:p,distanceToDefensive:p>0?(a-p)/p:null,marginOfSafety:j(s,a)}}function Ee(e){return e.hasNegativeEquity?M(e.price)&&M(e.pe)&&M(e.currentRatio):[e.price,e.pe,e.pb].every(M)?w(e)?!0:M(e.debtRatio)&&M(e.currentRatio):!1}function be(e){return e.hasNegativeEquity?["pe","currentRatio","fcf"].filter(a=>M(e[a])).length:Te.filter(a=>M(e[a])).length}function Xe(e,a=null,i=G){const n=(a==null?void 0:a.price)??e.lastPrice??e.price;if(Ae(e))return h({...e,quote:a,livePrice:n??null,ratios:null,classification:{id:"index_reference",label:"REFERENCIA",color:"#38bdf8",reason:e.notes||"Instrumento de referencia para comparar mercado; no se analiza con reglas Graham defensivas."},alertLevel:"reference",alertLabel:"Referencia de mercado",closeToDefensive:!1,near:!1});const t=be(e),r=w(e)?2:3;if(t<r)return e.validationStatus==="yahoo_model_rejected"?h({...e,quote:a,livePrice:(a==null?void 0:a.price)??e.price??null,ratios:null,classification:{id:e.classificationId||"rejected",label:e.classificationLabel||"RECHAZADA",color:"#ef4444",reason:e.notes||"Rechazada por modelo Graham defensivo con datos parciales no comparables."},alertLevel:"watch",alertLabel:e.classificationLabel||"Rechazada por modelo",closeToDefensive:!1,near:!1}):h({...e,analysisStatus:"analysis_incomplete",quote:a,livePrice:(a==null?void 0:a.price)??e.price??null,ratios:null,classification:{id:"analysis_incomplete",label:"DATOS INSUFICIENTES",color:"#94a3b8",reason:"Faltan al menos 3 de 5 ratios criticos para evaluar con Graham."},alertLevel:"pending",alertLabel:"Datos insuficientes",closeToDefensive:!1,near:!1});const o=ve(e,n);if(!o)return e.analysisStatus==="analyzed"?h({...e,quote:a,livePrice:(a==null?void 0:a.price)??e.price??null,ratios:null,classification:{id:e.classificationId||"rejected",label:e.classificationLabel||"RECHAZADA",color:"#ef4444",reason:e.notes||"Analizada, pero con datos insuficientes para aprobar reglas Graham."},alertLevel:"watch",alertLabel:e.classificationLabel||"Analizada sin aprobacion Graham",closeToDefensive:!1,near:!1}):String(e.analysisStatus||"").startsWith("analysis_")?h({...e,quote:a,livePrice:(a==null?void 0:a.price)??e.price??null,ratios:null,classification:{id:e.analysisStatus,label:"NO SOPORTADA",color:"#94a3b8",reason:e.notes||"No se pudo completar el analisis automatico."},alertLevel:"pending",alertLabel:e.notes||"No soportada por analisis automatico",closeToDefensive:!1,near:!1}):h({...e,quote:a,livePrice:(a==null?void 0:a.price)??null,ratios:null,classification:{id:"pending_fundamentals",label:"PENDIENTE DE ANALISIS",color:"#94a3b8",reason:"Faltan fundamentales para calcular ratios Graham."},alertLevel:"pending",alertLabel:a!=null&&a.price?"Precio disponible, faltan fundamentales":"Pendiente de primer analisis",closeToDefensive:!1,near:!1});const l=_(e),s=ee(o,l),c=new Set(l.omit||[]),m=l.useTangibleBook?o.pbTangible:o.pb,p=l.useTangibleBook?o.pePbTangible:o.pePb,S=(x,q,V)=>x||M(q)&&V,X=o.hasNegativeEquity?!1:S(c.has("pePb"),p,p<=i.nearPePb)&&S(c.has("pe"),o.pe,o.pe<=i.nearPe)&&S(c.has("pb"),m,m<=i.nearPb)&&S(c.has("debt"),o.debtRatio,o.debtRatio<i.nearDebtRatio)&&S(c.has("current"),o.currentRatio,o.currentRatio>=i.nearCurrentRatio)&&o.epsAllPositive===!0,A=!o.hasNegativeEquity&&o.distanceToDefensive!==null&&o.distanceToDefensive<=i.grahamDistancePct;let f="watch",E="En observacion";s.id==="graham_approved"?(f="approved",E="Aprobada Graham"):(X||A)&&(f="near",E="Cerca de aprobar");const O=f==="approved"?s.reason:ce(o,l);return h({...e,quote:a,livePrice:n,ratios:o,classification:s,sectorProfileId:l.id,alertLevel:f,alertLabel:E,watchReason:O,closeToDefensive:A,near:X})}function Le(e,a={},i=G){return e.map(n=>Xe(n,a[n.ticker]??null,i)).sort((n,t)=>{const r={approved:0,near:1,watch:2,reference:3,pending:4};return r[n.alertLevel]!==r[t.alertLevel]?r[n.alertLevel]-r[t.alertLevel]:!n.ratios||!t.ratios?n.ticker.localeCompare(t.ticker):n.ratios.pePb-t.ratios.pePb})}function He(e){return{approved:e.filter(a=>a.alertLevel==="approved"),near:e.filter(a=>a.alertLevel==="near"),watch:e.filter(a=>a.alertLevel==="watch"),reference:e.filter(a=>a.alertLevel==="reference"),pending:e.filter(a=>a.alertLevel==="pending")}}function Ae(e){var a,i;return e.analysisStatus==="index_reference"||e.analysisStatus==="market_reference"||e.validationStatus==="index_reference"||e.validationStatus==="market_reference"||((a=e.tags)==null?void 0:a.includes("index_reference"))||((i=e.tags)==null?void 0:i.includes("market_reference"))||["INDEX","ETF","FUTURE"].includes(String(e.quoteType||"").toUpperCase())}function h(e){return{...e,systemStatus:le(e)}}export{I as D,Ne as M,Z as a,Le as b,ee as c,re as d,he as e,He as f,Q as g,Be as h,ge as i,Ue as j,Ge as k,Fe as l,Ie as n,De as p,Re as s};
