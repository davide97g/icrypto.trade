import { Router } from "express";
import { DataBaseClient } from "../connections/database";
import { checkIfAuthenticated } from "../middlewares/auth-middleware";
import {
  extractSymbolsFromTitle,
  getCleanTokens,
  removeBannedSymbols,
} from "../services/symbols";

const router = Router();

router.post("/extract", checkIfAuthenticated, async (req, res) => {
  const text = (req.body.text as string) || "";
  if (!text) return res.status(400).send("Text is required");
  const bannedTokens = await DataBaseClient.Symbols.getBanned();
  const symbols = extractSymbolsFromTitle(text);
  const cleanSymbols = removeBannedSymbols(symbols, bannedTokens);
  res.send(cleanSymbols);
});

router.get("/banned", checkIfAuthenticated, async (req, res) => {
  const tokens = getCleanTokens();
  res.send(tokens);
});

export default router;
