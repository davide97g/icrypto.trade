<template>
  <header
    style="
      height: 60px;
      overflow: hidden;
      justify-content: space-between;
      padding: 10px;
      position: relative;
    "
    class="flex-center"
  >
    <div class="flex-center">
      <Avatar :position="'topRight'" :relative="true" />
      <a-badge-ribbon
        style="font-size: 12px; font-weight: 600"
        :text="serverInfo?.env"
        :color="serverInfo?.env == 'test' ? 'green' : 'volcano'"
      >
        <h3 style="margin: 10px 5px; padding: 15px 0px">Crypto Feed Trader</h3>
      </a-badge-ribbon>
    </div>
    <div class="menu-links" v-if="isLoggedIn !== undefined">
      <router-link class="m1" :to="{ name: LoginPageName }" v-if="!isLoggedIn">
        <a-button type="danger">Login</a-button>
      </router-link>
      <router-link class="m1" :to="{ name: NewsPageName }" v-if="isLoggedIn">
        <a-button type="primary" ghost>News</a-button>
      </router-link>
      <router-link class="m1" :to="{ name: OrdersPageName }" v-if="isAdmin">
        <a-button type="primary" ghost>Orders</a-button>
      </router-link>
      <router-link class="m1" :to="{ name: AssetsPageName }" v-if="isAdmin">
        <a-button type="primary" ghost>Assets</a-button>
      </router-link>
      <router-link class="m1" :to="{ name: SettingsPageName }" v-if="isAdmin">
        <a-button type="primary" ghost>Settings</a-button>
      </router-link>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  LoginPageName,
  SettingsPageName,
  OrdersPageName,
  NewsPageName,
  AssetsPageName,
} from "../router";
import { isLoggedIn, isAdmin } from "../services/utils";
import Avatar from "../components/Avatar.vue";
import { Server } from "../api/server";
import { ref } from "vue";
import { message } from "ant-design-vue";

const serverInfo = ref<{
  version: string;
  env: "test" | "production";
}>();

const getServerInfo = async () => {
  Server.getServerInfo()
    .then((res) => (serverInfo.value = res))
    .catch((err) => {
      console.error(err);
      message.error("Failed to get server info");
    });
};

getServerInfo();
</script>

<style lang="scss" scoped>
.menu-links {
  display: flex;
  flex-grow: 1;
  margin: 0 10px;
  justify-content: flex-end;
}
</style>
