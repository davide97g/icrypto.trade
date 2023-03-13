<template>
  <a-list>
    <a-list-item v-for="t in props.transactions" :key="t.orderId">
      <a-list-item-meta title="Symbol" :description="t.symbol" />
      <a-list-item-meta title="Side">
        <template #description>
          <a-tag v-if="t.side === 'BUY'" color="green">BUY</a-tag>
          <a-tag v-else color="red">SELL</a-tag>
        </template>
      </a-list-item-meta>
      <a-list-item-meta title="Type">
        <template #description>
          <a-tag>{{ t.type }}</a-tag>
        </template>
      </a-list-item-meta>
      <a-list-item-meta title="Price" :description="t.price" />
      <a-list-item-meta
        title="Transaction Date"
        :description="getFormatDate(t.transactTime)"
      />
      <a-list-item-meta title="Actions">
        <template #description>
          <a-button type="link" size="small" @click="openTransaction(t)">
            Open <ArrowRightOutlined
          /></a-button>
        </template>
      </a-list-item-meta>
    </a-list-item>
  </a-list>
</template>

<script setup lang="ts">
import { ArrowRightOutlined } from "@ant-design/icons-vue";
import { Transaction } from "../../models/trade";
import { router } from "../../router";

const props = defineProps<{
  transactions: Transaction[];
}>();

const getFormatDate = (date: number) => {
  return (
    new Date(date).toLocaleDateString() +
    " " +
    new Date(date).toLocaleTimeString()
  );
};

const openTransaction = (transaction: Transaction) => {
  router.push({
    path: `/trade/transactions/${transaction.symbol}/${transaction.orderId}`,
  });
};
</script>
