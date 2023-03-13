import { Router } from "express";
import { checkIfAdmin } from "../middlewares/auth-middleware";
import { BinanceErrorData } from "../models/binance";
import {
  cancelAllOpenOrders,
  cancelOrder,
  createOrder,
  getOpenOrders,
  getTrades,
  sellAll,
} from "../services/orders";

const router = Router();

router.get("/:symbol", checkIfAdmin, async (req, res) => {
  const symbol = req.params.symbol;
  if (!symbol) return res.status(400).send("Symbol is required");
  await getOpenOrders(symbol)
    .then((response: any) => res.send(response))
    .catch((error: BinanceErrorData) => res.status(500).send(error));
});

router.get("/:symbol/trades", checkIfAdmin, async (req, res) => {
  const symbol = req.params.symbol;
  if (!symbol) return res.status(400).send("Symbol is required");
  await getTrades(symbol)
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

router.post("/create/", checkIfAdmin, async (req, res) => {
  const symbol = (req.body.symbol as string) || "";
  if (!symbol) return res.status(400).send("Symbol is required");
  const newsId = (req.body.newsId as string) || "";
  if (!newsId) return res.status(400).send("News Id is required");
  await createOrder(symbol, newsId)
    .then((response) => res.send(response))
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

export default router;
