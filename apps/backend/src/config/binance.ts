// API DOCS: https://binance.github.io/binance-api-swagger/
// TESTNET https://testnet.binance.vision
// API PROD https://api.binance.com

import url from "url";
import tunnel from "tunnel";
import { env } from "./environment";

const { Spot } = require("@binance/connector");

const FIXIE = env.fixieUrl || "";
const fixieUrl = url.parse(FIXIE);
const fixieAuth = fixieUrl.auth?.split(":");

const options = {
  baseURL: env.baseUrl,
  wsURL: env.wsUrl,
  timeout: 5000,
  proxy:
    FIXIE && !env.test
      ? {
          protocol: "http",
          host: fixieUrl.hostname,
          port: fixieUrl.port,
          auth: { username: fixieAuth![0], password: fixieAuth![1] },
        }
      : false,
  httpsAgent:
    FIXIE && !env.test
      ? tunnel.httpsOverHttp({
          proxy: {
            host: fixieUrl.hostname || "",
            port: parseInt(fixieUrl.port || "80"),
          },
        })
      : null,
};

export const BinanceClient = new Spot(env.apiKey, env.apiSecret, options);
