import { telegram } from "../config/telegram";
import { startWebSockets, stopWebSockets } from "../services/websocket";

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
        if (updates.length === 0) return;
        const update = updates[0];
        offset = update.update_id + 1;
        executeCommand(update.message.text, update.message.chat.id.toString());
      }),
};

const executeCommand = async (command: string, chatId: string) => {
  switch (command) {
    case "/info":
      {
        if (!ids.includes(chatId)) {
          telegramApi.sendMessage(chatId, "Welcome to iCrypto Trade!");
          telegramApi.sendMessage(chatId, chatId);
          ids.push(chatId);
        }
      }
      break;
    case "/start":
      await startWebSockets().then(() =>
        telegramApi.sendMessage(chatId, "Bot started")
      );
      break;
    case "/stop":
      stopWebSockets();
      telegramApi.sendMessage(chatId, "Bot stopped");
      break;
    case "/help":
      telegramApi.sendMessage(
        chatId,
        "Available commands:\n - /start : start bot\n - /stop: stop bot\n - /stocazzo: e tu che cazzo fai?"
      );
      break;
    default:
      telegramApi.sendMessage(chatId, "Command not found");
      break;
  }
};

setInterval(() => {
  telegramApi.getUpdates();
}, 1000);
