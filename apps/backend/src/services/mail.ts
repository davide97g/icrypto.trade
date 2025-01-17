import { env } from "../config/environment";
import { ADDRESSES, MailClient, SENDER } from "../config/email";
import { telegramApi } from "../connections/telegram";
import { BinanceOrderResult, Order } from "../models/orders";
import { BinanceOCOOrder } from "../models/orders";
import { getCircularReplacer } from "../utils/utils";
import { GoodFeedItem } from "../models/database";

// ? Generic template for sending an email
const sendMail = async (subject: string, content: string) => {
  try {
    await MailClient.sendMail({
      from: SENDER,
      to: ADDRESSES,
      subject: `[iCrypto Trade] ${subject}`,
      html: content,
    });
  } catch (err) {
    console.error("[Email Error]", err);
  }
};

export const sendOrderMail = async (
  marketBuyTransaction: Order,
  ocoOrder: BinanceOrderResult<BinanceOCOOrder>
) => {
  let OCOOrderContent = "<h3>OCO Order</h3>";
  if (ocoOrder?.order) {
    const stopLossTakeProfit = ocoOrder.order;
    OCOOrderContent += `<h3>OCO Order Id: ${
      stopLossTakeProfit.orderListId
    }</h3>        
    <h4>Order Time: ${new Date(
      stopLossTakeProfit.transactionTime || 0
    ).toUTCString()}</h4>
    <a href="${env.domain}/orders/${
      stopLossTakeProfit.symbol
    }/">See Open Orders</a>`;
  } else OCOOrderContent += `<h3>${ocoOrder?.error}</h3>`;

  const content = `
    <h1>New Market Buy Order</h1>
    <h3>Order Id: ${marketBuyTransaction?.orderId}</h3>
    <h3>Symbol Executed: ${marketBuyTransaction?.symbol}</h3>
    <h3>Quantity: ${marketBuyTransaction?.origQty}</h3>
    <h3>Order Type: ${marketBuyTransaction?.type}</h3>
    <h3>Status: ${marketBuyTransaction?.status}</h3>
    <h3>Order Time: ${new Date(
      marketBuyTransaction?.transactTime || 0
    ).toUTCString()}</h3>
    <a href="${env.domain}/order/${marketBuyTransaction?.symbol}/${
    marketBuyTransaction?.orderId
  }">Market Buy</a>
    <br />
    ${OCOOrderContent}
    `;
  const subject = `New Order: [${marketBuyTransaction?.symbol}]`;

  telegramApi.sendMessageToAdmins(
    `New Order: [${marketBuyTransaction?.symbol}] <a href="${env.domain}/orders/${marketBuyTransaction.symbol}">${marketBuyTransaction.symbol}</a>`
  );
  await sendMail(subject, content);
};

export const sendNewPotentialOrderMail = async (news: GoodFeedItem) => {
  const content = `
    <h1>New Potential Order</h1>
    <h3>Id: ${news._id}</h3>
    <h3>Likes: ${news.likes ?? 0}</h3>
    <h3>Dislikes: ${news.dislikes ?? 0}</h3>            
    <h3>Time: ${Math.round(
      (Date.now() - news.time) / (1000 * 60)
    )} minutes ago</h3>
    <h3>Status: ${news.status}</h3>
    <a href="${env.domain}/orders/potentials/${
    news._id
  }">See Potential Order</a>
    `;
  const subject = `New Potential Order`;
  telegramApi.sendMessageToAdmins(
    `New Potential Order: [${news._id}] <a href="${env.domain}/news/prospect/${news._id}">See Potential Order</a>`
  );
  await sendMail(subject, content);
};

export const sendErrorMail = async (
  subject: string,
  message: string,
  err: any
) => {
  const content = `🤯 Error: ${message}\n ${JSON.stringify(
    err,
    getCircularReplacer()
  )}`;
  telegramApi.sendMessageToAdmins(
    `🤯 Error: ${subject}\n ${message}\n <code style="text-align:left; font-size:10px">${JSON.stringify(
      err,
      null,
      2
    )}</code>`
  );
  await sendMail(subject, content);
};
