<template>
  <div id="server-config-layout" :class="{ mobile: isMobile }">
    <div class="m1 left">
      <h3>Bot 🤖</h3>
      <h4 v-if="infoWS?.startTime">
        Running since: {{ new Date(infoWS?.startTime).toLocaleDateString() }}
        {{ new Date(infoWS?.startTime).toLocaleTimeString() }}
      </h4>
      <a-button type="info" @click="startWS" :disabled="infoWS?.isRunning"
        >Start</a-button
      >
      <a-button type="danger" @click="stopWS" :disabled="!infoWS?.isRunning"
        >Stop</a-button
      >
    </div>
    <div class="m1 left">
      <h3>Trade Config</h3>
      <div class="flex-center column w100 left" style="align-items: baseline">
        <div>
          <span>N Likes</span>
          <a-input-number
            id="nLikes"
            v-model:value="tradeConfig.nLikes"
            placeholder="N Likes"
            style="width: 50px; margin: 10px"
          />
        </div>
        <div>
          <span>N Minutes</span>
          <a-input-number
            v-model:value="tradeConfig.nMinutes"
            placeholder="N Minutes"
            style="width: 50px; margin: 10px"
          />
        </div>
        <div>
          <span>Take Profit %</span>
          <a-input-number
            v-model:value="tradeConfig.takeProfitPercentage"
            placeholder="Take Profit"
            style="width: 50px; margin: 10px"
          />
        </div>
        <div>
          <span>Stop Loss %</span>
          <a-input-number
            v-model:value="tradeConfig.stopLossPercentage"
            placeholder="Stop Loss"
            style="width: 50px; margin: 10px"
          />
        </div>
        <div>
          <span>Feed Limit</span>
          <a-input-number
            v-model:value="tradeConfig.feedLimit"
            placeholder="Feed Limit"
            style="width: 50px; margin: 10px"
          />
        </div>
        <div>
          <span>Trade Amount</span>
          <a-input-number
            v-model:value="tradeConfig.tradeAmount"
            placeholder="Trade Amount"
            style="width: 50px; margin: 10px"
          />
        </div>
      </div>
      <a-button type="primary" @click="updateTradeConfig"
        >Update Config</a-button
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { TradeConfig } from "icrypto.trade-types/bot";
import { ApiClient } from "../../api/server";
import { message } from "ant-design-vue";
import { isMobile } from "../../services/utils";

const originalTradeConfig = ref<TradeConfig>({
  feedLimit: 0,
  nLikes: 0,
  nMinutes: 0,
  takeProfitPercentage: 0,
  stopLossPercentage: 0,
  tradeAmount: 0,
});
const tradeConfig = ref<TradeConfig>(originalTradeConfig.value);

watch(
  () => originalTradeConfig.value,
  (newVal) => {
    tradeConfig.value = newVal;
  }
);

const getTradeConfig = async () => {
  await ApiClient.Bot.getTradeConfig()
    .then((res) => {
      if (res) originalTradeConfig.value = res;
    })
    .catch((err) => {
      console.error(err);
      message.error("Error getting trade config");
    });
};

const updateTradeConfig = async () => {
  await ApiClient.Bot.updateTradeConfig(tradeConfig.value)
    .then((res) => {
      if (res) {
        message.success("Trade config updated");
        getTradeConfig();
      }
    })
    .catch((err) => {
      console.error(err);
      message.error("Error updating trade config");
    });
};

const infoWS = ref<{
  isRunning: boolean;
  startTime: number;
}>();

const getWSInfo = () =>
  ApiClient.Bot.get()
    .then((res) => {
      if (res) infoWS.value = res;
    })
    .catch((err) => console.log(err));

const startWS = async () => {
  await ApiClient.Bot.start()
    .then((res) => {
      if (res) message.success("Bot Started 🤖");
    })
    .catch((err) => {
      console.error(err);
      message.error(err.message);
    })
    .finally(() => getWSInfo());
};

const stopWS = async () => {
  await ApiClient.Bot.stop()
    .then((res) => {
      if (res) message.success(res.message);
    })
    .catch((err) => {
      console.error(err);
      message.error(err.message);
    })
    .finally(() => getWSInfo());
};

getTradeConfig();
getWSInfo();
</script>

<style lang="scss" scoped>
#server-config-layout {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: space-around;
  &.mobile {
    flex-direction: column;
    padding: 0;
  }
}
</style>
