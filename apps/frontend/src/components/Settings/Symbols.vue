<template>
  <div>
    <p>TODO</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
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
</script>

<style lang="scss" scoped>
.klines-list {
  height: calc(100vh - 300px);
  overflow-y: auto;
}
</style>
