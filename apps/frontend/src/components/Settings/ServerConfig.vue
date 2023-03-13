<template>
  <div class="flex-center w100" style="align-items: baseline">
    <div class="m1">
      <h3>Scheduler</h3>
      <h4 v-if="info?.startTime">
        Running since: {{ new Date(info?.startTime).toLocaleDateString() }}
        {{ new Date(info?.startTime).toLocaleTimeString() }}
      </h4>
      <a-button type="info" @click="startScheduler" :disabled="info?.running"
        >Start Scheduler</a-button
      >
      <a-button type="danger" @click="stopScheduler" :disabled="!info?.running"
        >Stop Scheduler</a-button
      >
    </div>
    <div class="m1">
      <h3>Scheduler Trade Config</h3>
      <div class="flex-center column w100" style="align-items: baseline">
        <div>
          <span>N Likes</span>
          <a-input-number
            id="nLikes"
            v-model:value="tradeConfig.nLikes"
            placeholder="N Likes"
            style="width: 250px; margin: 10px"
          />
        </div>
        <div>
          <span>N Minutes</span>
          <a-input-number
            v-model:value="tradeConfig.nMinutes"
            placeholder="N Minutes"
            style="width: 250px; margin: 10px"
          />
        </div>
        <div>
          <span>Take Profit %</span>
          <a-input-number
            v-model:value="tradeConfig.takeProfitPercentage"
            placeholder="Take Profit"
            style="width: 250px; margin: 10px"
          />
        </div>
        <div>
          <span>Stop Loss %</span>
          <a-input-number
            v-model:value="tradeConfig.stopLossPercentage"
            placeholder="Stop Loss"
            style="width: 250px; margin: 10px"
          />
        </div>
      </div>
      <div class="flex-center column w100" style="align-items: baseline">
        <div>
          <span>Feed Limit</span>
          <a-input-number
            v-model:value="tradeConfig.feedLimit"
            placeholder="Feed Limit"
            style="width: 250px; margin: 10px"
          />
        </div>
        <div>
          <span>Feed Update Interval</span>
          <a-input-number
            v-model:value="tradeConfig.feedUpdateInterval"
            placeholder="Feed Update Interval"
            style="width: 250px; margin: 10px"
          />
        </div>
        <div>
          <span>Good News Update Interval</span>
          <a-input-number
            v-model:value="tradeConfig.goodNewsUpdateInterval"
            placeholder="Good News Update Interval"
            style="width: 250px; margin: 10px"
          />
        </div>
        <div>
          <span>TTL (Old news)</span>
          <a-input-number
            v-model:value="tradeConfig.TTL"
            placeholder="TTL"
            style="width: 250px; margin: 10px"
          />
        </div>
        <div>
          <span>Mock Symbol</span>
          <a-switch
            v-model:checked="tradeConfig.mockSymbol"
            style="margin: 10px"
          />
        </div>
        <div>
          <span>Trade Amount</span>
          <a-input-number
            v-model:value="tradeConfig.tradeAmount"
            placeholder="Trade Amount"
            style="width: 250px; margin: 10px"
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
import { TradeConfig } from "../../models/trade";
import { Server } from "../../api/server";
import { message } from "ant-design-vue";

const originalTradeConfig = ref<TradeConfig>({
  feedLimit: 0,
  feedUpdateInterval: 0,
  goodNewsUpdateInterval: 0,
  TTL: 0,
  nLikes: 0,
  nMinutes: 0,
  takeProfitPercentage: 0,
  stopLossPercentage: 0,
  mockSymbol: false,
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
  await Server.Scheduler.getTradeConfig()
    .then((res) => {
      if (res) originalTradeConfig.value = res;
    })
    .catch((err) => {
      console.error(err);
      message.error("Error getting trade config");
    });
};

const updateTradeConfig = async () => {
  await Server.Scheduler.updateTradeConfig(tradeConfig.value)
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

const info = ref<{
  running: boolean;
  startTime: number;
}>();

const getFeedInfo = () =>
  Server.Scheduler.getScheduler()
    .then((res) => (info.value = res))
    .catch((err) => console.log(err));

const startScheduler = async () => {
  await Server.Scheduler.startScheduler()
    .then(() => message.success("Scheduler started"))
    .catch((err) => {
      console.error(err);
      message.error(err.message);
    })
    .finally(() => getFeedInfo());
};

const stopScheduler = async () => {
  await Server.Scheduler.stopScheduler()
    .then(() => message.success("Scheduler stopped"))
    .catch((err) => {
      console.error(err);
      message.error(err.message);
    })
    .finally(() => getFeedInfo());
};

getTradeConfig();
getFeedInfo();
</script>
