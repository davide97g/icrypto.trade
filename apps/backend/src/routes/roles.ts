import { Router } from "express";
import {
  checkIfAuthenticated,
  makeAdmin,
} from "../middlewares/auth-middleware";

const router = Router();

router.post("/admin/create", checkIfAuthenticated, async (req, res) => {
  const uid = (req.body.uid as string) || "";
  if (!uid) return res.status(400).send("uid is required");
  await makeAdmin(uid);
  res.send(`${uid} now is admin`);
});

export default router;
