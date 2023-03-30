<template>
  <div v-if="order && !loading">
    <h2>OCO Order Id: {{ order?.orderId }}</h2>
    <a-row class="w100">
      <a-col :span="12">
        <p>
          Symbol <a-tag>{{ order.symbol }}</a-tag>
        </p>
        <p>
          Transact Time
          {{ new Date(order.time).toLocaleString() }}
        </p>
        <p>
          Status <a-tag>{{ order.status }}</a-tag>
        </p>
        <p>
          Executed Quantity <a-tag>{{ order.executedQty }}</a-tag>
        </p>
        <p>
          Original Quantity <a-tag>{{ order.origQty }}</a-tag>
        </p>
        <p>
          Price <a-tag>{{ order.price }}</a-tag>
        </p>
      </a-col>
      <a-col :span="12">
        <p>
          Type <a-tag>{{ order.type }}</a-tag>
        </p>
        <p>
          Side <a-tag>{{ order.side }}</a-tag>
        </p>
        <p>
          Time In Force <a-tag>{{ order.timeInForce }}</a-tag>
        </p>
        <p>
          Stop Price <a-tag>{{ order.stopPrice }}</a-tag>
        </p>
        <a-button type="primary" @click="showFullOrder = !showFullOrder"
          >Show Full Order</a-button
        >
      </a-col>
    </a-row>
    <a-divider />
    <a-row>
      <a-col :span="12">
        <code v-if="showFullOrder">
          {{ formatJSON(order) }}
        </code>
      </a-col>
      <a-col :span="12">
        <h3>Actions</h3>
        <a-button
          type="danger"
          class="m1"
          @click="cancelOrder"
          :disabled="order.status == 'FILLED'"
        >
          Cancel
        </a-button>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import { ref } from "vue";
import { ApiClient } from "../api/server";
import { BinanceError } from "icrypto.trade-types/binance";
import { BinanceOrderDetails } from "icrypto.trade-types/orders";
import { loading } from "../services/utils";

const order = ref<BinanceOrderDetails>();

const props = defineProps<{
  orderId: string;
  symbol: string;
}>();

const showFullOrder = ref(false);

const getOrder = () => {
  const orderId = props.orderId;
  const symbol = props.symbol;
  if (orderId && symbol)
    ApiClient.Orders.getById(symbol, orderId)
      .then((res) => {
        if (res) order.value = res;
        else message.warning(`Error getting order`);
      })
      .catch((err: BinanceError) =>
        message.error(err.response?.data?.msg || `Error getting order`)
      );
  else message.warning(`Error getting order`);
};

const formatJSON = (json: any) => {
  return JSON.stringify(json, null, 2);
};

const cancelOrder = () => {
  if (order.value?.orderId)
    ApiClient.Orders.cancel(order.value.symbol, String(order.value.orderId))
      .then((res) => {
        if (res) {
          message.success(`Order cancelled`);
          getOrder();
        } else message.warning(`Error cancelling order`);
      })
      .catch((err: BinanceError) =>
        message.error(err.response?.data?.msg || `Error cancelling order`)
      );
};

getOrder();
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
