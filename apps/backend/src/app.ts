import cors from "cors";
import dotenv from "dotenv";
import express, { Express, NextFunction, Request, Response } from "express";

import roles from "./routes/roles";
import feed from "./routes/feed";
import transaction from "./routes/transactions";
import symbols from "./routes/symbols";
import news from "./routes/news";
import scheduler from "./routes/scheduler";
import tokens from "./routes/tokens";
import orders from "./routes/orders";
import { env } from "./config/environment";

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

app.use("/roles", roles);

app.use("/feed", feed);

app.use("/symbols", symbols);

app.use("/transactions", transaction);

app.use("/orders", orders);

app.use("/news", news);

app.use("/scheduler", scheduler);

app.use("/tokens", tokens);

// *** SERVER LISTEN ***

app.listen(port, () => {
  console.log(`⚡️ [server]: Server is live!`);
});
