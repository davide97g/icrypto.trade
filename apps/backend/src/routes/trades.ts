import { Router } from "express";
import { checkIfAdmin } from "../middlewares/auth-middleware";
import { NewOrderRequest } from "icrypto.trade-types/orders";
import { getExchangeInfo } from "../services/binance/market";
import {
  getBinanceTrades,
  getBinanceTradesByOrderId,
} from "../services/binance/trade";
import { newOrder } from "../services/orders";
import { getTradeById, getTrades } from "../services/trades";
import { getCircularReplacer } from "../utils/utils";

const router = Router();

router.get("/exchange-info", checkIfAdmin, async (req, res) => {
  const exchangeInfo = await getExchangeInfo().catch((error: any) => {
    const status = (error.response as any)?.status || 500;
    const response = JSON.stringify(error.response, getCircularReplacer());
    res.status(status).send(response);
  });
  res.send(exchangeInfo);
});

router.post("/new-order", checkIfAdmin, async (req, res) => {
  const orderRequest: NewOrderRequest = req.body.order;
  if (!orderRequest) return res.status(400).send("Empty order");
  if (!orderRequest.symbol) return res.status(400).send("symbol is required");
  if (!orderRequest.side) return res.status(400).send("side is required");
  await newOrder(orderRequest)
    .then((order) => {
      // TODO: save trade in database
      res.send(order);
    })
    .catch((error: any) => {
      const response = JSON.stringify(error, getCircularReplacer());
      res.status(500).send(response);
    });
});

router.get("/:symbol", checkIfAdmin, async (req, res) => {
  const symbol = (req.params.symbol as string) || "";
  const time = parseInt(req.query.time as string) || 0;
  if (!symbol) return res.status(400).send("symbol is required");
  await getTrades({ symbol, time })
    .then((response: any) => res.send(response))
    .catch((error: any) => res.status(500).send(error));
});

router.get("/:symbol/binance", checkIfAdmin, async (req, res) => {
  const symbol = (req.params.symbol as string) || "";
  if (!symbol) return res.status(400).send("symbol is required");
  await getBinanceTrades(symbol)
    .then((response: any) => res.send(response))
    .catch((error: any) => res.status(500).send(error));
});

router.get("/:symbol/:orderId", checkIfAdmin, async (req, res) => {
  const orderId = (req.params.orderId as string) || "";
  if (!orderId) return res.status(400).send("orderId is required");
  await getTradeById(orderId)
    .then((response) => {
      res.send(response);
    })
    .catch((error: any) => res.status(500).send(error));
});

router.get("/:symbol/:orderId/binance", checkIfAdmin, async (req, res) => {
  const orderId = parseInt(req.params.orderId as string) || 0;
  const symbol = (req.params.symbol as string) || "";
  if (!orderId) return res.status(400).send("orderId is required");
  if (!symbol) return res.status(400).send("symbol is required");
  await getBinanceTradesByOrderId(symbol, orderId)
    .then((response) => res.send(response))
    .catch((error: any) => res.status(500).send(error));
});

export default router;
