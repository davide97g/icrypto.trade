import { News } from "../../models/feed";
import { setIsLoading } from "../../services/utils";
import { getIdToken } from "../auth";
import { API, apiHost } from "../server";

const routeName = "news";
export const NewsRoutes = {
  get: async (options?: { time?: number }): Promise<News[]> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
      params: {
        time: options?.time,
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
  getById: async (id: string): Promise<News> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/${id}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data as News)
      .catch((err) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  updateById: async (news: News): Promise<boolean> => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/${routeName}/${news._id}`,
      { news },
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then((res) => res.data)
      .catch((err) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
};
