import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  QueryFieldFilterConstraint,
  setDoc,
  where,
} from "firebase/firestore";
import { set, get, ref } from "firebase/database";
import "firebase/auth";
import { db, rtdb } from "../config/firebase";
import { MyTrade } from "../models/binance";
import { GoodFeedItem, GoodFeedItemStatus, User } from "../models/database";
import { TradeConfig } from "../models/bot";

export const DataBaseClient = {
  Account: {
    get: async (userId: string) => {
      const querySnapshot = await getDoc(doc(db, `users/${userId}`));
      return querySnapshot.data() as User;
    },
    update(userId: string, data: any) {
      return setDoc(doc(db, `users/${userId}`), data, { merge: true });
    },
  },
  GoodFeedItem: {
    get: async (time?: number) => {
      const q = query(collection(db, "news"), where("time", ">", time || 0));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data()) as GoodFeedItem[];
    },
    getById: async (id: string) => {
      const querySnapshot = await getDoc(doc(db, "news", id));
      return querySnapshot.data() as GoodFeedItem;
    },
    update: async (feed: GoodFeedItem[]) => {
      await Promise.all(
        feed.map((item) =>
          DataBaseClient.GoodFeedItem.updateById(item._id, item)
        )
      ).catch((err) => {
        console.log(err);
        return false;
      });
      return true;
    },
    updateById: async (id: string, news: GoodFeedItem) => {
      await setDoc(doc(db, "news", id), news);
    },
    updateStatus: async (id: string, status: GoodFeedItemStatus) => {
      await setDoc(doc(db, "news", id), { status }, { merge: true });
    },
    delete: async (news: GoodFeedItem[]) => {
      await Promise.all(
        news.map((item) => DataBaseClient.GoodFeedItem.deleteById(item._id))
      ).catch((err) => {
        console.log(err);
        return false;
      });
      return true;
    },
    deleteById: async (id: string) => {
      await deleteDoc(doc(db, "news", id));
    },
  },
  Trade: {
    get: async (options?: { time?: number; symbol?: string }) => {
      const contraints: QueryFieldFilterConstraint[] = [];
      if (options?.time) contraints.push(where("time", ">", options.time));
      if (options?.symbol)
        contraints.push(where("symbol", "==", options.symbol));
      const q = query(collection(db, "trades"), ...contraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data()) as MyTrade[];
    },
    getById: async (id: string): Promise<MyTrade | null> => {
      const querySnapshot = await getDoc(doc(db, "trades", id));
      return querySnapshot.data() as MyTrade;
    },
    add: async (trade: MyTrade) => {
      await setDoc(doc(db, "trades", String(trade.id)), trade).catch((err) => {
        console.log(err);
        return false;
      });
      return true;
    },
    insertMany: async (trades: MyTrade[]) => {
      await Promise.all(
        trades.map((item) => setDoc(doc(db, "trades", String(item.id)), item))
      ).catch((err) => {
        console.log(err);
        return false;
      });
      return true;
    },
  },
  Bot: {
    getTradeConfig: async (): Promise<TradeConfig | null> => {
      try {
        return await get(ref(rtdb, "tradeConfig"))
          .then((snapshot) => {
            if (snapshot.exists()) {
              return snapshot.val() as TradeConfig;
            } else {
              console.log("No data available");
              return null;
            }
          })
          .catch((error) => {
            console.error(error);
            throw new Error("Could not get trade config");
          });
      } catch (err) {
        console.log(err);
        throw new Error("Could not get trade config");
      }
    },
    updateTradeConfig: async (config: TradeConfig) => {
      try {
        await set(ref(rtdb, "tradeConfig"), config).catch((err) => {
          console.log(err);
          return false;
        });
        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    },
  },
  Symbols: {
    banned: [] as { symbol: string }[],
    getBanned: async (avoidCache?: boolean): Promise<{ symbol: string }[]> => {
      if (DataBaseClient.Symbols.banned.length && !avoidCache) {
        console.info(
          `✨ using cached ${DataBaseClient.Symbols.banned.length} banned tokens`
        );
        return DataBaseClient.Symbols.banned;
      }
      const querySnapshot = await getDocs(collection(db, "bannedTokens"));
      const banned = querySnapshot.docs.map((doc) => doc.data()) as {
        symbol: string;
      }[];
      DataBaseClient.Symbols.banned = banned; // save for next time
      return banned;
    },
  },
};
