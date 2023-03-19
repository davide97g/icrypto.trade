import { FeedItem } from "./feed";

export interface User {
  id: string;
  email: string;
  notifications: {
    email: boolean;
    telegram: boolean;
  };
  telegramChatId: string;
  displayName: string;
  photoURL: string;
  admin: boolean;
}

export type GoodFeedItemStatus =
  | "missing" // ? no symbols guess available
  | "unavailable" // ? guess available but no match with the current tradable symbols on brokers (e.i. Binance)
  | "pending" // ? still waiting for market order to be filled and oco order to be created (the news is already saved in DB)
  | "ignore" // ? manually ignored by admin with FE interface
  | "market-error" // ? error while creating market order
  | "oco-error" // ? error while creating oco order (market order was created)
  | "success"; // ? market order and oco order were created successfully

export interface GoodFeedItem extends FeedItem {
  orderId?: number;
  status?: GoodFeedItemStatus;
}

export interface Trade {
  symbol: string;
  id: number;
  orderId: number;
  orderListId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
}
