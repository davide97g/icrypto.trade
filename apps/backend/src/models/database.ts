export interface ICryptoTradeUser {
  id: string;
  email: string;
  notifications: {
    email: boolean;
    telegram: boolean;
  };
  telegramChatId: string;
  displayName: string;
  photoURL: string;
  admin: boolean;
}
