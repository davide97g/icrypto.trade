import { Router } from "express";
import { checkIfAuthenticated } from "../middlewares/auth-middleware";
import { getCleanTokens } from "../services/symbols";

const router = Router();

router.get("/", checkIfAuthenticated, async (req, res) => {
  const tokens = getCleanTokens();
  res.send(tokens);
});

export default router;
