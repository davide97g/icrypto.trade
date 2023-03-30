<template>
  <a-button
    type="primary"
    title="Refresh my trades"
    class="m1"
    @click="getMyTrades"
    >Refresh</a-button
  >
  <a-table
    class="ant-table-custom"
    :columns="cols"
    :rowKey="(record:MyTrade) => record.id"
    :data-source="myTrades"
    :pagination="{ pageSize: 10 }"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.title === 'Id' && !isMobile">
        <CopyOutlined
          v-if="!isMobile"
          style="cursor: pointer; margin-right: 10px"
          @click="copyToClipboard(record.orderId)"
        />
        <p class="text small">
          {{ record.orderId }}
        </p>
        <WalletOutlined
          v-if="!isMobile"
          style="cursor: pointer; margin-right: 10px"
          @click="openTradeDetails(record.symbol, record.orderId)"
        />
      </template>
      <template v-if="column.title === 'Symbol'">
        <a-tag>{{ record.symbol }}</a-tag>
      </template>
      <template v-if="column.title === 'Side'">
        <a-tag :color="record.isBuyer ? 'green' : 'red'" class="text small">{{
          record.isBuyer ? "BUY" : "SELL"
        }}</a-tag>
      </template>
      <template v-if="column.title === 'Price' && !isMobile">
        <a-tag class="strong text small">{{
          roundToNDigits(record.price, 5)
        }}</a-tag>
      </template>
      <template v-if="column.title === 'Quantity' && !isMobile">
        <a-tag class="strong text small">{{
          roundToNDigits(record.qty, 3)
        }}</a-tag>
      </template>
      <template v-if="column.title === 'Quantity x Price' && isMobile">
        <a-tag class="strong text small"
          >{{ roundToNDigits(record.qty, 3) }} x
          {{ roundToNDigits(record.price, 4) }}</a-tag
        >
      </template>
      <template v-if="column.title === 'Date'">
        <p class="text small">
          {{ new Date(record.time).toLocaleString() }}
        </p>
      </template>
    </template>
    <template #expandedRowRender="{ record }">
      <div class="text small">
        <p v-if="isMobile">
          Id:
          <a-tag class="text small">{{ record.orderId }}</a-tag>
        </p>
        <p>
          Commission:
          <a-tag class="text small"
            >{{ record.commission }} {{ record.commissionAsset }}
          </a-tag>
        </p>
      </div>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import {
  copyToClipboard,
  isMobile,
  roundToNDigits,
} from "../../services/utils";
import { message } from "ant-design-vue";
import { computed, ref, watch } from "vue";
import { ApiClient } from "../../api/server";
import { setIsLoading } from "../../services/utils";
import { CopyOutlined, WalletOutlined } from "@ant-design/icons-vue";
import { router, TradePageName } from "../../router";
import { MyTrade } from "icrypto.trade-types/binance";

const props = defineProps<{
  symbol?: string;
}>();

const symbol = ref(props.symbol);

watch(
  () => props.symbol,
  (newSymbol) => {
    symbol.value = newSymbol?.includes("USDT") ? newSymbol : newSymbol + "USDT";
    getMyTrades();
  }
);

const myTrades = ref<MyTrade[]>([]);

const columnsDesktop = [
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
const columnsMobile = [
  {
    title: "Side",
    dataIndex: "isBuyer",
    width: "5",
  },
  {
    title: "Quantity x Price",
    width: "20",
  },
  {
    title: "Date",
    dataIndex: "time",
    width: "20",
    sorter: (a: MyTrade, b: MyTrade) => a.time - b.time,
  },
];

const cols = computed(() => (isMobile.value ? columnsMobile : columnsDesktop));

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
