const exchangeInfo = require("./exchange-info.json");
const fs = require("fs");

exchangeInfo.symbols = exchangeInfo.symbols
  .filter((s) => s.quoteAsset === "USDT")
  .filter((s) => s.permissions.includes("SPOT"));

const data = JSON.stringify(exchangeInfo, null, 2);
fs.writeFileSync("./exchange-info-clean.json", data);
