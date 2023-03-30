import { BinanceError } from "icrypto.trade-types/binance";
import {
  BinanceOrderDetails,
  BinanceOrderResponse,
  BinanceOCOOrder,
  NewOCOOrderRequest,
  NewOrderRequest,
} from "icrypto.trade-types/orders";
import { setIsLoading } from "../../services/utils";
import { getIdToken } from "../auth";
import { API, apiHost } from "../server";

const routeName = "orders";
export const OrdersRoutes = {
  get: async (symbol: string): Promise<BinanceOrderDetails[]> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/${symbol}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  getById: async (
    symbol: string,
    orderId: string
  ): Promise<BinanceOrderDetails> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/${symbol}/${orderId}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  cancel: async (symbol: string, orderId: string) => {
    setIsLoading(true);
    return await API.delete(`${apiHost}/${routeName}/${symbol}/${orderId}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data as BinanceOrderResponse)
      .catch((err: BinanceError) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  cancelAll: async (symbol: string): Promise<BinanceOrderResponse[] | null> => {
    setIsLoading(true);
    return await API.delete(`${apiHost}/${routeName}/${symbol}/all`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err: BinanceError) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  sellAll: async (symbol: string): Promise<BinanceOrderResponse | null> => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/${routeName}/${symbol}/sell-all`,
      {},
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
  addSymbolToNews: async (symbol: string, newsId: string) => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/${routeName}/add-symbol`,
      {
        symbol,
        newsId,
      },
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then((res) => res.data as BinanceOrderResponse)
      .catch((err: BinanceError) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  newOrder: async (order: NewOrderRequest) => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/${routeName}/${order.symbol}/new`,
      { order },
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
  getOCO: async (symbol: string): Promise<BinanceOCOOrder[]> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/${symbol}/oco`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  getByIdOCO: async (
    symbol: string,
    orderListId: string
  ): Promise<BinanceOCOOrder> => {
    setIsLoading(true);
    return await API.get(
      `${apiHost}/${routeName}/${symbol}/${orderListId}/oco`,
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
  cancelOCO: async (symbol: string, orderListId: string) => {
    setIsLoading(true);
    return await API.delete(
      `${apiHost}/${routeName}/${symbol}/${orderListId}/oco`,
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then((res) => res.data as BinanceOCOOrder)
      .catch((err: BinanceError) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  newOrderOCO: async (orderOCO: NewOCOOrderRequest) => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/${routeName}/${orderOCO.symbol}/new/oco`,
      { orderOCO },
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
};
