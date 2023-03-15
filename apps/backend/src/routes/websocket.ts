import { Router } from "express";
import {
  checkIfAdmin,
  checkIfAuthenticated,
} from "../middlewares/auth-middleware";
import {
  getWS,
  getWsFeed,
  StartLikesWebSocket,
  StartNewsWebSocket,
  StopLikesWebSocket,
  StopNewsWebSocket,
} from "../services/websocket";

const router = Router();

router.get("/feed", checkIfAuthenticated, async (req, res) => {
  const wsFeed = getWsFeed();
  res.send(wsFeed);
});

router.get("/info", checkIfAuthenticated, async (req, res) => {
  const wsInfo = getWS();
  res.send(wsInfo);
});

router.post("/start/news", checkIfAdmin, async (req, res) => {
  try {
    const response = await StartNewsWebSocket();
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/stop/news", checkIfAdmin, async (req, res) => {
  try {
    const response = StopNewsWebSocket();
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/start/likes", checkIfAdmin, async (req, res) => {
  try {
    const response = await StartLikesWebSocket();
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/stop/likes", checkIfAdmin, async (req, res) => {
  try {
    const response = StopLikesWebSocket();
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/start", checkIfAdmin, async (req, res) => {
  try {
    const responseNews = await StartNewsWebSocket();
    const responseLikes = await StartLikesWebSocket();
    res.status(200).send({
      news: responseNews,
      likes: responseLikes,
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/stop", checkIfAdmin, async (req, res) => {
  try {
    const responseNews = StopNewsWebSocket();
    const responseLikes = StopLikesWebSocket();
    res.status(200).send({
      news: responseNews,
      likes: responseLikes,
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;
