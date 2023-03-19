<template>
  <div>
    <h2>Assets</h2>
    <a-list>
      <a-list-item v-for="asset in assets" :key="asset.asset">
        <a-list-item-meta title="Asset">
          <template #description>
            <a-button type="link" @click="openOrdersForSymbol(asset.asset)">
              {{ asset.asset }}
            </a-button>
          </template>
        </a-list-item-meta>
        <a-list-item-meta title="Quantity">
          <template #description>
            {{ asset.free }} / {{ asset.locked }}
          </template>
        </a-list-item-meta>
      </a-list-item>
    </a-list>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ApiClient } from "../api/server";
import { Account } from "../models/trade";
import { OrdersPageName, router } from "../router";

const account = ref<Account>();

const getAssets = () => {
  ApiClient.Account.get().then((res) => {
    if (res) account.value = res;
  });
};

const assets = computed(() =>
  account?.value?.balances.filter((asset) => parseFloat(asset.free) > 0)
);

const openOrdersForSymbol = (symbol: string) => {
  router.push({ name: OrdersPageName, params: { symbol: symbol + "BNB" } });
};

getAssets();
</script>
