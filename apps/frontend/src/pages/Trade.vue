<template>
  <div v-if="!myTrades?.length && !loading">
    <p>No trades found for symbol: {{ symbol }} and order id: {{ orderId }}</p>
    <a-button
      type="primary"
      title="Back to my trades"
      class="m1"
      @click="backToTrades"
      >Back to {{ symbol }} trades</a-button
    >
  </div>
  <div v-else-if="!loading">
    <a-tag v-if="isFromBinance" color="green">From Binance</a-tag>
    <a-button
      type="primary"
      title="Refresh my trades"
      class="m1"
      @click="getTrades"
      >Refresh</a-button
    >
    <a-table
      class="ant-table-custom"
      :columns="columns"
      :rowKey="(record:MyTrade) => record.id"
      :data-source="myTrades"
      :pagination="{ pageSize: 10 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.title === 'Order Id'">
          {{ record.orderId }}
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
            <a-tag>{{ record.commission }} {{ record.commissionAsset }} </a-tag>
          </p>
        </div>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import { ref } from "vue";
import { ApiClient } from "../api/server";
import { BinanceError } from "../models/binance";
import { MyTrade } from "../models/orders";
import { router, OrdersPageName } from "../router";
import { loading } from "../services/utils";

const myTrades = ref<MyTrade[]>();

const isFromBinance = ref(false);

const props = defineProps<{
  orderId: string;
  symbol: string;
}>();

const columns = [
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

const backToTrades = () => {
  router.push({ name: OrdersPageName, params: { symbol: props.symbol } });
};

const getTrades = () => {
  const orderId = props.orderId;
  const symbol = props.symbol;
  if (orderId && symbol)
    ApiClient.Trades.getById(symbol, orderId)
      .then((res) => {
        if (res) myTrades.value = res;
        else {
          isFromBinance.value = true;
          message.warning(`No saved trades found, getting from Binance...`);
          ApiClient.Trades.getBinanceById(symbol, orderId)
            .then((res) => {
              if (res) myTrades.value = res;
              else message.warning(`Error getting trades`);
            })
            .catch((err: BinanceError) =>
              message.error(err.response?.data?.msg || `Error getting trades`)
            );
        }
      })
      .catch((err: BinanceError) =>
        message.error(err.response?.data?.msg || `Error getting trades`)
      );
  else message.warning(`Error getting trade`);
};

getTrades();
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
