<template>
  <a-row class="my1">
    <a-popconfirm
      title="Are you sure cancel all open orders?"
      ok-text="Yes"
      cancel-text="No"
      :disabled="!orders.length"
      @confirm="cancelAllOpenOrders"
    >
      <a-button type="danger" :disabled="!orders.length">
        Cancel All Open Orders
      </a-button>
    </a-popconfirm>
  </a-row>
  <a-table
    class="ant-table-custom"
    :columns="cols"
    :rowKey="(record:BinanceOrderDetails) => record.orderId"
    :data-source="orders"
    :pagination="{ pageSize: 10 }"
  >
    <template #bodyCell="{ column, record }" style="cursor: pointer">
      <template v-if="column.title === 'Order Id' && !isMobile">
        <div class="text small">
          <CopyOutlined
            style="cursor: pointer; margin-right: 10px"
            @click="copyToClipboard(record.orderId)"
          />
          {{ record.orderId }}
          <WalletOutlined
            style="cursor: pointer; margin-right: 10px"
            @click="openOrderDetails(record.symbol, record.orderId)"
          />
        </div>
      </template>
      <template v-if="column.title === 'Side'">
        <a-tag
          :color="record.side === 'BUY' ? 'green' : 'red'"
          class="strong text small"
        >
          {{ record.side }}
        </a-tag>
      </template>
      <template v-if="column.title === 'Type'">
        <a-tag class="text small">
          {{ record.type }}
        </a-tag>
      </template>
      <template v-if="column.title === 'Price'">
        <a-tag class="strong text small">{{ record.price }}</a-tag>
      </template>
      <template v-if="column.title === 'Quantity'">
        <a-tag class="strong text small">{{ record.origQty }}</a-tag>
      </template>
      <template v-if="column.title === 'Status'">
        <a-tag class="strong text small">
          {{ record.status }}
        </a-tag>
      </template>
      <template v-if="column.title === 'Date'">
        <p class="text small">
          {{ new Date(record.time).toLocaleString() }}
        </p>
      </template>
    </template>
    <template #expandedRowRender="{ record }" v-if="isMobile">
      <a-row class="flex-center">
        <a-col :span="12">
          <div class="text small">
            <strong> Order Id: </strong>
            {{ record.orderId }}
            <CopyOutlined
              style="cursor: pointer"
              @click="copyToClipboard(record.orderId)"
            />
            <WalletOutlined
              v-if="!isMobile"
              style="cursor: pointer; margin-right: 10px"
              @click="openOrderDetails(record.symbol, record.orderId)"
            />
          </div>
        </a-col>
        <a-col :span="12">
          <div class="text small">
            <strong>Side</strong>
            <a-tag
              style="margin-left: 5px"
              :color="record.side === 'BUY' ? 'green' : 'red'"
              class="strong text small"
            >
              {{ record.side }}
            </a-tag>
          </div>
        </a-col>
      </a-row>
      <a-row class="flex-center" style="margin-top: 5px">
        <a-col :span="12">
          <div class="text small">
            <strong>Quantity</strong>
            <a-tag style="margin-left: 5px" class="text small">
              {{ record.origQty }}
            </a-tag>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="text small">
            <strong>Price</strong>
            <a-tag style="margin-left: 5px" class="text small">
              {{ record.price }}
            </a-tag>
          </div>
        </a-col>
      </a-row>
    </template>
  </a-table>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { CopyOutlined, WalletOutlined } from "@ant-design/icons-vue";
import { BinanceOrderDetails } from "../../models/orders";
import { copyToClipboard, isMobile, setIsLoading } from "../../services/utils";
import { OrderPageName, router } from "../../router";
import { ApiClient } from "../../api/server";
import { message } from "ant-design-vue";
const props = defineProps<{
  symbol?: string;
}>();

const symbol = ref(props.symbol);

const colsDesktop = [
  {
    title: "Order Id",
    dataIndex: "orderId",
    width: 3,
    ellipsis: true,
    sorter: (a: BinanceOrderDetails, b: BinanceOrderDetails) =>
      a.orderId - b.orderId,
  },
  {
    title: "Side",
    dataIndex: "side",
    width: 1,
  },
  {
    title: "Type",
    dataIndex: "type",
    width: 2,
  },
  {
    title: "Price",
    dataIndex: "price",
    width: 2,
  },
  {
    title: "Quantity",
    dataIndex: "origQty",
    width: 2,
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 2,
  },
  {
    title: "Date",
    dataIndex: "time",
    width: 4,
    sorter: (a: BinanceOrderDetails, b: BinanceOrderDetails) => a.time - b.time,
  },
];

const colsMobile = [
  {
    title: "Type",
    dataIndex: "type",
    width: 20,
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 20,
  },
  {
    title: "Date",
    dataIndex: "time",
    width: 50,
    sorter: (a: BinanceOrderDetails, b: BinanceOrderDetails) => a.time - b.time,
  },
];

const cols = computed(() => (isMobile.value ? colsMobile : colsDesktop));

const orders = ref<BinanceOrderDetails[]>([]);

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
  await ApiClient.Orders.get(symbol.value)
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

const cancelAllOpenOrders = () => {
  if (!symbol.value) return;
  setIsLoading(true);
  ApiClient.Orders.cancelAll(symbol.value)
    .then((res) => {
      if (res) {
        getOpenOrders();
        message.success("All open orders cancelled");
      } else
        message.warning(
          "Something went wrong while cancelling all open orders"
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

const openOrderDetails = (symbol: string, orderId: number) => {
  router.push({
    name: OrderPageName,
    params: { symbol, orderId },
  });
};

getOpenOrders();
</script>
