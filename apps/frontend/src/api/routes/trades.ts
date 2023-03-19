import { BinanceError } from "../../models/binance";
import { BinanceOrderDetails } from "../../models/orders";
import { ExchangeInfo, Transaction } from "../../models/trade";
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
  get: async (options?: { time?: number }): Promise<Transaction[] | null> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
      params: {
        time: options?.time,
      },
    })
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
  getById: async (
    symbol: string,
    orderId: string
  ): Promise<BinanceOrderDetails | null> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/${symbol}/${orderId}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
};
