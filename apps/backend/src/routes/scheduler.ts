import { Router } from "express";
import { DataBaseClient } from "../connections/database";
import {
  checkIfAdmin,
  checkIfAuthenticated,
} from "../middlewares/auth-middleware";
import { TradeConfig } from "../models/transactions";
import {
  getSchedulerStatus,
  startScheduler,
  stopScheduler,
  updateTradeConfig,
} from "../services/scheduler";
import { getCircularReplacer } from "../utils/utils";

const router = Router();

router.get("/", checkIfAuthenticated, async (req, res) => {
  try {
    const response = getSchedulerStatus();
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/start", checkIfAdmin, async (req, res) => {
  try {
    const response = await startScheduler();
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/stop", checkIfAdmin, async (req, res) => {
  try {
    const response = stopScheduler();
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get("/config", checkIfAdmin, async (req, res) => {
  const config = await DataBaseClient.Scheduler.getTradeConfig();
  res.send(config);
});

router.post("/config", checkIfAdmin, async (req, res) => {
  const config: TradeConfig = req.body.config;
  await DataBaseClient.Scheduler.updateTradeConfig(config)
    .then((response: any) => {
      updateTradeConfig(config);
      res.send(response);
    })
    .catch((error: any) => {
      const status = (error.response as any).status;
      const response = JSON.stringify(error.response, getCircularReplacer());
      res.status(status).send(response);
    });
});

export default router;
