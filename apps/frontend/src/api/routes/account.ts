import { BinanceAccount } from "../../models/account";
import { setIsLoading } from "../../services/utils";
import { getIdToken } from "../auth";
import { API, apiHost } from "../server";

const routeName = "account";
export const AccountRoutes = {
  get: async (): Promise<BinanceAccount> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  createAdmin: async (uid: string) => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/${routeName}/create-admin`,
      { uid },
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then((res) => res.data)
      .catch((err) => console.log(err))
      .finally(() => setIsLoading(false));
  },
  setNotifications: async (notifications: {
    email: boolean;
    telegram: boolean;
  }) => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/${routeName}/set-notifications`,
      { notifications },
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then((res) => res.data)
      .catch((err) => console.log(err))
      .finally(() => setIsLoading(false));
  },
};
