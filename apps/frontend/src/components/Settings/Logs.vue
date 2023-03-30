<template>
  <a-button type="danger" @click="startLogs">Start Logs</a-button>
  <a-button type="primary" @click="updateLogs" :disabled="!isStarted"
    >Update Logs</a-button
  >
  <a-divider />
  <a-typography-title :level="3">Logs</a-typography-title>
  <a-textarea
    v-model:value="logString"
    :rows="35"
    :class="{ mobile: isMobile }"
    class="logs text small"
  />
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import { computed, ref } from "vue";
import { ApiClient } from "../../api/server";
import { ServerLog } from "icrypto.trade-types/bot";
import { isMobile } from "../../services/utils";

const logs = ref<ServerLog[]>([]);

const isStarted = ref(false);

const sortLogs = (logs: ServerLog[]) =>
  logs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

const startLogs = () => {
  ApiClient.Bot.startLogs()
    .then(() => {
      isStarted.value = true;
      message.success("Started logs");
      updateLogs();
    })
    .catch((err) => {
      console.log(err);
      message.error("Failed to start logs");
    });
};

const updateLogs = () => {
  ApiClient.Bot.getLogs()
    .then((res) => {
      logs.value = sortLogs(res);
    })
    .catch((err) => {
      console.log(err);
      message.error("Failed to get logs");
    });
};

const logString = computed(() =>
  logs.value
    .map((log) => {
      const date =
        new Date(log.timestamp).toLocaleDateString() +
        " " +
        new Date(log.timestamp).toLocaleTimeString();
      return [date, log.message].join(" - ");
    })
    .join("\n")
);
</script>

<style lang="scss" scoped>
pre {
  white-space: pre-wrap; /* Since CSS 2.1 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
}

.logs {
  max-height: 500px;
  overflow-y: auto;
  max-width: calc(100vw - 20px);
  &.mobile {
    max-height: 450px;
  }
}
</style>
