import { Router } from "express";
// import { checkIfAuthenticated } from "../middlewares/auth-middleware";
import { getWsFeed } from "../services/websocket";

const router = Router();

router.get("/", async (req, res) => {
  const wsFeed = getWsFeed();
  res.send(wsFeed);
});

export default router;
