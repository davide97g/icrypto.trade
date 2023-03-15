export interface FeedItem {
  _id: string;
  source: "Blogs" | "Twitter" | "Terminal";
  title: string;
  url: string;
  icon: string;
  image: string;
  time: number;
  info: {
    twitterId: string;
    isReply: boolean;
    isRetweet: boolean;
    isQuote: boolean;
  };
  likes: number;
  dislikes: number;
  symbols: string[];
  symbolsGuess: string[];
  matchFound: boolean;
  en: string;
  firstPrice: any;
  percent1m: any;
  percent5m: any;
  percent1h: any;
}

export type NewsStatus =
  | "missing" // ? no symbols guess available
  | "unavailable" // ? guess available but no match with the current tradable symbols on brokers (e.i. Binance)
  | "pending" // ? still waiting for market order to be filled and oco order to be created (the news is already saved in DB)
  | "ignore" // ? manually ignored by admin with FE interface
  | "market-error" // ? error while creating market order
  | "oco-error" // ? error while creating oco order (market order was created)
  | "success"; // ? market order and oco order were created successfully

export interface News extends FeedItem {
  orderId?: number;
  status?: NewsStatus;
}
