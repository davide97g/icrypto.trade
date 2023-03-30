import { Router } from "express";
import { checkIfAuthenticated } from "../middlewares/auth-middleware";
import { GoodFeedItem } from "icrypto.trade-types/database";
import { getAll, getById, updateById } from "../services/news";

const router = Router();

router.get("/", checkIfAuthenticated, async (req, res) => {
  // time query param is in seconds
  const time = parseInt(req.query.time as string) || 0;
  await getAll(time)
    .then((news) => res.send(news))
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error getting news");
    });
});

router.get("/:id", checkIfAuthenticated, async (req, res) => {
  const id = (req.params.id as string) || "";
  if (!id) return res.status(400).send("Id is required");
  await getById(id)
    .then((news) => res.send(news))
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error getting news");
    });
});

router.post("/:id", checkIfAuthenticated, async (req, res) => {
  const id = (req.params.id as string) || "";
  const news: GoodFeedItem = req.body.news;
  if (!id) return res.status(400).send("Id is required");
  if (!news) return res.status(400).send("News is required");
  await updateById(id, news)
    .then(() => res.send())
    .catch((err) => res.status(500).send(err));
});

export default router;
