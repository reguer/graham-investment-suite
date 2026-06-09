import{A as S,j as m,a as D,b,S as I}from"./index-r8Huy1j6.js";import{D as k}from"./Dot-XwcOkMRW.js";function N(e){return e.roe>.1&&e.roa>.05&&e.tie>5&&e.quickRatio>=1&&e.fcf>0}function g(e){return e!=null&&e!==""&&Number.isFinite(Number(e))}function F(e){if([e.pePb,e.debtRatio,e.currentRatio,e.pe,e.pb].every(g)&&e.pePb<=22.5&&e.debtRatio<1&&e.currentRatio>=2&&e.epsAllPositive===!0&&e.pe<=20&&e.pb<=2)return{id:"graham_approved",label:"APROBADA GRAHAMIANA",color:S.green,reason:"Cumple valuación defensiva, liquidez, deuda controlada y EPS positivo."};const i=g(e.pePb)&&N(e)&&e.pePb>22.5&&e.epsAllPositive===!0;return i&&e.epsGrowing===!0?{id:"excellent_expensive",label:"EXCELENTE, PERO CARA",color:S.yellow,reason:"Empresa fuerte, pero cotiza fuera del rango Graham defensivo."}:i&&e.epsGrowing===!1?{id:"good_overvalued",label:"BUENA EMPRESA, SOBREVALORADA",color:S.orange,reason:"La calidad financiera existe, pero el crecimiento de EPS no es consistente y la valuación excede 22.5."}:{id:"rejected",label:"RECHAZADA",color:S.red,reason:"No cumple los criterios mínimos defensivos de Graham."}}function G(e){var a;return((a=Object.entries(S).find(([,i])=>i===e))==null?void 0:a[0])||"gray"}function ne({label:e,value:a,sublabel:i,ref:n,color:o=S.gray}){const r=G(o);return m.jsxs("article",{style:{background:b[r],border:`1px solid ${D[r]}`,borderRadius:8,padding:14,minHeight:126},children:[m.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,color:I.muted,fontSize:12},children:[m.jsx(k,{color:o}),m.jsx("span",{children:e})]}),m.jsx("div",{style:{marginTop:10,fontFamily:"IBM Plex Mono, monospace",color:I.text,fontSize:26,fontWeight:600,wordBreak:"break-word"},children:a}),i?m.jsx("div",{style:{marginTop:8,color:I.muted,fontSize:12},children:i}):null,n?m.jsx("div",{style:{marginTop:6,color:"#7dd3fc",fontSize:11},children:n}):null]})}const u={graham_approved:{id:"graham_approved",label:"Aprobada Graham",group:"opportunity",rank:0,color:"#22c55e"},near_defensive:{id:"near_defensive",label:"Cerca de rango defensivo",group:"opportunity",rank:1,color:"#eab308"},excellent_expensive:{id:"excellent_expensive",label:"Excelente, pero cara",group:"watch",rank:2,color:"#eab308"},good_overvalued:{id:"good_overvalued",label:"Buena empresa, sobrevalorada",group:"watch",rank:3,color:"#f97316"},rejected_model:{id:"rejected_model",label:"Rechazada por modelo",group:"discarded",rank:4,color:"#ef4444"},watch_observation:{id:"watch_observation",label:"En observacion",group:"watch",rank:5,color:"#64748b"},pending_fundamentals:{id:"pending_fundamentals",label:"Pendiente de fundamentales",group:"pending",rank:6,color:"#38bdf8"},manual_review:{id:"manual_review",label:"Revision manual",group:"pending",rank:7,color:"#a78bfa"},unsupported_analysis:{id:"unsupported_analysis",label:"No soportada",group:"pending",rank:8,color:"#94a3b8"},index_reference:{id:"index_reference",label:"Referencia de mercado",group:"reference",rank:9,color:"#38bdf8"}};function U(e){var a,i,n,o,r;return e.alertLevel==="reference"||e.analysisStatus==="index_reference"||e.analysisStatus==="market_reference"||e.validationStatus==="index_reference"||e.validationStatus==="market_reference"||["INDEX","ETF","FUTURE"].includes(String(e.quoteType||"").toUpperCase())?u.index_reference:e.alertLevel==="approved"||((a=e.classification)==null?void 0:a.id)==="graham_approved"?u.graham_approved:e.alertLevel==="near"?u.near_defensive:((i=e.classification)==null?void 0:i.id)==="excellent_expensive"?u.excellent_expensive:((n=e.classification)==null?void 0:n.id)==="good_overvalued"?u.good_overvalued:((o=e.classification)==null?void 0:o.id)==="rejected"||((r=e.classification)==null?void 0:r.label)==="RECHAZADA"||e.validationStatus==="yahoo_model_rejected"?u.rejected_model:e.validationStatus==="needs_manual_review"||e.validationStatus==="yahoo_partial_incomplete"||e.validationStatus==="source_required"||e.analysisStatus==="analysis_external_pending"?u.manual_review:String(e.analysisStatus||"").startsWith("analysis_")?u.unsupported_analysis:e.analysisStatus==="pending_fundamentals"||e.alertLevel==="pending"?u.pending_fundamentals:u.watch_observation}function oe(){return Object.values(u).sort((e,a)=>e.rank-a.rank)}const v="2026-06-09",s="Yahoo Finance quoteSummary/key-statistics",c=v,B=[{ticker:"PHM",companyName:"PulteGroup",sector:"Residential Construction",price:117.77,pe:11.39,pb:1.75,pePb:19.89,debtRatio:.4,currentRatio:6.24,quickRatio:.94,fcf:1831.38,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Constructor grande con valuacion dentro del limite 22.5 y liquidez alta; quick ratio bajo por inventario de vivienda, normal en el sector pero relevante para Graham."},{ticker:"LEN",companyName:"Lennar",sector:"Residential Construction",price:90.9,pe:13.06,pb:1.02,pePb:13.27,debtRatio:.51,currentRatio:8.32,quickRatio:4.51,fcf:365.79,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Perfil Graham limpio: P/B cercano a 1, deuda moderada y liquidez muy amplia. Riesgo principal: concentracion ciclica en vivienda."},{ticker:"TOL",companyName:"Toll Brothers",sector:"Residential Construction",price:139.53,pe:10.55,pb:1.54,pePb:16.25,debtRatio:.71,currentRatio:3.09,quickRatio:.45,fcf:1332.53,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Valuacion atractiva y FCF positivo; quick ratio bajo porque el balance depende de inventarios/lotes. Requiere cuidado con ciclo inmobiliario."},{ticker:"TMHC",companyName:"Taylor Morrison Home",sector:"Residential Construction",price:71.5,pe:10.67,pb:1.08,pePb:11.54,debtRatio:.56,currentRatio:7.51,quickRatio:1.45,fcf:601.88,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Muy barata por P/E x P/B y con liquidez robusta. Mejor balance de liquidez que varias constructoras por quick ratio sobre 1."},{ticker:"MTH",companyName:"Meritage Homes",sector:"Residential Construction",price:68.12,pe:12.5,pb:.89,pePb:11.15,debtRatio:.48,currentRatio:10.96,quickRatio:1.6,fcf:208.15,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Cotiza bajo book value y conserva liquidez fuerte. Buen candidato Graham, aunque dependiente del ciclo de tasas/vivienda."},{ticker:"MHO",companyName:"M/I Homes",sector:"Residential Construction",price:138.43,pe:10.42,pb:1.11,pePb:11.57,debtRatio:.5,currentRatio:7.64,quickRatio:1.78,fcf:156.5,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Pasa con mucho margen la regla 22.5 y mantiene liquidez alta. Empresa mas pequena: revisar volumen, geografias y sensibilidad al inventario."},{ticker:"KBH",companyName:"KB Home",sector:"Residential Construction",price:51.45,pe:9.93,pb:.84,pePb:8.3,debtRatio:.74,currentRatio:2.2,quickRatio:.2,fcf:475.53,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"La mas barata del grupo por P/E x P/B, pero quick ratio muy bajo por inventario. Aprobada por Graham defensivo, con riesgo operativo de ciclo e inventario."},{ticker:"GRBK",companyName:"Green Brick Partners",sector:"Residential Construction",price:69.02,pe:10.16,pb:1.5,pePb:15.26,debtRatio:.27,currentRatio:8.45,quickRatio:.83,fcf:164.48,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Deuda muy baja y current ratio amplio. Quick ratio bajo por inventario; aun asi pasa la regla Graham por margen razonable."},{ticker:"CEG",companyName:"Constellation Energy",sector:"Utilities / Nuclear AI Infrastructure",price:251.65,pe:21.86,pb:2.72,pePb:59.54,debtRatio:.66,currentRatio:1.36,quickRatio:.48,fcf:-4478.88,epsAllPositive:!1,source:s,sourceDate:c,note:"Utility nuclear con exposicion directa a demanda electrica de data centers. Calidad estrategica alta, pero Graham exige cautela por P/B elevado y FCF negativo."},{ticker:"VST",companyName:"Vistra",sector:"Utilities / Power Generation",price:146.22,pe:24.45,pb:18.86,pePb:461.15,debtRatio:3.55,currentRatio:.9,quickRatio:.26,fcf:476.88,epsAllPositive:!1,source:s,sourceDate:c,note:"Generacion electrica ligada a demanda de energia para AI. Sigue en radar, pero no es compra Graham defensiva por deuda, liquidez y P/B muy altos."},{ticker:"ETR",companyName:"Entergy",sector:"Utilities / Regulated Electric",price:109.66,pe:27.97,pb:2.89,pePb:80.96,debtRatio:1.93,currentRatio:.96,quickRatio:.61,fcf:-3913.1,epsAllPositive:null,source:s,sourceDate:c,note:"Utility regulada con exposicion al sur de EE.UU. y carga electrica industrial. La tesis es infraestructura, no aprobacion Graham: FCF negativo y deuda alta."},{ticker:"HUBB",companyName:"Hubbell",sector:"Industrials / Electrical Equipment",price:486.47,pe:28.73,pb:6.82,pePb:196,debtRatio:.72,currentRatio:1.58,quickRatio:.84,fcf:541.45,epsAllPositive:null,source:s,sourceDate:c,note:"Infraestructura electrica para redes, electrificacion y data centers. Empresa de calidad, aunque fuera del rango defensivo Graham por valuacion."},{ticker:"INGR",companyName:"Ingredion",sector:"Consumer Defensive / Packaged Foods",price:101.64,pe:9.77,pb:1.46,pePb:14.28,debtRatio:.41,currentRatio:2.76,quickRatio:1.78,fcf:357.75,epsAllPositive:!0,source:s,sourceDate:c,note:"Defensiva de ingredientes y alimentos con P/E bajo, P/B razonable, deuda controlada y liquidez superior a 2. Es la candidata Graham mas limpia del grupo."},{ticker:"PFE",companyName:"Pfizer",sector:"Healthcare / Pharmaceuticals",price:25.7,pe:19.62,pb:1.63,pePb:31.89,debtRatio:.72,currentRatio:1.25,quickRatio:.85,fcf:12376.63,epsAllPositive:!0,source:s,sourceDate:c,note:"Farmaceutica grande con FCF positivo y P/E bajo 20. No pasa Graham estricta por liquidez menor a 2 y P/E x P/B sobre 22.5."},{ticker:"GIS",companyName:"General Mills",sector:"Consumer Defensive / Packaged Foods",price:33.72,pe:8.24,pb:3.26,pePb:26.85,debtRatio:2.18,currentRatio:.56,quickRatio:.3,fcf:2263.38,epsAllPositive:!0,source:s,sourceDate:c,note:"Consumo defensivo con P/E bajo y FCF positivo. Se mantiene en observacion por deuda alta, liquidez baja y P/B mayor al limite defensivo."},{ticker:"REGN",companyName:"Regeneron Pharmaceuticals",sector:"Healthcare / Biotechnology",price:616.18,pe:15.04,pb:2,pePb:30.06,debtRatio:.09,currentRatio:3.57,quickRatio:2.84,fcf:3273.35,epsAllPositive:!0,source:s,sourceDate:c,note:"Salud rentable con balance muy fuerte, liquidez amplia y FCF positivo. Queda cerca, pero P/E x P/B supera el umbral 22.5."},{ticker:"BAC",companyName:"Bank of America",sector:"Financial Services / Banks",price:54.42,pe:13.5,pb:1.41,pePb:19.01,debtRatio:null,currentRatio:null,quickRatio:null,fcf:null,epsAllPositive:!0,source:s,sourceDate:c,note:"Banco diversificado con P/B menor a 1.5 y ROE sobre 10%. En financieras los ratios current/quick/debt no son comparables con industriales."},{ticker:"PRU",companyName:"Prudential Financial",sector:"Financial Services / Insurance",price:103.7,pe:10.68,pb:1.13,pePb:12.03,debtRatio:null,currentRatio:null,quickRatio:null,fcf:10379,epsAllPositive:null,source:s,sourceDate:c,note:"Aseguradora con P/B bajo, ROE cercano a criterio y FCF positivo. Requiere lectura financiera especifica antes de compararla contra industriales."},{ticker:"QCOM",companyName:"QUALCOMM",sector:"Technology / Semiconductors",price:205.42,pe:22.09,pb:7.97,pePb:176.15,debtRatio:.56,currentRatio:2.37,quickRatio:1.45,fcf:9589.62,epsAllPositive:!0,source:s,sourceDate:c,note:"Tecnologia rentable, FCF fuerte y liquidez suficiente. Es razonable frente a growth puro, pero no Graham por P/B elevado."},{ticker:"CTSH",companyName:"Cognizant Technology Solutions",sector:"Technology / IT Services",price:52.94,pe:11.48,pb:1.67,pePb:19.12,debtRatio:.07,currentRatio:2.23,quickRatio:1.74,fcf:1908.88,epsAllPositive:!0,source:s,sourceDate:c,note:"Tecnologia no especulativa: P/E bajo, liquidez fuerte, deuda minima y FCF positivo. Cumple gran parte del perfil defensivo."}],L=B.map(e=>({...e,captureDate:e.captureDate||v})),f="2026-06-09",h=[{rawTicker:"Index100",ticker:"INDEX100",yahooSymbol:"^NDX",companyName:"Nasdaq-100 Index",quoteType:"INDEX",market:"US",analysisStatus:"index_reference",validationStatus:"index_reference",tags:["index_reference","benchmark","nasdaq-100"],notes:"Indice Nasdaq-100 de referencia. No se analiza con reglas Graham defensivas."},{rawTicker:"SP500",ticker:"SP500",yahooSymbol:"^GSPC",companyName:"S&P 500",quoteType:"INDEX",market:"US",analysisStatus:"index_reference",validationStatus:"index_reference",tags:["index_reference","benchmark","sp500"],notes:"Indice S&P 500 de referencia. No se analiza con reglas Graham defensivas."},{rawTicker:"MU",ticker:"MU",yahooSymbol:"MU.MX",companyName:"Micron Technology, Inc.",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"MRVL",ticker:"MRVL",yahooSymbol:"MRVL1.MX",companyName:"Marvell Technology, Inc.",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx_alias"},{rawTicker:"SNDK",ticker:"SNDK",yahooSymbol:"SNDK1.MX",companyName:"Sandisk Corporation",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx_alias"},{rawTicker:"NVDA",ticker:"NVDA",yahooSymbol:"NVDA.MX",companyName:"NVIDIA Corporation",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"INTC",ticker:"INTC",yahooSymbol:"INTC.MX",companyName:"Intel Corporation",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"SKHYNIX",ticker:"SKHYNIX",yahooSymbol:"000660.KS",companyName:"SK hynix Inc.",quoteType:"EQUITY",market:"Korea Exchange",validationStatus:"validated_yahoo_not_mx"},{rawTicker:"BB",ticker:"BB",yahooSymbol:"BB",companyName:"BlackBerry Limited",quoteType:"EQUITY",market:"NYSE",validationStatus:"validated_yahoo_not_mx"},{rawTicker:"MSTR",ticker:"MSTR",yahooSymbol:"MSTR.MX",companyName:"Strategy Inc",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"BIDU",ticker:"BIDU",yahooSymbol:"BIDU",companyName:"Baidu, Inc.",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"TSLA",ticker:"TSLA",yahooSymbol:"TSLA.MX",companyName:"Tesla, Inc.",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"AMD",ticker:"AMD",yahooSymbol:"AMD.MX",companyName:"Advanced Micro Devices, Inc.",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"GOLD",ticker:"GOLD",yahooSymbol:"GC=F",companyName:"Gold Futures",quoteType:"FUTURE",market:"COMEX",analysisStatus:"market_reference",validationStatus:"market_reference",tags:["market_reference","commodity","gold"],notes:"Futuro de oro para contexto macro. No se analiza con reglas Graham defensivas."},{rawTicker:"SILVER",ticker:"SILVER",yahooSymbol:"SI=F",companyName:"Silver Futures",quoteType:"FUTURE",market:"COMEX",analysisStatus:"market_reference",validationStatus:"market_reference",tags:["market_reference","commodity","silver"],notes:"Futuro de plata para contexto macro. No se analiza con reglas Graham defensivas."},{rawTicker:"COPPER",ticker:"COPPER",yahooSymbol:"HG=F",companyName:"Copper Futures",quoteType:"FUTURE",market:"COMEX",analysisStatus:"market_reference",validationStatus:"market_reference",tags:["market_reference","commodity","copper"],notes:"Futuro de cobre para contexto macro/ciclo industrial. No se analiza con reglas Graham defensivas."},{rawTicker:"META",ticker:"META",yahooSymbol:"META.MX",companyName:"Meta Platforms, Inc.",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"}],H=`
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
PLTR|PLTR.MX|Palantir Technologies Inc.||
PM|PM.MX|Philip Morris International Inc.|Consumer Defensive|Tobacco
CSCO|CSCO.MX|Cisco Systems, Inc.|Technology|Communication Equipment
IBM|IBM.MX|International Business Machines Corporation|Technology|Information Technology Services
CRM|CRM.MX|Salesforce, Inc.|Technology|Software Application
ORCL|ORCL.MX|Oracle Corporation|Technology|Software Infrastructure
CVX|CVX.MX|Chevron Corporation|Energy|Oil & Gas Integrated
GE|GE.MX|General Electric Company|Industrials|Aerospace & Defense
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
RTX|RTX.MX|RTX Corporation|Industrials|Aerospace & Defense
QCOM|QCOM.MX|QUALCOMM Incorporated|Technology|Semiconductors
CAT|CAT.MX|Caterpillar Inc.|Industrials|Farm & Heavy Construction Machinery
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
DE|DE.MX|Deere & Company|Industrials|Farm & Heavy Construction Machinery
CMCSA|CMCSA.MX|Comcast Corporation|Communication Services|Telecom Services
LMT|LMT.MX|Lockheed Martin Corporation|Industrials|Aerospace & Defense
PANW|PANW.MX|Palo Alto Networks, Inc.|Technology|Software Infrastructure
COP|COP.MX|ConocoPhillips|Energy|Oil & Gas E&P
ADI|ADI.MX|Analog Devices, Inc.|Technology|Semiconductors
MU|MU.MX|Micron Technology, Inc.|Technology|Semiconductors
BMY|BMY.MX|Bristol-Myers Squibb Company|Healthcare|Drug Manufacturers General
AMT|AMT.MX|American Tower Corporation|Real Estate|REIT Specialty
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
WELL|WELL.MX|Welltower Inc.|Real Estate|REIT Healthcare Facilities
CRWD|CRWD.MX|CrowdStrike Holdings, Inc.|Technology|Software Infrastructure
EQIX|EQIX.MX|Equinix, Inc.|Real Estate|REIT Specialty
HCA|HCA.MX|HCA Healthcare, Inc.|Healthcare|Medical Care Facilities
CTAS|CTAS.MX|Cintas Corporation|Industrials|Specialty Business Services
MMM|MMM.MX|3M Company|Industrials|Conglomerates
SNPS|SNPS.MX|Synopsys, Inc.|Technology|Software Infrastructure
CL|CL.MX|Colgate-Palmolive Company|Consumer Defensive|Household & Personal Products
CME|CME.MX|CME Group Inc.|Financial Services|Financial Data & Stock Exchanges
DUK|DUK.MX|Duke Energy Corporation|Utilities|Utilities Regulated Electric
TDG|TDG.MX|TransDigm Group Incorporated|Industrials|Aerospace & Defense
MSI|MSI.MX|Motorola Solutions, Inc.|Technology|Communication Equipment
CVS|CVS.MX|CVS Health Corporation|Healthcare|Healthcare Plans
MCK|MCK.MX|McKesson Corporation|Healthcare|Medical Distribution
USB|USB.MX|U.S. Bancorp|Financial Services|Banks Regional
MAR|MAR.MX|Marriott International, Inc.|Consumer Cyclical|Lodging
NOC|NOC.MX|Northrop Grumman Corporation|Industrials|Aerospace & Defense
ECL|ECL.MX|Ecolab Inc.|Basic Materials|Specialty Chemicals
REGN|REGN.MX|Regeneron Pharmaceuticals, Inc.|Healthcare|Biotechnology
PNC|PNC.MX|The PNC Financial Services Group, Inc.|Financial Services|Banks Regional
ORLY|ORLY.MX|O'Reilly Automotive, Inc.|Consumer Cyclical|Auto Parts
GD|GD.MX|General Dynamics Corporation|Industrials|Aerospace & Defense
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
SPG|SPG.MX|Simon Property Group, Inc.|Real Estate|REIT Retail
MNST|MNST.MX|Monster Beverage Corporation|Consumer Defensive|Beverages Non-Alcoholic
MPC|MPC.MX|Marathon Petroleum Corporation|Energy|Oil & Gas Refining & Marketing
ALL|ALL.MX|ALLSTATE CORP||
O|O.MX|Realty Income Corporation|Real Estate|REIT Retail
OKE|OKE.MX|ONEOK INC|Energy|Oil & Gas Midstream
RCL|RCL.MX|Royal Caribbean Cruises Ltd.|Consumer Cyclical|Travel Services
HLT|HLT.MX|Hilton Worldwide Holdings Inc.|Consumer Cyclical|Lodging
GWW|GWW.MX|W.W. Grainger, Inc.|Industrials|Industrial Distribution
FDX|FDX.MX|FedEx Corporation|Industrials|Integrated Freight & Logistics
PSA|PSA.MX|Public Storage|Real Estate|REIT Industrial
MET|MET.MX|MetLife, Inc.|Financial Services|Insurance Life
SRE|SRE.MX|Sempra|Utilities|Utilities Diversified
PCAR|PCAR.MX|PACCAR INC||
AMP|AMP.MX|Ameriprise Financial, Inc.|Financial Services|Asset Management
NDAQ|NDAQ.MX|Nasdaq, Inc.|Financial Services|Financial Data & Stock Exchanges
AFL|AFL.MX|Aflac Incorporated|Financial Services|Insurance Life
PSX|PSX.MX|Phillips 66|Energy|Oil & Gas Refining & Marketing
AIG|AIG.MX|American International Group, Inc.|Financial Services|Insurance Diversified
ROST|ROST.MX|Ross Stores, Inc.|Consumer Cyclical|Apparel Retail
PWR|PWR.MX|QUANTA SERVICES|Industrials|Engineering & Construction
ODFL|ODFL.MX|Old Dominion Freight Line, Inc.|Industrials|Trucking
KR|KR.MX|The Kroger Co.|Consumer Defensive|Grocery Stores
DLR|DLR.MX|Digital Realty Trust, Inc.|Real Estate|REIT Specialty
VLO|VLO.MX|Valero Energy Corporation|Energy|Oil & Gas Refining & Marketing
LHX|LHX.MX|L3Harris Technologies, Inc.|Industrials|Aerospace & Defense
D|D.MX|Dominion Energy, Inc.|Utilities|Utilities Regulated Electric
MSCI|MSCI.MX|MSCI Inc.|Financial Services|Financial Data & Stock Exchanges
FANG|FANG.MX|Diamondback Energy, Inc.|Energy|Oil & Gas E&P
KDP|KDP.MX|KEURIG DR PEPPER INC||
KMI|KMI.MX|Kinder Morgan, Inc.|Energy|Oil & Gas Midstream
CTVA|CTVA.MX|Corteva, Inc.|Basic Materials|Agricultural Inputs
CMI|CMI.MX|Cummins Inc.|Industrials|Specialty Industrial Machinery
PEG|PEG.MX|PUBLIC SERVICE ENTERPRISE GROUP|Utilities|Utilities Regulated Electric
GEHC|GEHC.MX|GE HealthCare Technologies Inc.|Healthcare|Medical Devices
KHC|KHC.MX|The Kraft Heinz Company|Consumer Defensive|Packaged Foods
KVUE|KVUE.MX|KENVUE INC|Consumer Defensive|Household & Personal Products
COR|COR.MX|Cencora, Inc.|Healthcare|Medical Distribution
VRSK|VRSK.MX|Verisk Analytics, Inc.|Industrials|Consulting Services
LEN|LEN.MX|Lennar Corporation|Consumer Cyclical|Residential Construction
FIS|FIS.MX|Fidelity National Information Services, Inc.|Technology|Information Technology Services
STZ|STZ.MX|Constellation Brands, Inc.|Consumer Defensive|Beverages Brewers
CSGP|CSGP.MX|COSTAR GROUP INC||
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
EQR|EQR.MX|Equity Residential|Real Estate|REIT Residential
CNC|CNC.MX|Centene Corporation|Healthcare|Healthcare Plans
IDXX|IDXX.MX|IDEXX Laboratories, Inc.|Healthcare|Diagnostics & Research
MCHP|MCHP.MX|Microchip Technology Incorporated|Technology|Semiconductors
VICI|VICI.MX|VICI Properties Inc.|Real Estate|REIT Diversified
XYL|XYL.MX|Xylem Inc.|Industrials|Specialty Industrial Machinery
OTIS|OTIS.MX|Otis Worldwide Corporation|Industrials|Specialty Industrial Machinery
HWM|HWM.MX|Howmet Aerospace Inc.|Industrials|Aerospace & Defense
EBAY|EBAY.MX|eBay Inc.|Consumer Cyclical|Internet Retail
WAB|WAB.MX|Westinghouse Air Brake Technologies Corporation|Industrials|Railroads
HPE|HPE.MX|Hewlett Packard Enterprise Company|Technology|Communication Equipment
BR|BR.MX|BROADRIDGE FINANCIAL SOLUTION I||
GDDY|GDDY.MX|GoDaddy Inc.|Technology|Software Infrastructure
DXCM|DXCM.MX|DexCom, Inc.|Healthcare|Medical Devices
`.trim();function _(e){return e.split(`
`).map(a=>{const[i,n,o,r,t]=a.split("|");return{rawTicker:i,ticker:i,yahooSymbol:n,companyName:o,sector:r||"Sin sector",industry:t||"Sin industria",quoteType:"EQUITY",market:"BMV SIC",source:"Yahoo Finance Search",sourceDate:f,validationStatus:"validated_yahoo_mx"}})}function O(e){const a=new Map;for(const i of e){const n=i.ticker.toUpperCase();a.has(n)||a.set(n,i)}return[...a.values()]}const E=_(H),R=O([...h.map(e=>({...e,sector:e.sector||"Solicitados",industry:e.industry||e.quoteType,source:"User requested batch + Yahoo Finance Search",sourceDate:f,priority:"requested"})),...E]),w={sourceDate:f,requestedCount:h.length,bmvSicCount:E.length,totalCount:R.length,sources:["Yahoo Finance Search","Grupo BMV Mercado Global/SIC"]},X={nearPePb:28,nearPe:22,nearPb:2.3,nearDebtRatio:1.2,nearCurrentRatio:1.8,grahamDistancePct:.15};function x(e){const a=["manual-candidate"];return e.pePb<=22.5&&e.pe<=20&&e.pb<=2&&a.push("graham-watch"),e.sector&&a.push(String(e.sector).split("/")[0].trim().toLowerCase().replace(/\s+/g,"-")),a}const T=L.map(e=>({...e,analysisStatus:"analyzed",yahooSymbol:e.yahooSymbol||e.ticker,market:e.market||"US",watchReason:e.note,tags:x(e)})),V=new Map(T.map(e=>[e.ticker.toUpperCase(),e]));function W(e){return{...e,yahooSymbol:e.yahooSymbol||e.yahoo_symbol||e.ticker,companyName:e.companyName||e.company_name||e.name||e.ticker,quoteType:e.quoteType||e.quote_type||"EQUITY",analysisStatus:e.analysisStatus||e.analysis_status||"pending_fundamentals",validationStatus:e.validationStatus||e.validation_status||"needs_manual_review",sourceDate:e.sourceDate||e.source_date,notes:e.notes||e.note||""}}async function te(e=fetch,a="/"){try{const i=await e(`${a.replace(/\/?$/,"/")}data/companies.json`);if(!i.ok)throw new Error(`No se pudo cargar companies.json: ${i.status}`);const n=await i.json();return Array.isArray(n)?n.map(W):[]}catch{return[]}}function K(e){const a=new Map;for(const i of e)for(const n of i){const o=n.ticker.toUpperCase();a.set(o,{...a.get(o)||{},...n})}return[...a.values()]}function q(e=[]){const a=K([R,e]),i=a.map(r=>{var p,M,d,l,y;const t=V.get(r.ticker.toUpperCase());return t?{...r,...t,yahooSymbol:t.yahooSymbol||t.ticker,market:t.market||"US",validationStatus:r.validationStatus||"manual_snapshot"}:r.analysisStatus==="analyzed"?{...r,yahooSymbol:r.yahooSymbol||r.ticker,market:r.market||"US",watchReason:r.watchReason||r.notes||"Analisis Graham automatico desde export publico.",tags:(p=r.tags)!=null&&p.length?r.tags:["sec-auto-analysis"]}:String(r.analysisStatus||"").startsWith("analysis_")?{...r,yahooSymbol:r.yahooSymbol||r.ticker,watchReason:r.watchReason||r.notes||"No se pudo completar el analisis automatico.",tags:(M=r.tags)!=null&&M.length?r.tags:["analysis-review"]}:r.analysisStatus==="index_reference"||r.analysisStatus==="market_reference"||r.validationStatus==="index_reference"||r.validationStatus==="market_reference"||(d=r.tags)!=null&&d.includes("index_reference")||(l=r.tags)!=null&&l.includes("market_reference")||["INDEX","ETF","FUTURE"].includes(String(r.quoteType||"").toUpperCase())?{...r,yahooSymbol:r.yahooSymbol||r.ticker,watchReason:r.watchReason||r.notes||"Referencia de mercado. No requiere analisis Graham.",tags:(y=r.tags)!=null&&y.length?r.tags:["market_reference"]}:{...r,analysisStatus:"pending_fundamentals",watchReason:"Pendiente de primer analisis Graham: requiere fundamentales de Yahoo Finance o captura manual validada.",tags:[r.priority==="requested"?"requested":"bmv-sic","pending-analysis"]}}),n=new Set(a.map(r=>r.ticker.toUpperCase())),o=T.filter(r=>!n.has(r.ticker.toUpperCase()));return[...i,...o]}function z(e,a=[]){return{...w,publicExportCount:a.length,analyzedCount:e.filter(i=>i.analysisStatus==="analyzed").length,referenceCount:e.filter(i=>i.analysisStatus==="index_reference"||i.validationStatus==="index_reference").length,pendingCount:e.filter(i=>i.analysisStatus!=="analyzed"&&i.analysisStatus!=="index_reference").length,totalCount:e.length}}function Y(e){return Array.isArray(e)?e.map(a=>String(a).trim()).filter(Boolean):String(e||"").split(",").map(a=>a.trim()).filter(Boolean)}function se(e){const a=new Set;for(const i of e)for(const n of Y(i.tags))a.add(n);return[...a].sort((i,n)=>i.localeCompare(n))}const A=[],j=q(A);z(j,A);const Q=["pe","pb","debtRatio","currentRatio","fcf"];function P(e){return e!=null&&e!==""&&Number.isFinite(Number(e))}function J(e,a=e.price){if(!Z(e))return null;const i=e.price/e.pe,n=e.price/e.pb,o=a/i,r=a/n,t=o*r,p=Math.sqrt(22.5*i*n),M=i*20,d=n*2,l=Math.min(p,M,d);return{pe:o,pb:r,pePb:t,debtRatio:e.debtRatio,currentRatio:e.currentRatio,quickRatio:e.quickRatio,fcf:e.fcf,epsAllPositive:e.epsAllPositive,epsGrowing:null,roe:null,roa:null,tie:null,epsAdj:i,bvps:n,price:a,grahamFormula:p,pricePe20:M,pricePb2:d,maxDefensivePrice:l,distanceToDefensive:l>0?(a-l)/l:null,marginOfSafety:a>0?(p-a)/a:null}}function Z(e){return[e.price,e.pe,e.pb,e.debtRatio,e.currentRatio].every(P)}function $(e){return Q.filter(a=>P(e[a])).length}function ee(e,a=null,i=X){const n=(a==null?void 0:a.price)??e.lastPrice??e.price;if(ae(e))return C({...e,quote:a,livePrice:n??null,ratios:null,classification:{id:"index_reference",label:"REFERENCIA",color:"#38bdf8",reason:e.notes||"Instrumento de referencia para comparar mercado; no se analiza con reglas Graham defensivas."},alertLevel:"reference",alertLabel:"Referencia de mercado",closeToDefensive:!1,near:!1});if($(e)<3)return e.validationStatus==="yahoo_model_rejected"?C({...e,quote:a,livePrice:(a==null?void 0:a.price)??e.price??null,ratios:null,classification:{id:e.classificationId||"rejected",label:e.classificationLabel||"RECHAZADA",color:"#ef4444",reason:e.notes||"Rechazada por modelo Graham defensivo con datos parciales no comparables."},alertLevel:"watch",alertLabel:e.classificationLabel||"Rechazada por modelo",closeToDefensive:!1,near:!1}):C({...e,analysisStatus:"analysis_incomplete",quote:a,livePrice:(a==null?void 0:a.price)??e.price??null,ratios:null,classification:{id:"analysis_incomplete",label:"DATOS INSUFICIENTES",color:"#94a3b8",reason:"Faltan al menos 3 de 5 ratios criticos para evaluar con Graham."},alertLevel:"pending",alertLabel:"Datos insuficientes",closeToDefensive:!1,near:!1});const r=J(e,n);if(!r)return e.analysisStatus==="analyzed"?C({...e,quote:a,livePrice:(a==null?void 0:a.price)??e.price??null,ratios:null,classification:{id:e.classificationId||"rejected",label:e.classificationLabel||"RECHAZADA",color:"#ef4444",reason:e.notes||"Analizada, pero con datos insuficientes para aprobar reglas Graham."},alertLevel:"watch",alertLabel:e.classificationLabel||"Analizada sin aprobacion Graham",closeToDefensive:!1,near:!1}):String(e.analysisStatus||"").startsWith("analysis_")?C({...e,quote:a,livePrice:(a==null?void 0:a.price)??e.price??null,ratios:null,classification:{id:e.analysisStatus,label:"NO SOPORTADA",color:"#94a3b8",reason:e.notes||"No se pudo completar el analisis automatico."},alertLevel:"pending",alertLabel:e.notes||"No soportada por analisis automatico",closeToDefensive:!1,near:!1}):C({...e,quote:a,livePrice:(a==null?void 0:a.price)??null,ratios:null,classification:{id:"pending_fundamentals",label:"PENDIENTE DE ANALISIS",color:"#94a3b8",reason:"Faltan fundamentales para calcular ratios Graham."},alertLevel:"pending",alertLabel:a!=null&&a.price?"Precio disponible, faltan fundamentales":"Pendiente de primer analisis",closeToDefensive:!1,near:!1});const t=F(r),p=r.pePb<=i.nearPePb&&r.pe<=i.nearPe&&r.pb<=i.nearPb&&r.debtRatio<i.nearDebtRatio&&r.currentRatio>=i.nearCurrentRatio&&r.epsAllPositive===!0,M=r.distanceToDefensive!==null&&r.distanceToDefensive<=i.grahamDistancePct;let d="watch",l="En observacion";return t.id==="graham_approved"?(d="approved",l="Aprobada Graham"):(p||M)&&(d="near",l="Cerca de aprobar"),C({...e,quote:a,livePrice:n,ratios:r,classification:t,alertLevel:d,alertLabel:l,closeToDefensive:M,near:p})}function ce(e,a={},i=X){return e.map(n=>ee(n,a[n.ticker]??null,i)).sort((n,o)=>{const r={approved:0,near:1,watch:2,reference:3,pending:4};return r[n.alertLevel]!==r[o.alertLevel]?r[n.alertLevel]-r[o.alertLevel]:!n.ratios||!o.ratios?n.ticker.localeCompare(o.ticker):n.ratios.pePb-o.ratios.pePb})}function le(e){return{approved:e.filter(a=>a.alertLevel==="approved"),near:e.filter(a=>a.alertLevel==="near"),watch:e.filter(a=>a.alertLevel==="watch"),reference:e.filter(a=>a.alertLevel==="reference"),pending:e.filter(a=>a.alertLevel==="pending")}}function ae(e){var a,i;return e.analysisStatus==="index_reference"||e.analysisStatus==="market_reference"||e.validationStatus==="index_reference"||e.validationStatus==="market_reference"||((a=e.tags)==null?void 0:a.includes("index_reference"))||((i=e.tags)==null?void 0:i.includes("market_reference"))||["INDEX","ETF","FUTURE"].includes(String(e.quoteType||"").toUpperCase())}function C(e){return{...e,systemStatus:U(e)}}export{ne as M,le as a,q as b,F as c,z as d,se as e,te as f,oe as l,Y as n,ce as s};
