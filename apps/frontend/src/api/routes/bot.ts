import { TradeConfig } from "../../models/trade";
import { setIsLoading } from "../../services/utils";
import { getIdToken } from "../auth";
import { API, apiHost } from "../server";

export const BotRoutes = {
  getTradeConfig: async (): Promise<TradeConfig | null> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/bot/config`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
  updateTradeConfig: async (config: TradeConfig) => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/scheduler/config`,
      { config },
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
  start: async () => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/websocket/start`,
      {},
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then(
        (res) =>
          res.data as {
            message: string;
          }
      )
      .catch((err) => console.log(err))
      .finally(() => setIsLoading(false));
  },
  stop: async () => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/websocket/stop`,
      {},
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then((res) => res.data as { message: string })
      .catch((err) => console.log(err))
      .finally(() => setIsLoading(false));
  },
  get: async () => {
    setIsLoading(true);
    return await API.get(`${apiHost}/websocket/info`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then(
        (res) =>
          res.data as {
            startTime: number;
            isRunning: boolean;
          }
      )
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
};
