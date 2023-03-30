import { FeedItem } from "icrypto.trade-types/feed";
import { setIsLoading } from "../../services/utils";
import { getIdToken } from "../auth";
import { API, apiHost } from "../server";

const routeName = "feed";
export const FeedRoutes = {
  get: async (options?: {
    limit?: number;
    guess?: boolean;
  }): Promise<FeedItem[]> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
      params: {
        limit: options?.limit,
        guess: options?.guess,
      },
    })
      .then((res) => res.data)
      .then((data) =>
        data.map((item: any) => ({
          ...item,
          likes: item.likes ?? 0,
          dislikes: item.dislikes ?? 0,
        }))
      )
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
  getById: async (id: string): Promise<FeedItem> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/${id}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .then((item) => ({
        ...item,
        likes: item.likes ?? 0,
        dislikes: item.dislikes ?? 0,
      }))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
};
