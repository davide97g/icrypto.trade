import { WebSocket } from "ws";
import { NewOCOOrderRequest } from "icrypto.trade-types/orders";
import { ExchangeInfoSymbol } from "icrypto.trade-types/account";
export interface KlineWS {
  e: string;
  E: number;
  s: string;
  k: {
    t: number;
    T: number;
    s: string;
    i: string;
    f: number;
    L: number;
    o: string;
    c: string;
    h: string;
    l: string;
    v: string;
    n: number;
    x: boolean;
    q: string;
    V: string;
    Q: string;
    B: string;
  };
}

export interface Kline {
  startTime: number;
  closeTime: number;
  symbol: string;
  interval: string;
  firstTradeId: number;
  lastTradeId: number;
  openPrice: string;
  closePrice: string;
  highPrice: string;
  lowPrice: string;
  baseAssetVolume: string;
  numberOfTrades: number;
  isKlineClosed: boolean;
  quoteAssetVolume: string;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

export interface KlineRecord {
  openTime: number;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

export interface KlineData {
  eventType: string;
  eventTime: number;
  symbol: string;
  kline: Kline;
}

export type BinanceInterval =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d"
  | "3d"
  | "1w"
  | "1M";

/**
 * @param lastPrice prezzo di mercato disponibile. Se non c’è direttamente, media tra prezzi bid e ask
 * @param lastMove differenza percentuale del prezzo tra la candela attuale e la candela precedente. Su Binance si chiama *change*
 * @param lastVolume volume della candela attuale (baseAssetVolume | quoteAssetVolume)
 * @param averageMoveSinceOpenList lista della media movimenti candele 1 minuto a partire dalla candela del minuto dove è uscita la news) Penso l’ideale sarebbe un array e ad ogni minuto aggiunge un nuovo elemento
 * @param averageVolumeSinceOpenList lista della media volumi candele 1 minuto a partire dalla candela del minuto dove è uscita la news) Penso l’ideale sarebbe un array e ad ogni minuto aggiunge un nuovo elemento. In questo modo: *open_volume* = *average_volume_since_open* [0]
 * @param maxPriceSinceOpen massimo prezzo raggiunto dalla candela a 1 minuto dal minuto della news
 * @param minPriceSinceOpen minimo prezzo raggiunto dalla candela a 1 minuto dal minuto della news
 */

export interface StrategyVariableStats {
  eventTime: number;
  likes: number;
  dislikes: number;
  lastPrice: number;
  lastMove: number;
  lastVolume: number;
  maxPriceSinceOpen: number;
  minPriceSinceOpen: number;
  averageMoveSinceOpenList: number[];
  averageVolumeSinceOpenList: number[];
}

/**
 * @param openPrice prezzo di esecuzione dell’ordine iniziale, quello di acquisto dovuto alla news
 * @param openVolume volume della candela a 1 minuto nel minuto della news
 * @param averageMove media nelle ultime 24 ore dei movimenti nelle candele a 1 minuto. Supponiamo costante
 * @param averageVolume media nelle ultime 24 ore dei volumi nelle candele a 1 minuto. Supponiamo costante
 *
 */
export interface StrategyConstantStats {
  openPrice: number; // constant
  openVolume: number; // constant
  averageMove: number; // constant
  averageVolume: number; // constant
}

/**
 * @param constant dati costanti
 * @param variable dati variabili
 */
export interface StrategyStats {
  constant: StrategyConstantStats;
  variable: StrategyVariableStats;
}

/**
 * @param wsRef riferimento al websocket
 * @param newsId id della news
 * @param exchangeInfoSymbol dati della coppia di valute
 * @param lastOrderListId id dell’ultimo ordine
 * @param lastOcoOrderRequest ultima richiesta di ordine
 * @param lastOcoOrderTime timestamp dell’ultimo ordine
 * @param data dati delle candele da dopo il market buy
 * @param history storico delle candele (anche da prima della news, per la precisione 1k minuti prima del market buy)
 * @param stats statistiche utili per la strategia
 */
export interface Strategy {
  wsRef: WebSocket;
  newsId?: string;
  exchangeInfoSymbol: ExchangeInfoSymbol;
  lastOrderListId: number;
  lastOcoOrderRequest: NewOCOOrderRequest;
  lastOcoOrderTime: number;
  data: Kline[];
  history: KlineRecord[];
  stats: StrategyStats;
}
