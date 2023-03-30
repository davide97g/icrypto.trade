import { ServerLog } from "icrypto.trade-types/bot";
import { TradeConfig } from "icrypto.trade-types/bot";
import { setIsLoading } from "../../services/utils";
import { getIdToken } from "../auth";
import { API, apiHost } from "../server";

const routeName = "bot";
export const BotRoutes = {
  getTradeConfig: async (): Promise<TradeConfig | null> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/config`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
  updateTradeConfig: async (config: TradeConfig) => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/${routeName}/config`,
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
      `${apiHost}/${routeName}/start`,
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
      `${apiHost}/${routeName}/stop`,
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
    return await API.get(`${apiHost}/${routeName}/info`, {
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
  startLogs: async () => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/${routeName}/logs/start`,
      {},
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then(
        (res) =>
          res.data as {
            message: string;
            ok: boolean;
          }
      )
      .catch((err) => console.log(err))
      .finally(() => setIsLoading(false));
  },
  getLogs: async () => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/logs`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data as ServerLog[])
      .catch((err) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
};
