import WebSocket from "ws";
import { WsLikeMessage } from "icrypto-trade-models/websocket";

export const openWS = (wsURL: string) => {
  const socket = new WebSocket(wsURL);

  socket.addEventListener("open", (event) => {
    console.log("WebSocket connection established");
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data.toString()) as WsLikeMessage;
    console.log(`Received message: ${data}`);
  });

  socket.addEventListener("close", (event) => {
    console.log("WebSocket connection closed");
  });

  socket.addEventListener("error", (event) => {
    console.error("WebSocket error", event);
  });

  return socket;
};
