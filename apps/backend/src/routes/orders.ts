import { Router } from "express";
import { checkIfAdmin } from "../middlewares/auth-middleware";
import { BinanceErrorData } from "icrypto.trade-types/binance";
import {
  NewOCOOrderRequest,
  NewOrderRequest,
} from "icrypto.trade-types/orders";
import { getExchangeInfoSymbol } from "../services/binance/market";
import {
  cancelAllOpenOrders,
  cancelOCOOrder,
  cancelOrder,
  createOrder,
  getOCOOrder,
  getOpenOCOOrders,
  newOrder,
  openOrders,
  getOrder,
  sellAll,
  newOCOOrder,
} from "../services/orders";
import { subscribeSymbolTrade } from "../services/trades";
import { startStrategy } from "../services/trading/strategy";

const router = Router();

router.post("/add-symbol/", checkIfAdmin, async (req, res) => {
  const symbol = (req.body.symbol as string) || "";
  if (!symbol) return res.status(400).send("Symbol is required");
  const newsId = (req.body.newsId as string) || "";
  if (!newsId) return res.status(400).send("News Id is required");
  await createOrder(symbol, newsId)
    .then((response) => res.send(response))
    .catch((error: BinanceErrorData) => res.status(500).send(error));
});

router.get("/:symbol", checkIfAdmin, async (req, res) => {
  const symbol = req.params.symbol;
  if (!symbol) return res.status(400).send("Symbol is required");
  await openOrders(symbol)
    .then((response: any) => res.send(response))
    .catch((error: BinanceErrorData) => res.status(500).send(error));
});

router.delete("/:symbol/all", checkIfAdmin, async (req, res) => {
  const symbol = (req.params.symbol as string) || "";
  if (!symbol) return res.status(400).send("Symbol is required");
  await cancelAllOpenOrders(symbol)
    .then((response) => res.send(response))
    .catch((error: BinanceErrorData) => res.status(500).send(error));
});

router.post("/:symbol/new/", checkIfAdmin, async (req, res) => {
  const symbol = (req.params.symbol as string) || "";
  if (!symbol) return res.status(400).send("Symbol is required");
  const orderRequest = req.body.order as NewOrderRequest;
  await newOrder(orderRequest)
    .then((response) => res.send(response))
    .catch((error: BinanceErrorData) => res.status(500).send(error));
});

router.post("/:symbol/new/oco", checkIfAdmin, async (req, res) => {
  const symbol = (req.params.symbol as string) || "";
  if (!symbol) return res.status(400).send("Symbol is required");
  const orderRequest = req.body.orderOCO as NewOCOOrderRequest;
  await newOCOOrder(orderRequest)
    .then(async (response) => {
      const ocoOrder = response;
      const exchangeInfoSymbol = await getExchangeInfoSymbol(
        orderRequest.symbol
      );
      subscribeSymbolTrade(
        orderRequest.symbol,
        ocoOrder.orders.map((o) => o.orderId)
      );
      startStrategy(
        ocoOrder.symbol,
        exchangeInfoSymbol,
        orderRequest,
        ocoOrder.orderListId,
        Date.now()
      );
      res.send(ocoOrder);
    })
    .catch((error: BinanceErrorData) => res.status(500).send(error));
});

router.get("/:symbol/oco", checkIfAdmin, async (req, res) => {
  const symbol = req.params.symbol;
  if (!symbol) return res.status(400).send("Symbol is required");
  await getOpenOCOOrders()
    .then((response: any) => res.send(response))
    .catch((error: BinanceErrorData) => res.status(500).send(error));
});

router.post("/:symbol/sell-all", checkIfAdmin, async (req, res) => {
  const symbol = (req.params.symbol as string) || "";
  if (!symbol) return res.status(400).send("Symbol is required");
  await sellAll(symbol)
    .then((response) => res.send(response))
    .catch((error: BinanceErrorData) => res.status(500).send(error));
});

router.delete("/:symbol/:orderId", checkIfAdmin, async (req, res) => {
  const orderId = (req.params.orderId as string) || "";
  const symbol = (req.params.symbol as string) || "";
  if (!orderId) return res.status(400).send("Order Id is required");
  if (!symbol) return res.status(400).send("Symbol is required");
  await cancelOrder(symbol, orderId)
    .then((response) => res.send(response))
    .catch((error: BinanceErrorData) => res.status(500).send(error));
});

router.delete("/:symbol/:orderListId/oco", checkIfAdmin, async (req, res) => {
  const orderListId = parseInt(req.params.orderListId || "0");
  const symbol = (req.params.symbol as string) || "";
  if (!orderListId) return res.status(400).send("Order List Id is required");
  if (!symbol) return res.status(400).send("Symbol is required");
  await cancelOCOOrder(symbol, orderListId)
    .then((response) => res.send(response))
    .catch((error: BinanceErrorData) => res.status(500).send(error));
});

router.get("/:symbol/:orderId", checkIfAdmin, async (req, res) => {
  const orderId = (req.params.orderId as string) || "";
  const symbol = (req.params.symbol as string) || "";
  if (!orderId) return res.status(400).send("Order Id is required");
  if (!symbol) return res.status(400).send("Symbol is required");
  await getOrder(symbol, orderId)
    .then((response: any) => res.send(response))
    .catch((error: BinanceErrorData) => res.status(500).send(error));
});

router.get("/:symbol/:orderListId/oco", checkIfAdmin, async (req, res) => {
  const orderListId = (req.params.orderListId as string) || "";
  const symbol = (req.params.symbol as string) || "";
  if (!orderListId) return res.status(400).send("Order List Id is required");
  if (!symbol) return res.status(400).send("Symbol is required");
  await getOCOOrder(orderListId)
    .then((response: any) => res.send(response))
    .catch((error: BinanceErrorData) => res.status(500).send(error));
});

export default router;
