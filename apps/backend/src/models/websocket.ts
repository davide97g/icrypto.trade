export interface WsNTALikeMessage {
  newsId: string;
  type: "like" | "dislike";
  likes: number;
  dislikes: number;
}

export interface WsNTANewsMessage {
  delay: number;
  en: string;
  source: string;
  symbols: string[];
  time: number;
  title: string;
  url: string;
  _id: string;
}
