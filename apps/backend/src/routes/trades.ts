import { Router } from "express";
import { DataBaseClient } from "../connections/database";
import { checkIfAdmin } from "../middlewares/auth-middleware";
import { NewOrderRequest } from "../models/transactions";
import {
  getAccount,
  getExchangeInfo,
  getTransactionById,
  getTransactions,
  newTransaction,
} from "../services/transactions";
import { getCircularReplacer } from "../utils/utils";

const router = Router();

router.get("/account", checkIfAdmin, async (req, res) => {
  const account = await getAccount();
  res.send(account);
});

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
  setTimeout(async () => {
    const order = await newTransaction(orderRequest).catch((error: any) => {
      const status = (error.response as any).status;
      const response = JSON.stringify(error.response, getCircularReplacer());
      res.status(status).send(response);
    });
    if (order && order.transaction) {
      const responseAddTransaction = await DataBaseClient.Transaction.add(
        order.transaction
      );
      res.send({ order, savedDB: responseAddTransaction });
    }
  }, 1000);
});

router.get("/", checkIfAdmin, async (req, res) => {
  const time = parseInt(req.query.time as string) || 0;
  await getTransactions(time)
    .then((response: any) => res.send(response))
    .catch((error: any) => res.status(500).send(error));
});

router.get("/:symbol/:orderId", checkIfAdmin, async (req, res) => {
  const orderId = (req.params.orderId as string) || "";
  const symbol = (req.params.symbol as string) || "";
  if (!orderId) return res.status(400).send("orderId is required");
  if (!symbol) return res.status(400).send("symbol is required");
  await getTransactionById(symbol, orderId)
    .then((response) => res.send(response))
    .catch((error: any) => res.status(500).send(error));
});

export default router;
