import { defaultAddresses, MailClient } from "../config/email";
import { FeedItem, News } from "icrypto-trade-models/feed";
import {
  BinanceOCOOrder,
  BinanceTransaction,
  NewOrderRequest,
  NewTakeProfitStopLossLimitRequest,
  Transaction,
} from "icrypto-trade-models/transactions";

export const sendMail = async (to: string, feedMatch: FeedItem[]) => {
  try {
    const content = feedMatch
      .map(
        (item) => `
    <h3>Id: ${item._id}</h3>
    <h5>Likes: ${item.likes ?? 0}</h5>
    <h5>Dislikes: ${item.dislikes ?? 0}</h5>
    <p>Symbols Guess: ${item.symbolsGuess.join(", ")}</p>
    `
      )
      .join("");
    await MailClient.sendMail({
      from: "dghiotto.dev@gmail.com",
      to,
      subject: "Test mail",
      html: `Maybe I found something for you: ${content}\n Please visit: https://crypto-feed-trader.netlify.app/feed`,
    });
  } catch (err) {
    console.log(err);
    return err;
  }
};

export const sendProspectOrderMail = async (
  marketBuyRequest: NewOrderRequest,
  stopLossRequest: NewTakeProfitStopLossLimitRequest,
  takeProfitRequest: NewTakeProfitStopLossLimitRequest
) => {
  try {
    await MailClient.sendMail({
      from: "dghiotto.dev@gmail.com",
      to: defaultAddresses,
      subject: `New Order Preview: [${marketBuyRequest.symbol}]`,
      html: `
      <h1>New Market Buy Preview</h1>
      <h3>Symbol: ${marketBuyRequest?.symbol}</h3>
      <h3>Quantity: ${marketBuyRequest?.quantity}</h3>
      <h3>Order Type: ${marketBuyRequest?.type}</h3>
      <h3>Side: ${marketBuyRequest?.side}</h3>
      <h3>Order Time: ${new Date().toUTCString()}</h3>
      <br />     
      <h1>New Stop Loss Preview</h1>
      <h3>Stop Price: ${stopLossRequest.stopPrice}</h3>
      <h3>Quantity: ${stopLossRequest.quantity}</h3>
      <br />
      <h1>New Take Profit Preview</h1>
      <h3>Stop Price: ${takeProfitRequest.stopPrice}</h3>
      <h3>Quantity: ${takeProfitRequest.quantity}</h3>`,
    });
  } catch (err) {
    console.log(err);
    return err;
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
      stopLossTakeProfit?.orderListId
    }</h3>        
    <h4>Order Time: ${new Date(
      stopLossTakeProfit?.transactionTime || 0
    ).toUTCString()}</h4>
    <a href="https://crypto-feed-trader.netlify.app/orders/${
      stopLossTakeProfit?.symbol
    }/">See Open Orders</a>`;
  } else {
    OCOOrderContent += `<h3>${stopLossTakeProfitTransaction?.error}</h3>`;
  }
  try {
    await MailClient.sendMail({
      from: "dghiotto.dev@gmail.com",
      to: defaultAddresses,
      subject: `New Order: [${marketBuy?.symbol}]`,
      html: `
      <h1>New Market Buy Order</h1>
      <h3>Order Id: ${marketBuy?.orderId}</h3>
      <h3>Symbol Executed: ${marketBuy?.symbol}</h3>
      <h3>Quantity: ${marketBuy?.origQty}</h3>
      <h3>Order Type: ${marketBuy?.type}</h3>
      <h3>Status: ${marketBuy?.status}</h3>
      <h3>Order Time: ${new Date(
        marketBuy?.transactTime || 0
      ).toUTCString()}</h3>
      <a href="https://crypto-feed-trader.netlify.app/order/${
        marketBuy?.symbol
      }/${marketBuy?.orderId}">Market Buy</a>
      <br />
      ${OCOOrderContent}
      `,
    });
  } catch (err) {
    console.log(err);
    return err;
  }
};

export const sendNewPotentialOrderMail = async (news: News) => {
  try {
    await MailClient.sendMail({
      from: "dghiotto.dev@gmail.com",
      to: defaultAddresses,
      subject: `New Potential Order`,
      html: `
      <h1>New Potential Order</h1>
      <h3>Id: ${news._id}</h3>
      <h3>Likes: ${news.likes ?? 0}</h3>
      <h3>Dislikes: ${news.dislikes ?? 0}</h3>            
      <h3>Time: ${Math.round(
        (Date.now() - news.time) / (1000 * 60)
      )} minutes ago</h3>
      <a href="https://crypto-feed-trader.netlify.app/orders/potentials/${
        news._id
      }">See Potential Order</a>
      `,
    });
  } catch (err) {
    console.log(err);
    return err;
  }
};

export const sendErrorMail = async (
  subject: string,
  message: string,
  err: any
) => {
  try {
    await MailClient.sendMail({
      from: "dghiotto.dev@gmail.com",
      to: defaultAddresses,
      subject,
      html: `Error: ${message}\n ${err}`,
    });
  } catch (err) {
    console.log(err);
    return err;
  }
};

export const sendUpdateMail = async (feed: FeedItem[]) => {
  const receivers = [
    "ghiotto.davidenko@gmail.com",
    // "darkoivanovski78@gmail.com",
  ];
  return Promise.all(receivers.map((to) => sendMail(to, feed)))
    .then(() => "Emails Sent")
    .catch((err) => {
      console.log(err);
      return err;
    });
};
