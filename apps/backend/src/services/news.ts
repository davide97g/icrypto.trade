import { DataBaseClient } from "../connections/database";
import { GoodFeedItem } from "icrypto.trade-types/database";

// TODO: move function here from router (decouple db instance from router)

export const updateById = async (id: string, news: GoodFeedItem) => {
  await DataBaseClient.GoodFeedItem.updateById(id, news).catch((err) => {
    console.log(err);
    throw new Error(err);
  });
};

export const getById = async (id: string) => {
  return await DataBaseClient.GoodFeedItem.getById(id);
};

export const getAll = async (time: number) => {
  return await DataBaseClient.GoodFeedItem.get(time);
};
