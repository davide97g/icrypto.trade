import { Router } from "express";
import { DataBaseClient } from "../connections/database";
import {
  checkIfAdmin,
  checkIfAuthenticated,
} from "../middlewares/auth-middleware";
import { TradeConfig } from "../models/bot";
import { getWS, startWebSockets, stopWebSockets } from "../services/bot/bot";
import { getHerokuLogs, startHerokuLogs } from "../services/bot/logs";
import { getCircularReplacer } from "../utils/utils";

const router = Router();

router.get("/info", checkIfAuthenticated, async (req, res) => {
  const wsInfo = getWS();
  res.send(JSON.stringify(wsInfo, getCircularReplacer()));
});

router.post("/logs/start", checkIfAdmin, async (req, res) => {
  await startHerokuLogs()
    .then(() => res.send({ message: "Logs started", ok: true }))
    .catch((err) => res.status(500).send(err));
});

router.get("/logs", checkIfAuthenticated, async (req, res) => {
  await getHerokuLogs()
    .then((logs) => res.send(logs))
    .catch((err) => res.status(500).send(err));
});

router.post("/start", checkIfAdmin, async (req, res) => {
  try {
    const resStart = await startWebSockets();
    res.status(200).send(resStart);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/stop", checkIfAdmin, async (req, res) => {
  try {
    const resStop = stopWebSockets();
    res.status(200).send(resStop);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get("/config", checkIfAdmin, async (req, res) => {
  const config = await DataBaseClient.Bot.getTradeConfig();
  if (!config) res.status(404).send("No config found");
  res.send(config);
});

router.post("/config", checkIfAdmin, async (req, res) => {
  const config: TradeConfig = req.body.config;
  await DataBaseClient.Bot.updateTradeConfig(config)
    .then((response: any) => res.send(response))
    .catch((error: any) => {
      const response = JSON.stringify(error.response, getCircularReplacer());
      res.status(500).send(response);
    });
});

export default router;
