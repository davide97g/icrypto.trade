import nodemailer from "nodemailer";
import { env } from "./environment";

export const ADDRESSES =
  process.env.NODE_ENV === "local"
    ? ["ghiotto.davidenko@gmail.com"]
    : ["ghiotto.davidenko@gmail.com", "darkoivanovski78@gmail.com"];

export const SENDER = "dghiotto.dev@gmail.com";

export const MailClient = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: SENDER,
    pass: env.emailPassword,
  },
});
