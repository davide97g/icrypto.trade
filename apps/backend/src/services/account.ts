import { BinanceClient } from "../config/binance";
import { DataBaseClient } from "../connections/database";
import { admin } from "../middlewares/auth-middleware";
import {
  BinanceAccount,
  BinanceError,
  BinanceErrorData,
  BinanceResponse,
} from "../models/binance";

export const createAdmin = async (uid: string) => {
  return await admin
    .auth()
    .setCustomUserClaims(uid, { admin: true })
    .then(() => {
      console.log("Admin role added to user");
      return true;
    })
    .catch((err) => {
      console.error(err);
      return false;
    });
};

export const getAccount = async (): Promise<
  BinanceResponse<BinanceAccount>
> => {
  return BinanceClient.account()
    .then((response: any) => ({ data: response.data as BinanceAccount }))
    .catch((error: BinanceError) => ({
      error: error.response.data as BinanceErrorData,
    }));
};

export const getUser = async (uid: string) => {
  return await DataBaseClient.Account.get(uid);
};

export const setNotifications = async (
  userId: string,
  notifications: {
    email: boolean;
    telegram: boolean;
  }
) => {
  try {
    await DataBaseClient.Account.update(userId, { notifications });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};
