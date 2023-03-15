import dotenvFlow from "dotenv-flow";
dotenvFlow.config();

console.info("Environment:", process.env.NODE_ENV);

export const env = {
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
  baseUrl: process.env.BASE_URL,
  wsUrl: process.env.WS_URL,
  fixieUrl: process.env.FIXIE_URL,
  env: process.env.NODE_ENV,
  test: process.env.NODE_ENV !== "prod",
  telegramToken: process.env.TELEGRAM_TOKEN,
  domain: process.env.DOMAIN,
};
