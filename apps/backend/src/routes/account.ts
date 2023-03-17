import { Router } from "express";
import {
  checkIfAdmin,
  checkIfAuthenticated,
} from "../middlewares/auth-middleware";
import { createAdmin, getAccount } from "../services/account";

const router = Router();

router.post("/create-admin", checkIfAdmin, async (req, res) => {
  const uid = (req.body.uid as string) || "";
  if (!uid) return res.status(400).send("uid is required");
  const result = await createAdmin(uid);
  if (!result) return res.status(500).send("Error creating admin");
  else res.send(`${uid} now is admin`);
});

router.get("/", checkIfAuthenticated, async (req, res) => {
  const result = await getAccount();
  if (result.error) return res.status(500).send(result.error);
  else res.send(result.data);
});

router.post("/set-notifications", checkIfAdmin, async (req, res) => {
  const notifications =
    (req.body.notifications as {
      email: boolean;
      telegram: boolean;
    }) || "";
  if (!notifications.email || !notifications.telegram)
    return res.status(400).send(`email and telegram are required`);
  res.status(500).send("Not implemented yet");
});

export default router;
