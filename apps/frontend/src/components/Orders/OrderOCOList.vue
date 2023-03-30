<template>
  <a-table
    class="ant-table-custom"
    :columns="cols"
    :rowKey="(record:BinanceOCOOrder) => record.orderListId"
    :data-source="orders"
    :pagination="{ pageSize: 10 }"
  >
    <template #bodyCell="{ column, record }">
      <template
        v-if="column.title === 'Id'"
        style="display: flex; align-items: center"
      >
        <CopyOutlined
          v-if="!isMobile"
          style="cursor: pointer; margin-right: 10px"
          @click="copyToClipboard(record.orderListId)"
        />
        <p class="text small">
          {{ record.orderListId }}
        </p>
        <WalletOutlined
          v-if="!isMobile"
          style="cursor: pointer; margin-right: 10px"
          @click="openOrderDetails(record.symbol, record.orderListId)"
        />
      </template>
      <template v-if="column.title === 'Status'">
        <a-tag class="strong text small">
          {{ record.listOrderStatus }}
        </a-tag>
      </template>
      <template v-if="column.title === 'Date'">
        <p class="text small">
          {{ new Date(record.transactionTime).toLocaleString() }}
        </p>
      </template>
      <template v-if="column.title === ''">
        <a-popconfirm
          title="Are you sure cancel this OCO order?"
          ok-text="Yes"
          cancel-text="No"
          :disabled="!record.orderListId || record.status === 'FILLED'"
          @confirm="cancelOrder(record.symbol, record.orderListId)"
        >
          <DeleteFilled style="cursor: pointer" />
        </a-popconfirm>
      </template>
    </template>
    <template #expandedRowRender="{ record }" v-if="!isMobile">
      <p>{{ getOrders(record) }}</p>
    </template>
  </a-table>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import {
  CopyOutlined,
  DeleteFilled,
  WalletOutlined,
} from "@ant-design/icons-vue";
import { copyToClipboard, isMobile, setIsLoading } from "../../services/utils";
import { OCOOrderPageName, router } from "../../router";
import { ApiClient } from "../../api/server";
import { message } from "ant-design-vue";
import { BinanceOCOOrder } from "icrypto.trade-types/orders";

const props = defineProps<{
  symbol?: string;
}>();

const symbol = ref(props.symbol);

const colsDesktop = [
  {
    title: "Id",
    dataIndex: "orderListId",
    width: 30,
    ellipsis: true,
    sorter: (a: BinanceOCOOrder, b: BinanceOCOOrder) =>
      a.orderListId - b.orderListId,
  },
  {
    title: "Status",
    dataIndex: "listOrderStatus",
    width: 20,
  },
  {
    title: "Date",
    dataIndex: "transactionTime",
    width: 40,
    sorter: (a: BinanceOCOOrder, b: BinanceOCOOrder) =>
      a.transactionTime - b.transactionTime,
  },
  {
    title: "",
    width: 20,
  },
];

const colsMobile = [
  {
    title: "Id",
    dataIndex: "orderListId",
    width: 20,
    ellipsis: true,
    sorter: (a: BinanceOCOOrder, b: BinanceOCOOrder) =>
      a.orderListId - b.orderListId,
  },
  {
    title: "Status",
    dataIndex: "listOrderStatus",
    width: 20,
  },
  {
    title: "Date",
    dataIndex: "transactionTime",
    width: 25,
    sorter: (a: BinanceOCOOrder, b: BinanceOCOOrder) =>
      a.transactionTime - b.transactionTime,
  },
  {
    title: "",
    width: 10,
  },
];

const cols = computed(() => {
  return isMobile.value ? colsMobile : colsDesktop;
});

const orders = ref<BinanceOCOOrder[]>([]);

const getOrders = (record: BinanceOCOOrder) => {
  return record.orders
    .map((order) => {
      order.orderId;
    })
    .join("");
};

watch(
  () => props.symbol,
  (newSymbol) => {
    symbol.value = newSymbol?.includes("USDT") ? newSymbol : newSymbol + "USDT";
    getOpenOrders();
  }
);

const getOpenOrders = async () => {
  if (!symbol.value) return;
  setIsLoading(true);
  await ApiClient.Orders.getOCO(symbol.value)
    .then((res) => {
      if (res) orders.value = res.filter((o) => o.symbol === symbol.value);
      else message.warning("No orders found");
    })
    .catch((err) => {
      console.error(err);
      message.error(err);
    })
    .finally(() => {
      setIsLoading(false);
    });
};

const cancelOrder = (symbol: string, orderListId: string) => {
  setIsLoading(true);
  ApiClient.Orders.cancelOCO(symbol, orderListId)
    .then((res) => {
      if (res) {
        getOpenOrders();
        message.success(`Order ${orderListId} cancelled successfully`);
      } else
        message.warning(
          `Order ${orderListId} could not be cancelled. Please try again`
        );
    })
    .catch((err) => {
      console.error(err);
      message.error(err);
    })
    .finally(() => {
      setIsLoading(false);
    });
};

const openOrderDetails = (symbol: string, orderId: string) => {
  router.push({
    name: OCOOrderPageName,
    params: { symbol, orderId },
  });
};

getOpenOrders();
</script>
