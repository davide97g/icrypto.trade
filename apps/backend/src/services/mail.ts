import { defaultAddresses, MailClient } from "../config/email";
import { env } from "../config/environment";
import { telegramApi } from "../config/telegram";
import { News } from "../models/feed";
import { BinanceOrderResult } from "../models/orders";
import {
  BinanceOCOOrder,
  BinanceTransaction,
  Transaction,
} from "../models/transactions";

// ? Generic template for sending an email
const sendMail = async (subject: string, content: string) => {
  try {
    await MailClient.sendMail({
      from: "dghiotto.dev@gmail.com",
      to: defaultAddresses,
      subject: `[iCrypto Trade] ${subject}`,
      html: content,
    });
  } catch (err) {
    console.error("[Email Error]", err);
  }
};

export const sendNewOrderMail = async (
  marketBuy: Transaction,
  stopLossTakeProfitTransaction?: BinanceTransaction<BinanceOCOOrder>
) => {
  let OCOOrderContent = "<h3>OCO Order</h3>";
  if (stopLossTakeProfitTransaction?.transaction) {
    const stopLossTakeProfit = stopLossTakeProfitTransaction.transaction;
    OCOOrderContent += `<h3>OCO Order Id: ${
      stopLossTakeProfit.orderListId
    }</h3>        
    <h4>Order Time: ${new Date(
      stopLossTakeProfit.transactionTime || 0
    ).toUTCString()}</h4>
    <a href="${env.domain}/orders/${
      stopLossTakeProfit.symbol
    }/">See Open Orders</a>`;
  } else {
    OCOOrderContent += `<h3>${stopLossTakeProfitTransaction?.error}</h3>`;
  }

  const content = `
    <h1>New Market Buy Order</h1>
    <h3>Order Id: ${marketBuy?.orderId}</h3>
    <h3>Symbol Executed: ${marketBuy?.symbol}</h3>
    <h3>Quantity: ${marketBuy?.origQty}</h3>
    <h3>Order Type: ${marketBuy?.type}</h3>
    <h3>Status: ${marketBuy?.status}</h3>
    <h3>Order Time: ${new Date(marketBuy?.transactTime || 0).toUTCString()}</h3>
    <a href="${env.domain}/order/${marketBuy?.symbol}/${
    marketBuy?.orderId
  }">Market Buy</a>
    <br />
    ${OCOOrderContent}
    `;
  const subject = `New Order: [${marketBuy?.symbol}]`;
  telegramApi.sendMessageToAdmins(subject + "\n" + content);
  await sendMail(subject, content);
};

export const sendOrderMail = async (
  marketBuyTransaction: Transaction,
  ocoOrder: BinanceOrderResult<BinanceOCOOrder>
) => {
  let OCOOrderContent = "<h3>OCO Order</h3>";
  let telegramOCOOrderContent = "OCO Order";
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

    telegramOCOOrderContent += `
    OCO Order Id: ${stopLossTakeProfit.orderListId}<br/>
    Order Time: ${new Date(
      stopLossTakeProfit.transactionTime || 0
    ).toUTCString()} <br/>
     <a href=${env.domain}/orders/${
      stopLossTakeProfit.symbol
    }/>See Open Orders</a> <br/>
    `;
  } else {
    OCOOrderContent += `<h3>${ocoOrder?.error}</h3>`;
    telegramOCOOrderContent += ` ${ocoOrder?.error}`;
  }

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

  const telegramContent = `
    New Market Buy Order
    <br/>
    Order Id: ${marketBuyTransaction?.orderId}<br/>
    Symbol Executed: ${marketBuyTransaction?.symbol}<br/>
    Quantity: ${marketBuyTransaction?.origQty}<br/>
    Order Type: ${marketBuyTransaction?.type}<br/>
    Status: ${marketBuyTransaction?.status}<br/>
    Order Time: ${new Date(
      marketBuyTransaction?.transactTime || 0
    ).toUTCString()}<br/>
    <a href="${env.domain}/order/${marketBuyTransaction?.symbol}/${
    marketBuyTransaction?.orderId
  }">Market Buy</a>
    <br />
    ${telegramOCOOrderContent}
    `;
  telegramApi.sendMessageToAdmins(subject + "\n" + telegramContent);
  await sendMail(subject, content);
};

export const sendNewPotentialOrderMail = async (news: News) => {
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
  const telegramContent = `
    New Potential Order
    <br/>
    Id: ${news._id}<br/>
    Likes: ${news.likes ?? 0}<br/>
    Dislikes: ${news.dislikes ?? 0}<br/>       
    Time: ${Math.round((Date.now() - news.time) / (1000 * 60))} minutes ago
    <br/>
    Status: ${news.status}<br/>
    <a href="${env.domain}/orders/potentials/${
    news._id
  }">See Potential Order</a>
    `;
  const subject = `New Potential Order`;
  telegramApi.sendMessageToAdmins(subject + "\n" + telegramContent);
  await sendMail(subject, content);
};

export const sendErrorMail = async (
  subject: string,
  message: string,
  err: any
) => {
  const content = `🤯 Error: ${message}\n ${err}`;
  telegramApi.sendMessageToAdmins(subject + "\n" + content);
  await sendMail(subject, content);
};
