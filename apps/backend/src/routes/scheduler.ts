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

export default router;
