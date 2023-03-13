<template>
  <a-row>
    <a-auto-complete
      v-model:value="selectedSymbol"
      :options="options"
      style="width: 200px"
      placeholder="Select Token"
      @search="onSearch"
    />
    <a-button type="primary" @click="getKlines" :disabled="!selectedSymbol"
      >Get Klines</a-button
    >
  </a-row>
  <br />
  <a-row v-if="selectedSymbol">
    <a-input-number
      v-model:value="averageMove24h"
      style="width: 200px"
      :step="0.00000000000001"
      string-mode
      disabled
    />
    <a-button type="primary" @click="getAverageMove24h"
      >Get Average Move 24h</a-button
    >
  </a-row>
  <a-divider />
  <div class="klines-table">
    <a-table
      v-if="klines.length > 0"
      :columns="columns"
      :rowKey="(record:Kline) => record.openTime"
      :data-source="klines"
      :pagination="{ pageSize: 10 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.title === 'Open Time'">
          {{ new Date(record.openTime).toLocaleString() }}
        </template>
        <template v-if="column.title === 'Close Time'">
          {{ new Date(record.closeTime).toLocaleString() }}
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import { ref } from "vue";
import { Server } from "../../api/server";
import { ExchangeInfoSymbol, Kline } from "../../models/trade";

const props = defineProps<{
  symbols: ExchangeInfoSymbol[];
}>();

const columns = [
  {
    title: "Open Time",
    dataIndex: "openTime",
    width: 2,
  },
  {
    title: "Open",
    dataIndex: "open",
    width: 1,
    ellipsis: true,
  },
  {
    title: "High",
    dataIndex: "high",
    width: 1,
    ellipsis: true,
  },
  {
    title: "Low",
    dataIndex: "low",
    width: 1,
    ellipsis: true,
  },
  {
    title: "Close",
    dataIndex: "close",
    width: 1,
    ellipsis: true,
  },
  {
    title: "Volume",
    dataIndex: "volume",
    width: 1,
    ellipsis: true,
  },
  {
    title: "Close Time",
    dataIndex: "closeTime",
    width: 2,
    sorter: (a: Kline, b: Kline) => a.closeTime - b.closeTime,
  },
  {
    title: "Quote Asset Volume",
    dataIndex: "quoteAssetVolume",
    width: 1,
    ellipsis: true,
  },
  {
    title: "Number of Trades",
    dataIndex: "numberOfTrades",
    width: 1,
    ellipsis: true,
  },
  {
    title: "Taker buy base asset volume",
    dataIndex: "takerBuyBaseAssetVolume",
    width: 1,
    ellipsis: true,
  },
  {
    title: "Taker buy quote asset volume",
    dataIndex: "takerBuyQuoteAssetVolume",
    width: 1,
    ellipsis: true,
  },
];

const selectedSymbol = ref("");

const options = ref(props.symbols.map((t) => ({ ...t, value: t.symbol })));
const originalOptions = ref(options.value);

const onSearch = (searchText: string) => {
  options.value = originalOptions.value.filter((o) =>
    o.symbol.toUpperCase().includes(searchText.toUpperCase())
  );
};

const klines = ref<Kline[]>([]);

const getKlines = async () => {
  await Server.Symbols.getKlines(selectedSymbol.value)
    .then((res) => (klines.value = res))
    .catch((err) => {
      console.log(err);
      message.error(err.message);
    });
};

const averageMove24h = ref(0);

const getAverageMove24h = async () => {
  await Server.Symbols.getAverageMove24h(selectedSymbol.value)
    .then((res) => (averageMove24h.value = res))
    .catch((err) => {
      console.log(err);
      message.error(err.message);
    });
};
</script>

<style lang="scss" scoped>
.klines-list {
  height: calc(100vh - 300px);
  overflow-y: auto;
}
</style>
