<template>
  <header
    style="
      height: 60px;
      overflow: hidden;
      justify-content: space-around;
      padding: 10px;
      position: relative;
    "
    class="flex-center full-width"
  >
    <div class="flex-center flex-start grow">
      <Avatar :position="'topRight'" :relative="true" />
      <a-badge-ribbon
        style="font-size: 12px; font-weight: 600"
        :text="serverInfo?.env"
        :color="serverInfo?.env == 'test' ? 'green' : 'volcano'"
      >
        <h3 style="margin: 10px 5px; padding: 15px 0px">Crypto Feed Trader</h3>
      </a-badge-ribbon>
    </div>
    <DesktopMenu v-if="!isMobile" />
    <MobileMenu v-else />
  </header>
</template>

<script setup lang="ts">
import Avatar from "../components/Avatar.vue";
import { ApiClient } from "../api/server";
import { ref } from "vue";
import { message } from "ant-design-vue";
import DesktopMenu from "./Menu/DesktopMenu.vue";
import MobileMenu from "./Menu/MobileMenu.vue";
import { isMobile } from "../services/utils";

const serverInfo = ref<{
  version: string;
  env: "test" | "production";
}>();

const ServerGetInfo = async () => {
  ApiClient.Server.getInfo()
    .then((res) => (serverInfo.value = res))
    .catch((err) => {
      console.error(err);
      message.error("Failed to get server info");
    });
};

ServerGetInfo();
</script>

<style lang="scss" scoped>
.menu-links {
  display: flex;
  flex-grow: 1;
  margin: 0 10px;
  justify-content: flex-end;
}
#header {
  position: absolute;
  height: 70px;
  top: 0;
  background-color: salmon;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
}
</style>
