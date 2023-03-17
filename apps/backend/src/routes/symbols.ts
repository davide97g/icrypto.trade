import { Router } from "express";
import { DataBaseClient } from "../connections/database";
import { checkIfAuthenticated } from "../middlewares/auth-middleware";
import { KlineInterval } from "../models/transactions";
import {
  extractSymbolsFromTitle,
  getAverageMove24h,
  getCleanTokens,
  getKlines,
  removeBannedSymbols,
} from "../services/symbols";

const router = Router();

router.post("/extract", checkIfAuthenticated, async (req, res) => {
  const text = (req.body.text as string) || "";
  if (!text) return res.status(400).send("Text is required");
  const bannedTokens = await DataBaseClient.Token.getBannedTokens();
  const symbols = extractSymbolsFromTitle(text);
  const cleanSymbols = removeBannedSymbols(symbols, bannedTokens);
  res.send(cleanSymbols);
});

router.get("/klines/:symbol", checkIfAuthenticated, async (req, res) => {
  const symbol = req.params.symbol;
  if (!symbol) return res.status(400).send("Symbol is required");
  const interval = (req.query.time as KlineInterval) || "1s";
  const startTime = parseInt(req.query.startTime as string) || 0;
  const endTime = parseInt(req.query.endTime as string) || 0;
  const limit = parseInt(req.query.limit as string) || 500;
  const klines = await getKlines(
    symbol,
    interval,
    limit,
    startTime,
    endTime
  ).catch((err) => {
    console.log(err);
    res.status(500).send({ error: "Could not get klines" });
  });
  res.send(klines);
});

router.get(
  "/klines/:symbol/average-move-24h",
  checkIfAuthenticated,
  async (req, res) => {
    const symbol = req.params.symbol;
    if (!symbol) return res.status(400).send("Symbol is required");
    const limit = parseInt(req.query.limit as string) || 500;
    const averageMove24h = await getAverageMove24h(symbol, limit).catch(
      (err) => {
        console.log(err);
        res.status(500).send({ error: "Could not get klines" });
      }
    );
    res.send({ averageMove24h });
  }
);

router.get("/banned", checkIfAuthenticated, async (req, res) => {
  const tokens = getCleanTokens();
  res.send(tokens);
});

export default router;
