import { BinanceError, MyTrade } from "../../models/binance";
import { ExchangeInfo } from "../../models/account";
import { setIsLoading } from "../../services/utils";
import { getIdToken } from "../auth";
import { API, apiHost } from "../server";

const routeName = "trades";
export const TradesRoutes = {
  getExchangeInfo: async () => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/exchange-info`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data as ExchangeInfo)
      .catch((err: BinanceError) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  get: async (symbol: string, time?: number): Promise<MyTrade[]> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/${symbol}/`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
      params: {
        time,
      },
    })
      .then((res) => res.data)
      .catch((err) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  getById: async (symbol: string, orderId: string): Promise<MyTrade[]> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/${symbol}/${orderId}/`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  getBinance: async (symbol: string, time?: number): Promise<MyTrade[]> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/${symbol}/binance`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
      params: {
        time,
      },
    })
      .then((res) => res.data)
      .catch((err) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  getBinanceById: async (
    symbol: string,
    orderId: string
  ): Promise<MyTrade[]> => {
    setIsLoading(true);
    return await API.get(
      `${apiHost}/${routeName}/${symbol}/${orderId}/binance`,
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then((res) => res.data)
      .catch((err) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
};
