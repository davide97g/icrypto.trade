import nodemailer from "nodemailer";

const appPassword = "tqqbwfstswqaaran";

export const defaultAddresses =
  process.env.NODE_ENV === "local"
    ? ["ghiotto.davidenko@gmail.com"]
    : ["ghiotto.davidenko@gmail.com", "darkoivanovski78@gmail.com"];

export const MailClient = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "dghiotto.dev@gmail.com",
    pass: appPassword,
  },
});
