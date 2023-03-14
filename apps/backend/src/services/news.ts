import { DataBaseClient } from "../connections/database";
import { News } from "../models/feed";

// TODO: move function here from router (decouple db instance from router)

export const updateById = async (id: string, news: News) => {
  await DataBaseClient.News.updateById(id, news).catch((err) => {
    console.log(err);
    throw new Error(err);
  });
};
