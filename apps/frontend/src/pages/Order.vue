<template>
  <div v-if="transaction">
    <h2>Transaction Id: {{ transaction?.orderId }}</h2>
    <a-row class="w100">
      <a-col :span="12">
        <p>
          Symbol <a-tag>{{ transaction.symbol }}</a-tag>
        </p>
        <p>
          Transact Time
          {{ new Date(transaction.time).toLocaleString() }}
        </p>
        <p>
          Status <a-tag>{{ transaction.status }}</a-tag>
        </p>
        <p>
          Executed Quantity <a-tag>{{ transaction.executedQty }}</a-tag>
        </p>
        <p>
          Original Quantity <a-tag>{{ transaction.origQty }}</a-tag>
        </p>
        <p>
          Price <a-tag>{{ transaction.price }}</a-tag>
        </p>
      </a-col>
      <a-col :span="12">
        <p>
          Type <a-tag>{{ transaction.type }}</a-tag>
        </p>
        <p>
          Side <a-tag>{{ transaction.side }}</a-tag>
        </p>
        <p>
          Time In Force <a-tag>{{ transaction.timeInForce }}</a-tag>
        </p>
        <p>
          Stop Price <a-tag>{{ transaction.stopPrice }}</a-tag>
        </p>
        <a-button
          type="primary"
          @click="showFullTransaction = !showFullTransaction"
          >Show Full Transaction</a-button
        >
      </a-col>
    </a-row>
    <a-divider />
    <a-row>
      <a-col :span="12">
        <code v-if="showFullTransaction">
          {{ formatJSON(transaction) }}
        </code>
      </a-col>
      <a-col :span="12">
        <h3>Actions</h3>
        <a-button
          type="danger"
          class="m1"
          @click="cancelOrder"
          :disabled="transaction.status == 'FILLED'"
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
import { Server } from "../api/server";
import { BinanceError } from "../models/binance";
import { BinanceOrderDetails } from "../models/orders";

const transaction = ref<BinanceOrderDetails>();

const props = defineProps<{
  orderId: string;
  symbol: string;
}>();

const showFullTransaction = ref(false);

const getTransaction = () => {
  const orderId = props.orderId;
  const symbol = props.symbol;
  if (orderId && symbol)
    Server.Transaction.getById(symbol, String(orderId))
      .then((res) => {
        if (res) transaction.value = res;
        else message.warning(`Error getting transaction`);
      })
      .catch((err: BinanceError) =>
        message.error(err.response?.data?.msg || `Error getting transaction`)
      );
  else message.warning(`Error getting transaction`);
};

const formatJSON = (json: any) => {
  return JSON.stringify(json, null, 2);
};

const cancelOrder = () => {
  if (transaction.value?.orderId)
    Server.Orders.cancel(
      transaction.value.symbol,
      String(transaction.value.orderId)
    )
      .then((res) => {
        if (res) {
          message.success(`Order cancelled`);
          getTransaction();
        } else message.warning(`Error cancelling order`);
      })
      .catch((err: BinanceError) =>
        message.error(err.response?.data?.msg || `Error cancelling order`)
      );
};

getTransaction();
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
