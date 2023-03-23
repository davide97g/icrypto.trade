import WebSocket from "ws";
import {
  HerokuLogMessage,
  WsNTALikeMessage,
  WsNTANewsMessage,
} from "../models/websocket";
import { getWS } from "../services/bot/bot";

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

  socket.addEventListener("open", (event) => {
    console.log(wsURL, "WebSocket connection established");
    retryCount = 0;
  });

  socket.addEventListener("message", (event) =>
    callback(JSON.parse(event.data.toString()) as T)
  );

  socket.addEventListener("close", (event) => {
    console.log(wsURL, "WebSocket connection closed");
    console.info(wsURL, "Reconnecting in 10 seconds");
    setTimeout(() => {
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
    }, 10000); // Reconnect
  });

  socket.addEventListener("error", (event) => {
    console.error(wsURL, "WebSocket error", event);
    console.info(wsURL, "Reconnecting in 10 seconds");
    setTimeout(() => {
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
    }, 10000); // Reconnect
  });

  return socket;
}
