export interface WsLikeMessage {
  newsId: string;
  type: "like" | "dislike";
  likes: number;
  dislikes: number;
}
