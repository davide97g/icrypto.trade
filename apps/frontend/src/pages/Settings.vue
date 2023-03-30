<template>
  <h1>Settings</h1>
  <a-tabs v-model:activeKey="activeKey" style="margin-top: 50px">
    <a-tab-pane key="server-config" tab="Bot Configuration">
      <ServerConfig />
    </a-tab-pane>
    <a-tab-pane key="banned-tokens" tab="Banned Tokens">
      <BannedTokens />
    </a-tab-pane>
    <a-tab-pane key="symbols" tab="Symbols Info" v-if="exchangeInfo">
      <Symbols :symbols="exchangeInfo?.symbols" />
    </a-tab-pane>
    <a-tab-pane key="logs" tab="Logs">
      <Logs />
    </a-tab-pane>
  </a-tabs>
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import { ref } from "vue";
import { ApiClient } from "../api/server";
import BannedTokens from "../components/Settings/BannedTokens.vue";
import Logs from "../components/Settings/Logs.vue";
import ServerConfig from "../components/Settings/ServerConfig.vue";
import Symbols from "../components/Settings/Symbols.vue";
import { ExchangeInfo } from "../models/account";

const activeKey = ref("server-config");

const exchangeInfo = ref<ExchangeInfo>();

const getExchangeInfo = () =>
  ApiClient.Trades.getExchangeInfo()
    .then((res) => {
      if (res) {
        exchangeInfo.value = res;
      } else {
        message.error(`Error getting exchange info`);
      }
    })
    .catch((err) => {
      console.error(err);
      message.error(`Error getting exchange info`);
    });

getExchangeInfo();
</script>
