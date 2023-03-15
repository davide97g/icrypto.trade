import { Router } from "express";
import {
  checkIfAdmin,
  checkIfAuthenticated,
} from "../middlewares/auth-middleware";
import {
  getWS,
  getWsFeed,
  startWebSockets,
  stopWebSockets,
} from "../services/websocket";
import { getCircularReplacer } from "../utils/utils";

const router = Router();

router.get("/feed", checkIfAuthenticated, async (req, res) => {
  const wsFeed = getWsFeed();
  res.send(JSON.stringify(wsFeed, getCircularReplacer()));
});

router.get("/info", checkIfAuthenticated, async (req, res) => {
  const wsInfo = getWS();
  res.send(JSON.stringify(wsInfo, getCircularReplacer()));
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
    const resStop = await stopWebSockets();
    res.status(200).send(resStop);
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;
