<template>
  <div v-if="symbol">
    <a-tag class="strong" style="font-size: larger">
      {{ symbol }}
    </a-tag>
    <div class="flex-center m1">
      <h3 class="strong" style="margin-bottom: 0; margin-right: 10px">
        Available Quantity
      </h3>
      <a-tag class="strong">
        {{ asset?.free }}
      </a-tag>
    </div>
    <a-button @click="openOnBinance" class="m1">Go To Binance</a-button>
    <a-button
      class="m1"
      type="primary"
      @click="newOrderModalVisible = true"
      :disabled="!account || !exchangeInfo"
      >New Order</a-button
    >
    <a-popconfirm
      :title="`Are you sure sell all ${symbol} ?`"
      ok-text="Yes"
      cancel-text="No"
      :disabled="!asset?.free"
      @confirm="sellAll"
    >
      <a-button type="danger" class="mx1" :disabled="!asset?.free">
        Sell All
      </a-button>
    </a-popconfirm>
    <NewOrderModal
      v-if="exchangeInfo && account"
      :symbol="symbol"
      :visible="newOrderModalVisible"
      :tokens="exchangeInfo?.symbols"
      :balances="account?.balances"
      @close="newOrderModalVisible = false"
    />
    <a-divider />
    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane key="trades" tab="Trades" class="left">
        <a-button
          type="primary"
          title="Refresh my trades"
          class="m1"
          @click="getMyTrades"
          >Refresh</a-button
        >
        <a-table
          class="ant-table-custom"
          :columns="columnsMyTrades"
          :rowKey="(record:MyTrade) => record.id"
          :data-source="myTrades"
          :pagination="{ pageSize: 10 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.title === 'Order Id'">
              <CopyOutlined
                style="cursor: pointer; margin-right: 10px"
                @click="copyToClipboard(record.orderId)"
              />
              {{ record.orderId }}
              <WalletOutlined
                style="cursor: pointer; margin-right: 10px"
                @click="openTradeDetails(record.symbol, record.orderId)"
              />
            </template>
            <template v-if="column.title === 'Symbol'">
              <a-tag>{{ record.symbol }}</a-tag>
            </template>
            <template v-if="column.title === 'Side'">
              <a-tag :color="record.isBuyer ? 'green' : 'red'">{{
                record.isBuyer ? "BUY" : "SELL"
              }}</a-tag>
            </template>
            <template v-if="column.title === 'Price'">
              <a-tag class="strong">{{ record.price }}</a-tag>
            </template>
            <template v-if="column.title === 'Quantity'">
              <a-tag class="strong">{{ record.qty }}</a-tag>
            </template>
            <template v-if="column.title === 'Date'">
              {{ new Date(record.time).toLocaleString() }}
            </template>
          </template>
          <template #expandedRowRender="{ record }">
            <div>
              <p>
                Commission:
                <a-tag
                  >{{ record.commission }} {{ record.commissionAsset }}
                </a-tag>
              </p>
            </div>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="binance-trades" tab="Binance Trades" class="left">
        <a-button
          type="primary"
          title="Refresh my trades (Binance)"
          class="m1"
          @click="getMyTradesBinance"
          >Refresh Binance</a-button
        >
        <a-table
          class="ant-table-custom"
          :columns="columnsMyTrades"
          :rowKey="(record:MyTrade) => record.id"
          :data-source="myTradesBinance"
          :pagination="{ pageSize: 10 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.title === 'Order Id'">
              <CopyOutlined
                style="cursor: pointer; margin-right: 10px"
                @click="copyToClipboard(record.orderId)"
              />
              {{ record.orderId }}
              <WalletOutlined
                style="cursor: pointer; margin-right: 10px"
                @click="openTradeDetails(record.symbol, record.orderId)"
              />
            </template>
            <template v-if="column.title === 'Symbol'">
              <a-tag>{{ record.symbol }}</a-tag>
            </template>
            <template v-if="column.title === 'Side'">
              <a-tag :color="record.isBuyer ? 'green' : 'red'">{{
                record.isBuyer ? "BUY" : "SELL"
              }}</a-tag>
            </template>
            <template v-if="column.title === 'Price'">
              <a-tag class="strong">{{ record.price }}</a-tag>
            </template>
            <template v-if="column.title === 'Quantity'">
              <a-tag class="strong">{{ record.qty }}</a-tag>
            </template>
            <template v-if="column.title === 'Date'">
              {{ new Date(record.time).toLocaleString() }}
            </template>
          </template>
          <template #expandedRowRender="{ record }">
            <div>
              <p>
                Commission:
                <a-tag
                  >{{ record.commission }} {{ record.commissionAsset }}
                </a-tag>
              </p>
            </div>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>
  </div>
  <div v-else>
    <p>Please select a symbol to see the orders</p>
    <a-auto-complete
      v-model:value="selectedSymbol"
      :options="options"
      style="width: 200px"
      placeholder="Select Symbol"
      @search="onSearch"
    />
    <a-button
      :loading="loading"
      type="primary"
      @click="selectSymbol"
      :disabled="!selectedSymbol"
      >Get Trades</a-button
    >
  </div>
</template>

<script setup lang="ts">
import { copyToClipboard, loading } from "../services/utils";
import { message } from "ant-design-vue";
import { computed, ref, watch } from "vue";
import { ApiClient } from "../api/server";
import { setIsLoading } from "../services/utils";
import { CopyOutlined, WalletOutlined } from "@ant-design/icons-vue";
import { BinanceOrderDetails } from "../models/orders";
import { router, TradePageName, TradesPageName } from "../router";
import { Account, ExchangeInfo } from "../models/trade";
import { BinanceError, MyTrade } from "../models/binance";
import NewOrderModal from "../components/Orders/NewOrderModal.vue";

const props = defineProps<{
  symbol?: string;
}>();

const symbol = ref(props.symbol);

const activeKey = ref("trades");

watch(
  () => props.symbol,
  (newSymbol) => {
    symbol.value = newSymbol?.includes("USDT") ? newSymbol : newSymbol + "USDT";
    getMyTrades();
  }
);

const myTrades = ref<MyTrade[]>([]);
const myTradesBinance = ref<MyTrade[]>([]);
const account = ref<Account>();
const exchangeInfo = ref<ExchangeInfo>();

const asset = computed(() =>
  account.value?.balances.find((s) => symbol.value?.startsWith(s.asset))
);

// Symbol selection

const selectedSymbol = ref(symbol.value || "");

const options = ref<any>([]);
const originalOptions = ref(options.value);

watch(
  () => exchangeInfo.value?.symbols,
  (symbols) => {
    options.value = symbols?.map((t) => ({
      ...t,
      value: t.symbol,
    }));
    originalOptions.value = options.value;
  }
);

const onSearch = (searchText: string) => {
  options.value = originalOptions.value?.filter((o: any) =>
    o.symbol.toUpperCase().includes(searchText.toUpperCase())
  );
};

const selectSymbol = () => {
  symbol.value = selectedSymbol.value;
  router.push({ name: TradesPageName, params: { symbol: symbol.value } });
  getMyTrades();
};

const columnsOpenOrders = [
  {
    title: "Order Id",
    dataIndex: "orderId",
    width: 3,
    ellipsis: true,
    sorter: (a: BinanceOrderDetails, b: BinanceOrderDetails) =>
      a.orderId - b.orderId,
  },
  {
    title: "Symbol",
    dataIndex: "symbol",
    width: 2,
  },
  {
    title: "Side",
    dataIndex: "side",
    width: 1,
  },
  {
    title: "Type",
    dataIndex: "type",
    width: 2,
  },
  {
    title: "Price",
    dataIndex: "price",
    width: 2,
  },
  {
    title: "Stop Price",
    dataIndex: "stopPrice",
    width: 2,
  },
  {
    title: "Quantity",
    dataIndex: "origQty",
    width: 2,
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 2,
  },
  {
    title: "Date",
    dataIndex: "time",
    width: 4,
    sorter: (a: BinanceOrderDetails, b: BinanceOrderDetails) => a.time - b.time,
  },
];

const columnsMyTrades = [
  {
    title: "Id",
    dataIndex: "id",
    width: "15%",
    ellipsis: true,
    sorter: (a: MyTrade, b: MyTrade) => a.id - b.id,
    fixed: true,
  },
  {
    title: "Order Id",
    dataIndex: "orderId",
    width: "20%",
    ellipsis: true,
    sorter: (a: MyTrade, b: MyTrade) => a.orderId - b.orderId,
  },
  {
    title: "Side",
    dataIndex: "isBuyer",
    width: "10%",
  },
  {
    title: "Symbol",
    dataIndex: "symbol",
    width: "10%",
  },
  {
    title: "Quantity",
    dataIndex: "qty",
    width: "15%",
  },
  {
    title: "Price",
    dataIndex: "price",
    width: "15%",
  },
  {
    title: "Date",
    dataIndex: "time",
    width: "20%",
    sorter: (a: MyTrade, b: MyTrade) => a.time - b.time,
  },
];

const openOnBinance = () => {
  window.open(`https://www.binance.com/en/trade/${symbol.value}`, "_blank");
};

const openTradeDetails = (symbol: string, orderId: string) => {
  router.push({
    name: TradePageName,
    params: { symbol, orderId },
  });
};

const getMyTrades = async () => {
  if (!symbol.value) return;
  setIsLoading(true);
  await ApiClient.Trades.get(symbol.value)
    .then((res) => {
      if (res) myTrades.value = res;
    })
    .catch((err) => {
      console.error(err);
      message.error(err);
    })
    .finally(() => setIsLoading(false));
};

const getMyTradesBinance = async () => {
  if (!symbol.value) return;
  setIsLoading(true);
  await ApiClient.Trades.getBinance(symbol.value)
    .then((res) => {
      if (res) myTradesBinance.value = res;
    })
    .catch((err) => {
      console.error(err);
      message.error(err);
    })
    .finally(() => setIsLoading(false));
};

const sellAll = () => {
  if (!symbol.value) return;
  setIsLoading(true);
  ApiClient.Orders.sellAll(symbol.value)
    .then((res) => {
      if (res) {
        getAccount();
        getMyTrades();
        message.success(`Sold ${res.executedQty} of ${props.symbol}`);
      } else message.warning("Something went wrong while selling all");
    })
    .catch((err) => {
      console.error(err);
      message.error(err);
    })
    .finally(() => {
      setIsLoading(false);
    });
};

const getAccount = () => {
  ApiClient.Account.get().then((res) => {
    if (res) account.value = res;
  });
};

const getExchangeInfo = () =>
  ApiClient.Trades.getExchangeInfo()
    .then((res) => {
      if (res) exchangeInfo.value = res;
      else message.warning(`Error getting exchange info`);
    })
    .catch((err: BinanceError) => {
      console.error(err);
      message.error(err.response.data.msg || `Error getting exchange info`);
    });

const newOrderModalVisible = ref(false);

getExchangeInfo();
getAccount();
</script>

<style lang="scss" scoped>
.strong {
  font-weight: 600;
}
pre {
  white-space: pre-wrap; /* Since CSS 2.1 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
}
</style>
