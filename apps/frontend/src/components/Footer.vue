<script setup lang="ts">
import { ref } from "vue";
import packageJson from "../../package.json";
import { ApiClient } from "../api/server";
const serverVersion = ref("?.?.?");
ApiClient.Server.getInfo().then((res) => {
  if (res) serverVersion.value = res.version;
});
</script>

<template>
  <div style="height: 30px">
    <p id="server-version">ApiClient: v{{ serverVersion }}</p>
    <p id="version">Website: v{{ packageJson.version }}</p>
  </div>
</template>

<style scoped>
#server-version {
  margin: 0;
  position: absolute;
  bottom: 5px;
  left: 5px;
  text-align: left;
  font-size: 10px;
}
#version {
  margin: 0;
  position: absolute;
  bottom: 5px;
  right: 5px;
  text-align: right;
  font-size: 10px;
}
</style>
