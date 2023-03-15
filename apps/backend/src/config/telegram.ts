import axios from "axios";
import { env } from "./environment";

export const telegram = axios.create({
  baseURL: `https://api.telegram.org/bot${env.telegramToken}`,
});
