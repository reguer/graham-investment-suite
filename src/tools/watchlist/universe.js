const SOURCE_DATE = "2026-06-04";

export const requestedTickers = [
  { rawTicker: "Index100", ticker: "INDEX100", yahooSymbol: "^NDX", companyName: "Nasdaq-100 Index", quoteType: "INDEX", market: "US", validationStatus: "validated_yahoo" },
  { rawTicker: "SP500", ticker: "SP500", yahooSymbol: "^GSPC", companyName: "S&P 500", quoteType: "INDEX", market: "US", validationStatus: "validated_yahoo" },
  { rawTicker: "MU", ticker: "MU", yahooSymbol: "MU.MX", companyName: "Micron Technology, Inc.", quoteType: "EQUITY", market: "BMV SIC", validationStatus: "validated_yahoo_mx" },
  { rawTicker: "MRVL", ticker: "MRVL", yahooSymbol: "MRVL1.MX", companyName: "Marvell Technology, Inc.", quoteType: "EQUITY", market: "BMV SIC", validationStatus: "validated_yahoo_mx_alias" },
  { rawTicker: "SNDK", ticker: "SNDK", yahooSymbol: "SNDK1.MX", companyName: "Sandisk Corporation", quoteType: "EQUITY", market: "BMV SIC", validationStatus: "validated_yahoo_mx_alias" },
  { rawTicker: "NVDA", ticker: "NVDA", yahooSymbol: "NVDA.MX", companyName: "NVIDIA Corporation", quoteType: "EQUITY", market: "BMV SIC", validationStatus: "validated_yahoo_mx" },
  { rawTicker: "INTC", ticker: "INTC", yahooSymbol: "INTC.MX", companyName: "Intel Corporation", quoteType: "EQUITY", market: "BMV SIC", validationStatus: "validated_yahoo_mx" },
  { rawTicker: "SKHYNIX", ticker: "SKHYNIX", yahooSymbol: "000660.KS", companyName: "SK hynix Inc.", quoteType: "EQUITY", market: "Korea Exchange", validationStatus: "validated_yahoo_not_mx" },
  { rawTicker: "BB", ticker: "BB", yahooSymbol: "BB", companyName: "BlackBerry Limited", quoteType: "EQUITY", market: "NYSE", validationStatus: "validated_yahoo_not_mx" },
  { rawTicker: "MSTR", ticker: "MSTR", yahooSymbol: "MSTR.MX", companyName: "Strategy Inc", quoteType: "EQUITY", market: "BMV SIC", validationStatus: "validated_yahoo_mx" },
  { rawTicker: "BAIDU", ticker: "BAIDU", yahooSymbol: "BIDUN.MX", companyName: "Baidu, Inc.", quoteType: "EQUITY", market: "BMV SIC", validationStatus: "validated_yahoo_mx_alias" },
  { rawTicker: "TSLA", ticker: "TSLA", yahooSymbol: "TSLA.MX", companyName: "Tesla, Inc.", quoteType: "EQUITY", market: "BMV SIC", validationStatus: "validated_yahoo_mx" },
  { rawTicker: "AMD", ticker: "AMD", yahooSymbol: "AMD.MX", companyName: "Advanced Micro Devices, Inc.", quoteType: "EQUITY", market: "BMV SIC", validationStatus: "validated_yahoo_mx" },
  { rawTicker: "GOLD", ticker: "GOLD", yahooSymbol: "GC=F", companyName: "Gold Futures", quoteType: "FUTURE", market: "COMEX", validationStatus: "validated_yahoo_commodity" },
  { rawTicker: "SILVER", ticker: "SILVER", yahooSymbol: "SI=F", companyName: "Silver Futures", quoteType: "FUTURE", market: "COMEX", validationStatus: "validated_yahoo_commodity" },
  { rawTicker: "COPPER", ticker: "COPPER", yahooSymbol: "HG=F", companyName: "Copper Futures", quoteType: "FUTURE", market: "COMEX", validationStatus: "validated_yahoo_commodity" },
  { rawTicker: "META", ticker: "META", yahooSymbol: "META.MX", companyName: "Meta Platforms, Inc.", quoteType: "EQUITY", market: "BMV SIC", validationStatus: "validated_yahoo_mx" },
];

const bmvSicRows = `
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
`.trim();

function parseBmvSicRows(rows) {
  return rows.split("\n").map((line) => {
    const [ticker, yahooSymbol, companyName, sector, industry] = line.split("|");
    return {
      rawTicker: ticker,
      ticker,
      yahooSymbol,
      companyName,
      sector: sector || "Sin sector",
      industry: industry || "Sin industria",
      quoteType: "EQUITY",
      market: "BMV SIC",
      source: "Yahoo Finance Search",
      sourceDate: SOURCE_DATE,
      validationStatus: "validated_yahoo_mx",
    };
  });
}

function dedupeByTicker(items) {
  const seen = new Map();
  for (const item of items) {
    const key = item.ticker.toUpperCase();
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}

export const bmvSicUniverse = parseBmvSicRows(bmvSicRows);

export const tickerUniverse = dedupeByTicker([
  ...requestedTickers.map((item) => ({
    ...item,
    sector: item.sector || "Solicitados",
    industry: item.industry || item.quoteType,
    source: "User requested batch + Yahoo Finance Search",
    sourceDate: SOURCE_DATE,
    priority: "requested",
  })),
  ...bmvSicUniverse,
]);

export const universeMeta = {
  sourceDate: SOURCE_DATE,
  requestedCount: requestedTickers.length,
  bmvSicCount: bmvSicUniverse.length,
  totalCount: tickerUniverse.length,
  sources: ["Yahoo Finance Search", "Grupo BMV Mercado Global/SIC"],
};
