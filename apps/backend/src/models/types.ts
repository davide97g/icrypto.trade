export type OrderType =
  | "LIMIT"
  | "MARKET"
  | "STOP_LOSS"
  | "STOP_LOSS_LIMIT"
  | "TAKE_PROFIT"
  | "TAKE_PROFIT_LIMIT"
  | "LIMIT_MAKER";

export type OrderSide = "BUY" | "SELL";

export type OrderTimeInForce = "GTC" | "IOC" | "FOK";

export type OrderResponseType = "ACK" | "RESULT" | "FULL";

// Status	Description
// NEW	The order has been accepted by the engine.
// PARTIALLY_FILLED	A part of the order has been filled.
// FILLED	The order has been completed.
// CANCELED	The order has been canceled by the user.
// PENDING_CANCEL	Currently unused
// REJECTED	The order was not accepted by the engine and not processed.
// EXPIRED	The order was canceled according to the order type's rules (e.g. LIMIT FOK orders with no fill, LIMIT IOC or MARKET orders that partially fill) or by the exchange, (e.g. orders canceled during liquidation, orders canceled during maintenance)
// EXPIRED_IN_MATCH	The order was canceled by the exchange due to STP trigger. (e.g. an order with EXPIRE_TAKER will match with existing orders on the book with the same account or same tradeGroupId)

export type OrderStatus =
  | "NEW"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELED"
  | "PENDING_CANCEL"
  | "REJECTED"
  | "EXPIRED"
  | "EXPIRED_IN_MATCH";
