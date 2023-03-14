import WebSocket from "ws";
import { WsNTALikeMessage, WsNTANewsMessage } from "../models/websocket";

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
  });

  socket.addEventListener("error", (event) => {
    console.error(wsURL, "WebSocket error", event);
  });

  return socket;
}
