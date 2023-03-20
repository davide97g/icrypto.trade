<template>
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
    <router-link class="m1" :to="{ name: TradesPageName }" v-if="isAdmin">
      <a-button type="primary" ghost>Trades</a-button>
    </router-link>
    <router-link class="m1" :to="{ name: AssetsPageName }" v-if="isAdmin">
      <a-button type="primary" ghost>Assets</a-button>
    </router-link>
    <router-link class="m1" :to="{ name: SettingsPageName }" v-if="isAdmin">
      <a-button type="primary" ghost>Settings</a-button>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import {
  LoginPageName,
  SettingsPageName,
  OrdersPageName,
  NewsPageName,
  AssetsPageName,
  TradesPageName,
} from "../../router";
import { isLoggedIn, isAdmin } from "../../services/utils";
</script>
