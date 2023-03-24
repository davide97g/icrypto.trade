import WebSocket from "ws";
import {
  HerokuLogMessage,
  WsNTALikeMessage,
  WsNTANewsMessage,
} from "../models/websocket";
import { getWS } from "../services/bot/bot";
import { telegramApi } from "./telegram";

const MAX_RETRIES = 10;

export function wsConnect<
  T extends WsNTALikeMessage | WsNTANewsMessage | HerokuLogMessage
>(
  wsURL: string,
  callback: (data: T) => void,
  reconnectFn?: () => void
): WebSocket {
  const socket = new WebSocket(wsURL);
  let retryCount = 0;

  socket.on("pong", () => {
    console.log(wsURL, "Pong");
  });

  socket.addEventListener("open", (event) => {
    console.log(wsURL, "WebSocket connection established");
    retryCount = 0;
  });

  socket.addEventListener("message", (event) =>
    callback(JSON.parse(event.data.toString()) as T)
  );

  socket.addEventListener("close", (event) => {
    console.log(wsURL, "WebSocket connection closed");

    if (retryCount < MAX_RETRIES) {
      const WS = getWS();
      if (WS.isRunning && reconnectFn) {
        retryCount++;
        telegramApi.sendMessageToDevs(`${wsURL} - Reconnecting`);
        reconnectFn();
      } else {
        const message = `${wsURL} - WS is not running or no 'reconnectFn' available. Event Reason: ${event.reason}`;
        telegramApi.sendMessageToDevs(message);
        console.warn(message);
      }
    } else {
      const message = `${wsURL} - Max retries reached, stopping reconnecting. Event Reason: ${event.reason}`;
      telegramApi.sendMessageToDevs(message);
      console.warn(message);
    }
  });

  socket.addEventListener("error", (event) => {
    console.error(wsURL, "WebSocket error", event);
    console.info(wsURL, "Reconnecting in 10 seconds");
    if (retryCount < MAX_RETRIES) {
      const WS = getWS();
      if (WS.isRunning && reconnectFn) {
        retryCount++;
        reconnectFn();
      } else
        console.info(
          "WS is not running or no reconnect function available, stopping reconnecting"
        );
    } else console.warn(wsURL, "Max retries reached, stopping reconnecting");
  });

  return socket;
}
