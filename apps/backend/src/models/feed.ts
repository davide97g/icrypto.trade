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

export type ProspectOrderStatus = "prospect" | "error" | "linked" | "ignored";

export interface News extends FeedItem {
  orderId?: number;
  orderStatus?: ProspectOrderStatus;
}
