import WebSocket from "ws";
import { WsNTALikeMessage, WsNTANewsMessage } from "../models/websocket";

let retryCount = 0;
const MAX_RETRIES = 10;

export function wsConnect<T extends WsNTALikeMessage | WsNTANewsMessage>(
  wsURL: string,
  callback: (data: T) => void
): WebSocket {
  const socket = new WebSocket(wsURL);

  socket.addEventListener("open", (event) => {
    console.log(wsURL, "WebSocket connection established");
  });

  socket.addEventListener("message", (event) =>
    callback(JSON.parse(event.data.toString()) as T)
  );

  socket.addEventListener("close", (event) => {
    console.log(wsURL, "WebSocket connection closed");
    // if (retryCount < MAX_RETRIES) {
    //   console.info(wsURL, "Reconnecting in 10 seconds");
    //   retryCount++;
    //   setTimeout(() => wsConnect(wsURL, callback), 10000); // Reconnect
    // }
  });

  socket.addEventListener("error", (event) => {
    console.error(wsURL, "WebSocket error", event);
    if (retryCount < MAX_RETRIES) {
      console.info(wsURL, "Reconnecting in 10 seconds");
      retryCount++;
      setTimeout(() => wsConnect(wsURL, callback), 10000); // Reconnect
    }
  });

  return socket;
}
