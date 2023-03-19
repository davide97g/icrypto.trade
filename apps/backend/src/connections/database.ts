import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { set, get, ref } from "firebase/database";
import "firebase/auth";
import { News, NewsStatus } from "../models/feed";
import { TradeConfig, Transaction } from "../models/transactions";
import { db, rtdb } from "../config/firebase";
import { MyTrade } from "../models/binance";
import { ICryptoTradeUser } from "../models/database";

export const DataBaseClient = {
  Account: {
    get: async (userId: string) => {
      const querySnapshot = await getDoc(doc(db, `users/${userId}`));
      return querySnapshot.data() as ICryptoTradeUser;
    },
    update(userId: string, data: any) {
      return setDoc(doc(db, `users/${userId}`), data, { merge: true });
    },
  },
  News: {
    get: async (time?: number) => {
      const q = query(collection(db, "news"), where("time", ">", time || 0));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data()) as News[];
    },
    getById: async (id: string) => {
      const querySnapshot = await getDoc(doc(db, "news", id));
      return querySnapshot.data() as News;
    },
    update: async (feed: News[]) => {
      await Promise.all(
        feed.map((item) => DataBaseClient.News.updateById(item._id, item))
      ).catch((err) => {
        console.log(err);
        return false;
      });
      return true;
    },
    updateById: async (id: string, news: News) => {
      await setDoc(doc(db, "news", id), news);
    },
    updateStatus: async (id: string, status: NewsStatus) => {
      await setDoc(doc(db, "news", id), { status }, { merge: true });
    },
    delete: async (news: News[]) => {
      await Promise.all(
        news.map((item) => DataBaseClient.News.deleteById(item._id))
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
  Transaction: {
    get: async (time?: number) => {
      const q = time
        ? query(
            collection(db, "transactions"),
            where("transactTime", ">", time)
          )
        : query(collection(db, "transactions"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data()) as Transaction[];
    },
    getById: async (id: string): Promise<Transaction | null> => {
      const querySnapshot = await getDoc(doc(db, "transactions", id));
      return querySnapshot.data() as Transaction;
    },
    add: async (transaction: Transaction) => {
      await setDoc(
        doc(db, "transactions", String(transaction.orderId)),
        transaction
      ).catch((err) => {
        console.log(err);
        return false;
      });
      return true;
    },
    update: async (transactions: Transaction[]) => {
      await Promise.all(
        transactions.map((item) =>
          setDoc(doc(db, "transactions", String(item.orderId)), item)
        )
      ).catch((err) => {
        console.log(err);
        return false;
      });
      return true;
    },
  },
  Trade: {
    get: async (time?: number) => {
      const q = time
        ? query(collection(db, "trades"), where("time", ">", time))
        : query(collection(db, "trades"));
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
  Scheduler: {
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
  Token: {
    bannedTokens: [] as { symbol: string }[],
    getBannedTokens: async (
      avoidCache?: boolean
    ): Promise<{ symbol: string }[]> => {
      if (DataBaseClient.Token.bannedTokens.length && !avoidCache) {
        console.info(
          `✨ using cached ${DataBaseClient.Token.bannedTokens.length} banned tokens`
        );
        return DataBaseClient.Token.bannedTokens;
      }
      const querySnapshot = await getDocs(collection(db, "bannedTokens"));
      const bannedTokens = querySnapshot.docs.map((doc) => doc.data()) as {
        symbol: string;
      }[];
      DataBaseClient.Token.bannedTokens = bannedTokens; // save for next time
      return bannedTokens;
    },
  },
};
