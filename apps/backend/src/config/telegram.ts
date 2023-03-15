import axios from "axios";
import { env } from "./environment";

const telegram = axios.create({
  baseURL: `https://api.telegram.org/bot${env.telegramToken}`,
});

interface TelegramMessage {
  message_id: number;
  from: any;
  chat: any;
  date: number;
  text: string;
  entities: any[];
}

interface TelegramUpdate {
  update_id: number;
  message: TelegramMessage;
}

const ids: string[] = ["444270183", "33016687"];

let offset: number | null = null;
export const telegramApi = {
  sendMessageToAdmins: (text: string) =>
    ids.forEach((id) => telegramApi.sendMessage(id, text)),
  sendMessage: (chatId: string, text: string) =>
    telegram.post("/sendMessage?parse_mode=html", { chat_id: chatId, text }),
  getUpdates: () =>
    telegram
      .get(
        `/getUpdates?limit=1&allowed_updates=['message']${
          offset ? "&offset=" + offset : ""
        }`
      )
      .then((res) => {
        const updates = res.data.result as TelegramUpdate[];
        const update = updates[0];
        offset = update.update_id + 1;
        console.info(update.update_id);
        if (!ids.includes(update.message.chat.id.toString())) {
          const command = update.message.text;
          if (command === "/start") {
            telegramApi.sendMessage(
              update.message.chat.id.toString(),
              "Welcome to iCrypto Trade!"
            );
            telegramApi.sendMessage(
              update.message.chat.id.toString(),
              update.message.chat.id.toString()
            );
          }
          ids.push(update.message.chat.id.toString());
        } else console.info("User already registered");

        return res.data;
      }),
};
