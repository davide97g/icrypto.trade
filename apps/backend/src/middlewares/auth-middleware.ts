import { NextFunction, Request, Response } from "express";
import admin from "firebase-admin";

import serviceAccount from "../config/service_account/serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

const getAuthToken = (req: Request, res: Response, next: NextFunction) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    (req as any).authToken = req.headers.authorization.split(" ")[1];
  } else {
    (req as any).authToken = null;
  }
  next();
};

export const checkIfAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  getAuthToken(req, res, async () => {
    try {
      const { authToken } = req as any;
      const userInfo = await admin.auth().verifyIdToken(authToken);
      if (userInfo.admin === true) {
        (req as any).authId = userInfo.uid;
        return next();
      }

      throw new Error("unauthorized");
    } catch (e) {
      return res
        .status(401)
        .send({ error: "You are not authorized to make this request" });
    }
  });
};

export const checkIfAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  getAuthToken(req, res, async () => {
    try {
      const { authToken } = req as any;
      const userInfo = await admin.auth().verifyIdToken(authToken);
      (req as any).authId = userInfo.uid;
      return next();
    } catch (e) {
      return res
        .status(401)
        .send({ error: "You are not authorized to make this request" });
    }
  });
};

export const makeAdmin = async (uid: string) => {
  return await admin
    .auth()
    .setCustomUserClaims(uid, { admin: true })
    .then(() => {
      console.log("Admin role added to user");
    })
    .catch((err) => console.error(err));
};
