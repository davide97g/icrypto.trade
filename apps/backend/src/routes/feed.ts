import { Router } from "express";
import { checkIfAuthenticated } from "../middlewares/auth-middleware";
import { getFeed, getFeedItem } from "../services/feed";

const router = Router();

router.get("/:id", checkIfAuthenticated, async (req, res) => {
  const id = req.params.id;
  const feed = await getFeedItem(id);
  res.send(feed);
});

router.get("/", checkIfAuthenticated, async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const guess = (req.query.guess as string) == "true" || false;
  const feed = await getFeed({
    limit,
    guess,
  });
  res.send(feed);
});

export default router;
