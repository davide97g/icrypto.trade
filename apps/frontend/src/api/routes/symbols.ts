import { Kline } from "../../models/trade";
import { setIsLoading } from "../../services/utils";
import { getIdToken } from "../auth";
import { API, apiHost } from "../server";

export const SymbolsRoutes = {
  get: async (): Promise<Symbol[] | null> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/token`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
  extract: async (text: string): Promise<string[]> => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/symbols/extract`,
      {
        text,
      },
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
  getKlines: async (
    symbol: string,
    interval?: string,
    startTime?: number,
    endTime?: number
  ): Promise<Kline[]> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/symbols/klines/${symbol}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
  getAverageMove24h: async (
    symbol: string,
    limit?: number
  ): Promise<number> => {
    setIsLoading(true);
    return await API.get(
      `${apiHost}/symbols/klines/${symbol}/average-move-24h`,
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
        params: {
          limit,
        },
      }
    )
      .then((res) => res.data.averageMove24h)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
};
