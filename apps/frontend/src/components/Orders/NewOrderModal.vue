<template>
  <a-modal
    v-model:visible="visible"
    title="New Order"
    :confirm-loading="confirmLoading"
    @cancel="emits('close')"
  >
    <a-row>
      <a-col :span="4">
        <p>Symbol</p>
      </a-col>
      <a-col :span="20">
        <a-auto-complete
          v-model:value="newOrderRequest.symbol"
          :options="options"
          style="width: 200px"
          placeholder="Select Token"
          @search="onSearch"
        />
      </a-col>
    </a-row>
    <a-row>
      <a-col :span="4">
        <p>Side</p>
      </a-col>
      <a-col :span="20">
        <a-radio-group v-model:value="newOrderRequest.side">
          <a-radio-button value="BUY">Buy</a-radio-button>
          <a-radio-button value="SELL">Sell</a-radio-button>
        </a-radio-group>
      </a-col>
    </a-row>

    <a-row>
      <a-col :span="4">
        <p>Type</p>
      </a-col>
      <a-col :span="20">
        <a-select
          ref="select"
          v-model:value="newOrderRequest.type"
          style="width: 200px"
        >
          <a-select-option value="MARKET">MARKET</a-select-option>
          <a-select-option value="LIMIT">LIMIT</a-select-option>
          <a-select-option value="STOP_LOSS">STOP LOSS</a-select-option>
          <a-select-option value="STOP_LOSS_LIMIT"
            >STOP LOSS LIMIT</a-select-option
          >
          <a-select-option value="TAKE_PROFIT">TAKE PROFIT</a-select-option>
          <a-select-option value="TAKE_PROFIT_LIMIT"
            >TAKE PROFIT LIMIT</a-select-option
          >
          <a-select-option value="LIMIT_MAKER">LIMIT_MAKER</a-select-option>
        </a-select>
      </a-col>
    </a-row>

    <a-row>
      <a-col :span="4">
        <p>Quantity</p>
      </a-col>
      <a-col :span="20">
        <a-input-number v-model:value="newOrderRequest.quantity" :min="0" />
      </a-col>
    </a-row>

    <a-row>
      <a-col :span="4">
        <p>Price</p>
      </a-col>
      <a-col :span="20">
        <a-input-number v-model:value="newOrderRequest.price" :min="0" />
      </a-col>
    </a-row>

    <template #footer>
      <a-button @click="emits('close')">Cancel</a-button>
      <a-button
        type="primary"
        @click="handleOk"
        :disabled="!newOrderRequest.symbol"
        >Place Order</a-button
      >
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ExchangeInfoSymbol, NewOrderRequest } from "../../models/trade";
import { ApiClient } from "../../api/server";
import { message } from "ant-design-vue";

const props = defineProps<{
  visible: boolean;
  tokens: ExchangeInfoSymbol[];
}>();

const emits = defineEmits(["close"]);

const visible = ref(false);
const confirmLoading = ref(false);

const newOrderRequest = ref<NewOrderRequest>({} as NewOrderRequest);

watch(
  () => props.visible,
  (val) => {
    visible.value = val;
  }
);

const handleOk = () => {
  confirmLoading.value = true;
  ApiClient.Orders.newOrder(newOrderRequest.value)
    .then((res) => {
      if (res) {
        emits("close");
        message.success("Order Placed");
      } else {
        message.error("Order Failed");
      }
    })
    .catch((err) => {
      console.log(err);
      message.error(err.message);
    })
    .finally(() => {
      confirmLoading.value = false;
    });
};
const options = ref(props.tokens.map((t) => ({ ...t, value: t.symbol })));
const originalOptions = ref(options.value);

const onSearch = (searchText: string) => {
  options.value = originalOptions.value.filter((o) =>
    o.symbol.toUpperCase().includes(searchText.toUpperCase())
  );
};
</script>
