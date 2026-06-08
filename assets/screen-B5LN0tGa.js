import{A as M,j as d,a as X,b as A,S as m}from"./index-Bsgto9_i.js";import{D as R}from"./Dot-D2YEuvLX.js";function E(e){return e.roe>.1&&e.roa>.05&&e.tie>5&&e.quickRatio>=1&&e.fcf>0}function y(e){return e!=null&&e!==""&&Number.isFinite(Number(e))}function P(e){if([e.pePb,e.debtRatio,e.currentRatio,e.pe,e.pb].every(y)&&e.pePb<=22.5&&e.debtRatio<1&&e.currentRatio>=2&&e.epsAllPositive===!0&&e.pe<=20&&e.pb<=2)return{id:"graham_approved",label:"APROBADA GRAHAMIANA",color:M.green,reason:"Cumple valuación defensiva, liquidez, deuda controlada y EPS positivo."};const r=y(e.pePb)&&E(e)&&e.pePb>22.5&&e.epsAllPositive===!0;return r&&e.epsGrowing===!0?{id:"excellent_expensive",label:"EXCELENTE, PERO CARA",color:M.yellow,reason:"Empresa fuerte, pero cotiza fuera del rango Graham defensivo."}:r&&e.epsGrowing===!1?{id:"good_overvalued",label:"BUENA EMPRESA, SOBREVALORADA",color:M.orange,reason:"La calidad financiera existe, pero el crecimiento de EPS no es consistente y la valuación excede 22.5."}:{id:"rejected",label:"RECHAZADA",color:M.red,reason:"No cumple los criterios mínimos defensivos de Graham."}}function D(e){var a;return((a=Object.entries(M).find(([,r])=>r===e))==null?void 0:a[0])||"gray"}function Z({label:e,value:a,sublabel:r,ref:o,color:i=M.gray}){const n=D(i);return d.jsxs("article",{style:{background:A[n],border:`1px solid ${X[n]}`,borderRadius:8,padding:14,minHeight:126},children:[d.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,color:m.muted,fontSize:12},children:[d.jsx(R,{color:i}),d.jsx("span",{children:e})]}),d.jsx("div",{style:{marginTop:10,fontFamily:"IBM Plex Mono, monospace",color:m.text,fontSize:26,fontWeight:600,wordBreak:"break-word"},children:a}),r?d.jsx("div",{style:{marginTop:8,color:m.muted,fontSize:12},children:r}):null,o?d.jsx("div",{style:{marginTop:6,color:"#7dd3fc",fontSize:11},children:o}):null]})}const s={graham_approved:{id:"graham_approved",label:"Aprobada Graham",group:"opportunity",rank:0,color:"#22c55e"},near_defensive:{id:"near_defensive",label:"Cerca de rango defensivo",group:"opportunity",rank:1,color:"#eab308"},excellent_expensive:{id:"excellent_expensive",label:"Excelente, pero cara",group:"watch",rank:2,color:"#eab308"},good_overvalued:{id:"good_overvalued",label:"Buena empresa, sobrevalorada",group:"watch",rank:3,color:"#f97316"},rejected_model:{id:"rejected_model",label:"Rechazada por modelo",group:"discarded",rank:4,color:"#ef4444"},watch_observation:{id:"watch_observation",label:"En observacion",group:"watch",rank:5,color:"#64748b"},pending_fundamentals:{id:"pending_fundamentals",label:"Pendiente de fundamentales",group:"pending",rank:6,color:"#38bdf8"},manual_review:{id:"manual_review",label:"Revision manual",group:"pending",rank:7,color:"#a78bfa"},unsupported_analysis:{id:"unsupported_analysis",label:"No soportada",group:"pending",rank:8,color:"#94a3b8"},index_reference:{id:"index_reference",label:"Referencia de mercado",group:"reference",rank:9,color:"#38bdf8"}};function b(e){var a,r,o,i,n;return e.alertLevel==="reference"||e.analysisStatus==="index_reference"||e.validationStatus==="index_reference"?s.index_reference:e.alertLevel==="approved"||((a=e.classification)==null?void 0:a.id)==="graham_approved"?s.graham_approved:e.alertLevel==="near"?s.near_defensive:((r=e.classification)==null?void 0:r.id)==="excellent_expensive"?s.excellent_expensive:((o=e.classification)==null?void 0:o.id)==="good_overvalued"?s.good_overvalued:((i=e.classification)==null?void 0:i.id)==="rejected"||((n=e.classification)==null?void 0:n.label)==="RECHAZADA"||e.validationStatus==="yahoo_model_rejected"?s.rejected_model:String(e.analysisStatus||"").startsWith("analysis_")?s.unsupported_analysis:e.validationStatus==="needs_manual_review"||e.validationStatus==="yahoo_partial_incomplete"?s.manual_review:e.analysisStatus==="pending_fundamentals"||e.alertLevel==="pending"?s.pending_fundamentals:s.watch_observation}function J(){return Object.values(s).sort((e,a)=>e.rank-a.rank)}const k="2026-06-03",N=[{ticker:"PHM",companyName:"PulteGroup",sector:"Residential Construction",price:117.77,pe:11.39,pb:1.75,pePb:19.89,debtRatio:.4,currentRatio:6.24,quickRatio:.94,fcf:1831.38,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Constructor grande con valuacion dentro del limite 22.5 y liquidez alta; quick ratio bajo por inventario de vivienda, normal en el sector pero relevante para Graham."},{ticker:"LEN",companyName:"Lennar",sector:"Residential Construction",price:90.9,pe:13.06,pb:1.02,pePb:13.27,debtRatio:.51,currentRatio:8.32,quickRatio:4.51,fcf:365.79,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Perfil Graham limpio: P/B cercano a 1, deuda moderada y liquidez muy amplia. Riesgo principal: concentracion ciclica en vivienda."},{ticker:"TOL",companyName:"Toll Brothers",sector:"Residential Construction",price:139.53,pe:10.55,pb:1.54,pePb:16.25,debtRatio:.71,currentRatio:3.09,quickRatio:.45,fcf:1332.53,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Valuacion atractiva y FCF positivo; quick ratio bajo porque el balance depende de inventarios/lotes. Requiere cuidado con ciclo inmobiliario."},{ticker:"TMHC",companyName:"Taylor Morrison Home",sector:"Residential Construction",price:71.5,pe:10.67,pb:1.08,pePb:11.54,debtRatio:.56,currentRatio:7.51,quickRatio:1.45,fcf:601.88,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Muy barata por P/E x P/B y con liquidez robusta. Mejor balance de liquidez que varias constructoras por quick ratio sobre 1."},{ticker:"MTH",companyName:"Meritage Homes",sector:"Residential Construction",price:68.12,pe:12.5,pb:.89,pePb:11.15,debtRatio:.48,currentRatio:10.96,quickRatio:1.6,fcf:208.15,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Cotiza bajo book value y conserva liquidez fuerte. Buen candidato Graham, aunque dependiente del ciclo de tasas/vivienda."},{ticker:"CTSH",companyName:"Cognizant Technology Solutions",sector:"IT Services",price:55.14,pe:11.99,pb:1.73,pePb:20.79,debtRatio:.36,currentRatio:2.23,quickRatio:2.23,fcf:1728,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"No es constructora: servicios IT con liquidez real, deuda baja y FCF positivo. P/E x P/B pasa, pero esta mas cerca del limite 22.5."},{ticker:"INGR",companyName:"Ingredion",sector:"Packaged Foods",price:101.12,pe:9.74,pb:1.45,pePb:14.09,debtRatio:.79,currentRatio:2.76,quickRatio:1.83,fcf:446,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Defensiva de alimentos empaquetados, menos ciclica que homebuilders. Deuda bajo 1, liquidez suficiente y valuacion Graham razonable."},{ticker:"MHO",companyName:"M/I Homes",sector:"Residential Construction",price:138.43,pe:10.42,pb:1.11,pePb:11.57,debtRatio:.5,currentRatio:7.64,quickRatio:1.78,fcf:156.5,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Pasa con mucho margen la regla 22.5 y mantiene liquidez alta. Empresa mas pequena: revisar volumen, geografias y sensibilidad al inventario."},{ticker:"KBH",companyName:"KB Home",sector:"Residential Construction",price:51.45,pe:9.93,pb:.84,pePb:8.3,debtRatio:.74,currentRatio:2.2,quickRatio:.2,fcf:475.53,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"La mas barata del grupo por P/E x P/B, pero quick ratio muy bajo por inventario. Aprobada por Graham defensivo, con riesgo operativo de ciclo e inventario."},{ticker:"GRBK",companyName:"Green Brick Partners",sector:"Residential Construction",price:69.02,pe:10.16,pb:1.5,pePb:15.26,debtRatio:.27,currentRatio:8.45,quickRatio:.83,fcf:164.48,epsAllPositive:!0,source:"Finviz + StockAnalysis",sourceDate:"2026-06-03",note:"Deuda muy baja y current ratio amplio. Quick ratio bajo por inventario; aun asi pasa la regla Graham por margen razonable."}],G=N.map(e=>({...e,captureDate:e.captureDate||k})),S="2026-06-04",I=[{rawTicker:"Index100",ticker:"INDEX100",yahooSymbol:"^NDX",companyName:"Nasdaq-100 Index",quoteType:"INDEX",market:"US",validationStatus:"validated_yahoo"},{rawTicker:"SP500",ticker:"SP500",yahooSymbol:"^GSPC",companyName:"S&P 500",quoteType:"INDEX",market:"US",validationStatus:"validated_yahoo"},{rawTicker:"MU",ticker:"MU",yahooSymbol:"MU.MX",companyName:"Micron Technology, Inc.",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"MRVL",ticker:"MRVL",yahooSymbol:"MRVL1.MX",companyName:"Marvell Technology, Inc.",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx_alias"},{rawTicker:"SNDK",ticker:"SNDK",yahooSymbol:"SNDK1.MX",companyName:"Sandisk Corporation",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx_alias"},{rawTicker:"NVDA",ticker:"NVDA",yahooSymbol:"NVDA.MX",companyName:"NVIDIA Corporation",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"INTC",ticker:"INTC",yahooSymbol:"INTC.MX",companyName:"Intel Corporation",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"SKHYNIX",ticker:"SKHYNIX",yahooSymbol:"000660.KS",companyName:"SK hynix Inc.",quoteType:"EQUITY",market:"Korea Exchange",validationStatus:"validated_yahoo_not_mx"},{rawTicker:"BB",ticker:"BB",yahooSymbol:"BB",companyName:"BlackBerry Limited",quoteType:"EQUITY",market:"NYSE",validationStatus:"validated_yahoo_not_mx"},{rawTicker:"MSTR",ticker:"MSTR",yahooSymbol:"MSTR.MX",companyName:"Strategy Inc",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"BIDU",ticker:"BIDU",yahooSymbol:"BIDU",companyName:"Baidu, Inc.",quoteType:"EQUITY",market:"NASDAQ",validationStatus:"validated_yahoo"},{rawTicker:"TSLA",ticker:"TSLA",yahooSymbol:"TSLA.MX",companyName:"Tesla, Inc.",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"AMD",ticker:"AMD",yahooSymbol:"AMD.MX",companyName:"Advanced Micro Devices, Inc.",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"},{rawTicker:"GOLD",ticker:"GOLD",yahooSymbol:"GC=F",companyName:"Gold Futures",quoteType:"FUTURE",market:"COMEX",validationStatus:"validated_yahoo_commodity"},{rawTicker:"SILVER",ticker:"SILVER",yahooSymbol:"SI=F",companyName:"Silver Futures",quoteType:"FUTURE",market:"COMEX",validationStatus:"validated_yahoo_commodity"},{rawTicker:"COPPER",ticker:"COPPER",yahooSymbol:"HG=F",companyName:"Copper Futures",quoteType:"FUTURE",market:"COMEX",validationStatus:"validated_yahoo_commodity"},{rawTicker:"META",ticker:"META",yahooSymbol:"META.MX",companyName:"Meta Platforms, Inc.",quoteType:"EQUITY",market:"BMV SIC",validationStatus:"validated_yahoo_mx"}],L=`
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
`.trim();function H(e){return e.split(`
`).map(a=>{const[r,o,i,n,t]=a.split("|");return{rawTicker:r,ticker:r,yahooSymbol:o,companyName:i,sector:n||"Sin sector",industry:t||"Sin industria",quoteType:"EQUITY",market:"BMV SIC",source:"Yahoo Finance Search",sourceDate:S,validationStatus:"validated_yahoo_mx"}})}function F(e){const a=new Map;for(const r of e){const o=r.ticker.toUpperCase();a.has(o)||a.set(o,r)}return[...a.values()]}const v=H(L),h=F([...I.map(e=>({...e,sector:e.sector||"Solicitados",industry:e.industry||e.quoteType,source:"User requested batch + Yahoo Finance Search",sourceDate:S,priority:"requested"})),...v]),B={sourceDate:S,requestedCount:I.length,bmvSicCount:v.length,totalCount:h.length,sources:["Yahoo Finance Search","Grupo BMV Mercado Global/SIC"]},f={nearPePb:28,nearPe:22,nearPb:2.3,nearDebtRatio:1.2,nearCurrentRatio:1.8,grahamDistancePct:.15},T=G.map(e=>({...e,analysisStatus:"analyzed",yahooSymbol:e.yahooSymbol||e.ticker,market:e.market||"US",watchReason:e.note,tags:e.sector==="Residential Construction"?["graham-approved","homebuilder","cyclical"]:["graham-approved"]})),_=new Map(T.map(e=>[e.ticker.toUpperCase(),e]));function O(e){return{...e,yahooSymbol:e.yahooSymbol||e.yahoo_symbol||e.ticker,companyName:e.companyName||e.company_name||e.name||e.ticker,quoteType:e.quoteType||e.quote_type||"EQUITY",analysisStatus:e.analysisStatus||e.analysis_status||"pending_fundamentals",validationStatus:e.validationStatus||e.validation_status||"needs_manual_review",sourceDate:e.sourceDate||e.source_date,notes:e.notes||e.note||""}}async function $(e=fetch,a="/"){try{const r=await e(`${a.replace(/\/?$/,"/")}data/companies.json`);if(!r.ok)throw new Error(`No se pudo cargar companies.json: ${r.status}`);const o=await r.json();return Array.isArray(o)?o.map(O):[]}catch{return[]}}function U(e){const a=new Map;for(const r of e)for(const o of r){const i=o.ticker.toUpperCase();a.set(i,{...a.get(i)||{},...o})}return[...a.values()]}function w(e=[]){const a=U([h,e]),r=a.map(n=>{var c,l,u,p;const t=_.get(n.ticker.toUpperCase());return t?{...n,...t,yahooSymbol:t.yahooSymbol||t.ticker,market:t.market||"US",validationStatus:n.validationStatus||"manual_snapshot"}:n.analysisStatus==="analyzed"?{...n,yahooSymbol:n.yahooSymbol||n.ticker,market:n.market||"US",watchReason:n.watchReason||n.notes||"Analisis Graham automatico desde export publico.",tags:(c=n.tags)!=null&&c.length?n.tags:["sec-auto-analysis"]}:String(n.analysisStatus||"").startsWith("analysis_")?{...n,yahooSymbol:n.yahooSymbol||n.ticker,watchReason:n.watchReason||n.notes||"No se pudo completar el analisis automatico.",tags:(l=n.tags)!=null&&l.length?n.tags:["analysis-review"]}:n.analysisStatus==="index_reference"||n.validationStatus==="index_reference"||(u=n.tags)!=null&&u.includes("index_reference")?{...n,yahooSymbol:n.yahooSymbol||n.ticker,watchReason:n.watchReason||n.notes||"Referencia de mercado. No requiere analisis Graham.",tags:(p=n.tags)!=null&&p.length?n.tags:["index_reference"]}:{...n,analysisStatus:"pending_fundamentals",watchReason:"Pendiente de primer analisis Graham: requiere fundamentales de Yahoo Finance o captura manual validada.",tags:[n.priority==="requested"?"requested":"bmv-sic","pending-analysis"]}}),o=new Set(a.map(n=>n.ticker.toUpperCase())),i=T.filter(n=>!o.has(n.ticker.toUpperCase()));return[...r,...i]}function x(e,a=[]){return{...B,publicExportCount:a.length,analyzedCount:e.filter(r=>r.analysisStatus==="analyzed").length,referenceCount:e.filter(r=>r.analysisStatus==="index_reference"||r.validationStatus==="index_reference").length,pendingCount:e.filter(r=>r.analysisStatus!=="analyzed"&&r.analysisStatus!=="index_reference").length,totalCount:e.length}}const g=[],V=w(g);x(V,g);function K(e,a=e.price){if(!W(e))return null;const r=e.price/e.pe,o=e.price/e.pb,i=a/r,n=a/o,t=i*n,c=Math.sqrt(22.5*r*o),l=r*20,u=o*2,p=Math.min(c,l,u);return{pe:i,pb:n,pePb:t,debtRatio:e.debtRatio,currentRatio:e.currentRatio,quickRatio:e.quickRatio,fcf:e.fcf,epsAllPositive:e.epsAllPositive,epsGrowing:null,roe:null,roa:null,tie:null,epsAdj:r,bvps:o,price:a,grahamFormula:c,pricePe20:l,pricePb2:u,maxDefensivePrice:p,distanceToDefensive:p>0?(a-p)/p:null,marginOfSafety:a>0?(c-a)/a:null}}function W(e){return[e.price,e.pe,e.pb,e.debtRatio,e.currentRatio].every(a=>a!=null&&a!==""&&Number.isFinite(Number(a)))}function z(e,a=null,r=f){const o=(a==null?void 0:a.price)??e.lastPrice??e.price;if(q(e))return C({...e,quote:a,livePrice:o??null,ratios:null,classification:{id:"index_reference",label:"REFERENCIA",color:"#38bdf8",reason:e.notes||"Instrumento de referencia para comparar mercado; no se analiza con reglas Graham defensivas."},alertLevel:"reference",alertLabel:"Referencia de mercado",closeToDefensive:!1,near:!1});const i=K(e,o);if(!i)return e.analysisStatus==="analyzed"?C({...e,quote:a,livePrice:(a==null?void 0:a.price)??e.price??null,ratios:null,classification:{id:e.classificationId||"rejected",label:e.classificationLabel||"RECHAZADA",color:"#ef4444",reason:e.notes||"Analizada, pero con datos insuficientes para aprobar reglas Graham."},alertLevel:"watch",alertLabel:e.classificationLabel||"Analizada sin aprobacion Graham",closeToDefensive:!1,near:!1}):String(e.analysisStatus||"").startsWith("analysis_")?C({...e,quote:a,livePrice:(a==null?void 0:a.price)??e.price??null,ratios:null,classification:{id:e.analysisStatus,label:"NO SOPORTADA",color:"#94a3b8",reason:e.notes||"No se pudo completar el analisis automatico."},alertLevel:"pending",alertLabel:e.notes||"No soportada por analisis automatico",closeToDefensive:!1,near:!1}):C({...e,quote:a,livePrice:(a==null?void 0:a.price)??null,ratios:null,classification:{id:"pending_fundamentals",label:"PENDIENTE DE ANALISIS",color:"#94a3b8",reason:"Faltan fundamentales para calcular ratios Graham."},alertLevel:"pending",alertLabel:a!=null&&a.price?"Precio disponible, faltan fundamentales":"Pendiente de primer analisis",closeToDefensive:!1,near:!1});const n=P(i),t=i.pePb<=r.nearPePb&&i.pe<=r.nearPe&&i.pb<=r.nearPb&&i.debtRatio<r.nearDebtRatio&&i.currentRatio>=r.nearCurrentRatio&&i.epsAllPositive===!0,c=i.distanceToDefensive!==null&&i.distanceToDefensive<=r.grahamDistancePct;let l="watch",u="En observacion";return n.id==="graham_approved"?(l="approved",u="Aprobada Graham"):(t||c)&&(l="near",u="Cerca de aprobar"),C({...e,quote:a,livePrice:o,ratios:i,classification:n,alertLevel:l,alertLabel:u,closeToDefensive:c,near:t})}function ee(e,a={},r=f){return e.map(o=>z(o,a[o.ticker]??null,r)).sort((o,i)=>{const n={approved:0,near:1,watch:2,reference:3,pending:4};return n[o.alertLevel]!==n[i.alertLevel]?n[o.alertLevel]-n[i.alertLevel]:!o.ratios||!i.ratios?o.ticker.localeCompare(i.ticker):o.ratios.pePb-i.ratios.pePb})}function ae(e){return{approved:e.filter(a=>a.alertLevel==="approved"),near:e.filter(a=>a.alertLevel==="near"),watch:e.filter(a=>a.alertLevel==="watch"),reference:e.filter(a=>a.alertLevel==="reference"),pending:e.filter(a=>a.alertLevel==="pending")}}function q(e){var a;return e.analysisStatus==="index_reference"||e.validationStatus==="index_reference"||((a=e.tags)==null?void 0:a.includes("index_reference"))||["INDEX","ETF"].includes(String(e.quoteType||"").toUpperCase())}function C(e){return{...e,systemStatus:b(e)}}export{Z as M,ae as a,w as b,P as c,x as d,$ as f,J as l,ee as s};
