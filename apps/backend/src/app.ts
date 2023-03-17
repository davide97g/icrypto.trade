import cors from "cors";
import dotenv from "dotenv";
import express, { Express, NextFunction, Request, Response } from "express";

import account from "./routes/account";
import feed from "./routes/feed";
import trades from "./routes/trades";
import symbols from "./routes/symbols";
import news from "./routes/news";
import orders from "./routes/orders";
import bot from "./routes/bot";
import "./config/telegram";
import { env } from "./config/environment";
import { telegramApi } from "./connections/telegram";

const packageJson = require("../package.json");

dotenv.config();

const app: Express = express();

const whitelist = ["http://localhost:8080", "https://icrypto.trade"];

const corsOptions: cors.CorsOptions = {
  origin: function (origin: any, callback: any) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  allowedHeaders: [
    "Content-Type",
    "Access-Control-Allow-Headers",
    "Authorization",
  ],
  exposedHeaders: [
    "Content-Type",
    "Access-Control-Allow-Headers",
    "Authorization",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  preflightContinue: true,
};

app.use(express.json()).use(cors(corsOptions));

const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("iCrypto Trade Server ⚡️");
});

app.get("/info", (req: Request, res: Response, next: NextFunction) => {
  res.send({
    version: packageJson.version,
    env: env.test ? "test" : "production",
  });
});

app.use("/account", account);

app.use("/feed", feed);

app.use("/news", news);

app.use("/symbols", symbols);

app.use("/trades", trades);

app.use("/orders", orders);

app.use("/bot", bot);

// *** SERVER LISTEN ***)

app.listen(port, () => {
  console.log(`⚡️ [server]: Server is live!`);
  if (!env.test)
    telegramApi.sendMessageToAdmins(
      `⚡️ Server is live! v${packageJson.version} click <a href="${env.domain}/settings">here</a> to start the bot.`
    );
});
