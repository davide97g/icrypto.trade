import { Router } from "express";
import { DataBaseClient } from "../connections/database";
import { checkIfAuthenticated } from "../middlewares/auth-middleware";

const router = Router();

router.get("/banned", checkIfAuthenticated, async (req, res) => {
  const tokens = await DataBaseClient.Symbols.getBanned();
  res.send(tokens);
});

export default router;
