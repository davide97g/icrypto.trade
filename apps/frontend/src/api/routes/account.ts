import { Account } from "../../models/trade";
import { setIsLoading } from "../../services/utils";
import { getIdToken } from "../auth";
import { API, apiHost } from "../server";

export const AccountRoutes = {
  get: async (): Promise<Account> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/account`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  createAdminUser: async (uid: string) => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/account/create-admin`,
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
      `${apiHost}/account/set-notifications`,
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
