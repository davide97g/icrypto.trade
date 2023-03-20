<template>
  <MenuOutlined @click="visible = true" />
  <a-drawer
    :bodyStyle="{ position: 'relative' }"
    :width="300"
    :title="'Menu'"
    placement="right"
    :visible="visible"
    @close="visible = false"
  >
    <div class="vertical-menu">
      <router-link class="m1" :to="{ name: LoginPageName }" v-if="!isLoggedIn">
        <a-button type="danger" @click="visible = false">Login</a-button>
      </router-link>
      <router-link class="m1" :to="{ name: NewsPageName }" v-if="isLoggedIn">
        <a-button type="primary" ghost @click="visible = false">News</a-button>
      </router-link>
      <router-link class="m1" :to="{ name: TradesPageName }" v-if="isAdmin">
        <a-button type="primary" ghost @click="visible = false"
          >Trades</a-button
        >
      </router-link>
      <router-link class="m1" :to="{ name: OrdersPageName }" v-if="isAdmin">
        <a-button type="primary" ghost @click="visible = false"
          >Orders</a-button
        >
      </router-link>
      <router-link class="m1" :to="{ name: AssetsPageName }" v-if="isAdmin">
        <a-button type="primary" ghost @click="visible = false"
          >Assets</a-button
        >
      </router-link>
      <router-link class="m1" :to="{ name: SettingsPageName }" v-if="isAdmin">
        <a-button type="primary" ghost @click="visible = false"
          >Settings</a-button
        >
      </router-link>
    </div>
    <Footer />
  </a-drawer>
</template>
<script lang="ts" setup>
import { MenuOutlined } from "@ant-design/icons-vue";
import { ref } from "vue";
import {
  LoginPageName,
  NewsPageName,
  SettingsPageName,
  AssetsPageName,
  OrdersPageName,
  TradesPageName,
} from "../../router";
import { isLoggedIn, isAdmin } from "../../services/utils";
import Footer from "../Footer.vue";

const visible = ref<boolean>(false);
</script>

<style scoped lang="scss">
.vertical-menu {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>
