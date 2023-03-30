<template>
  <div>
    <h2>Assets</h2>
    <a-list class="asset-list">
      <a-list-item
        v-for="asset in assets"
        :key="asset.asset"
        style="align-items: baseline"
      >
        <a-list-item-meta title="Asset">
          <template #description>
            <a-button type="link" @click="openOrdersForSymbol(asset.asset)">
              {{ asset.asset }}
            </a-button>
          </template>
        </a-list-item-meta>
        <a-list-item-meta title="Free">
          <template #description>
            <a-tag color="green">
              {{ asset.free }}
            </a-tag>
          </template>
        </a-list-item-meta>
        <a-list-item-meta title="Locked">
          <template #description>
            <a-tag color="red">
              {{ asset.locked }}
            </a-tag>
          </template>
        </a-list-item-meta>
      </a-list-item>
    </a-list>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ApiClient } from "../api/server";
import { BinanceAccount } from "icrypto.trade-types/account";
import { OrdersPageName, router } from "../router";

const account = ref<BinanceAccount>();

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

<style lang="scss" scoped>
.asset-list {
  max-height: calc(100vh - 140px);
  overflow: auto;
}
</style>
