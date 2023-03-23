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
      :disabled="!account || !binance.exchangeInfo"
      >New Order</a-button
    >
    <a-button
      class="m1"
      type="primary"
      @click="newOCOOrderModalVisible = true"
      :disabled="!account || !binance.exchangeInfo"
      >New OCO Order</a-button
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
      v-if="binance.exchangeInfo && account"
      :symbol="symbol"
      :visible="newOrderModalVisible"
      :tokens="binance.exchangeInfo?.symbols"
      :balances="account?.balances"
      @close="newOrderModalVisible = false"
    />
    <NewOrderModal
      v-if="binance.exchangeInfo && account"
      :isOCO="true"
      :symbol="symbol"
      :visible="newOCOOrderModalVisible"
      :tokens="binance.exchangeInfo?.symbols"
      :balances="account?.balances"
      @close="newOCOOrderModalVisible = false"
    />
    <a-divider />
    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane key="open" tab="Open Orders">
        <OrderList :symbol="symbol" />
      </a-tab-pane>
      <a-tab-pane key="open-oco" tab="Open OCO Orders">
        <OrderOCOList :symbol="symbol" />
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
      >Get Orders</a-button
    >
  </div>
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import { computed, ref, watch } from "vue";
import { ApiClient } from "../api/server";
import NewOrderModal from "../components/Orders/NewOrderModal.vue";
import OrderList from "../components/Orders/OrderList.vue";
import OrderOCOList from "../components/Orders/OrderOCOList.vue";
import { Account } from "../models/trade";
import { OrdersPageName, router } from "../router";
import { loading, setIsLoading } from "../services/utils";
import { useBinanceStore } from "../stores/binance";

const props = defineProps<{
  symbol?: string;
}>();

const symbol = ref(props.symbol);

const activeKey = ref("open");

const account = ref<Account>();
const binance = useBinanceStore();

const asset = computed(() =>
  account.value?.balances.find((s) => symbol.value?.startsWith(s.asset))
);

const selectedSymbol = ref(symbol.value || "");

const options = ref<any>(
  binance.exchangeInfo.symbols.map((t) => ({
    ...t,
    value: t.symbol,
  }))
);
const originalOptions = ref(options.value);

const onSearch = (searchText: string) => {
  options.value = originalOptions.value?.filter((o: any) =>
    o.symbol.toUpperCase().includes(searchText.toUpperCase())
  );
};

const selectSymbol = () => {
  symbol.value = selectedSymbol.value;
  router.push({ name: OrdersPageName, params: { symbol: symbol.value } });
};

const openOnBinance = () => {
  window.open(`https://www.binance.com/en/trade/${symbol.value}`, "_blank");
};

const sellAll = () => {
  if (!symbol.value) return;
  setIsLoading(true);
  ApiClient.Orders.sellAll(symbol.value)
    .then((res) => {
      if (res) {
        getAccount();
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

const newOrderModalVisible = ref(false);
const newOCOOrderModalVisible = ref(false);

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
