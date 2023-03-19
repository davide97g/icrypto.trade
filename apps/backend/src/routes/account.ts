import { Router } from "express";
import {
  checkIfAdmin,
  checkIfAuthenticated,
  getUserId,
} from "../middlewares/auth-middleware";
import { createAdmin, setNotifications } from "../services/account";
import { getAccount } from "../services/binance/market";

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
  const uid = await getUserId(req, res).catch((err) => {
    console.error(err);
    return null;
  });
  if (!uid) return res.status(500).send("Error getting user id");
  else {
    const result = await setNotifications(uid, notifications);
    if (!result) return res.status(500).send("Error setting notifications");
    else res.send("Notifications set");
  }
});

export default router;
