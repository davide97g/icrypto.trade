<template>
  <div style="text-align: left">
    <h1>News Potential Order Details</h1>
    <a-row class="w100">
      <a-col :span="12">
        <p>
          Id <a-tag>{{ news?._id }}</a-tag>
        </p>
        <p>
          Date
          <a-tag v-if="news?.time">
            {{ new Date(news?.time).toLocaleString() }}
          </a-tag>
          <span v-else>-</span>
        </p>
        <p>
          Likes <a-tag>{{ news?.likes }}</a-tag>
        </p>
        <p>
          Dislikes <a-tag>{{ news?.dislikes }}</a-tag>
        </p>
      </a-col>
      <a-col :span="12">
        <p>
          Symbols Guess
          <a-tag
            v-if="news?.symbolsGuess.length"
            v-for="symbol in news?.symbolsGuess"
            :key="symbol"
            >{{ symbol }}</a-tag
          >
          <a-tag v-else>[ ]</a-tag>
        </p>
        <p>
          Order Id
          <span v-if="!news?.orderId">
            <a-tag>{{ news?.orderId }}</a-tag>
            <LinkOutlined @click="openOrder" />
          </span>
          <span v-else>-</span>
        </p>
        <p>
          Status
          <a-tag :color="getColor(news?.orderStatus)">{{
            news?.orderStatus?.toUpperCase()
          }}</a-tag>
        </p>
        <p>
          Title: <a-tag>{{ news?.title }}</a-tag>
        </p>
      </a-col>
    </a-row>
    <a-divider />
    <a-row>
      <a-col :span="12">
        <h3>Actions</h3>
        <br />
        <a-button type="primary" @click="showFullNews = !showFullNews"
          >Show Full Transaction</a-button
        >
        <a-button
          type="primary"
          class="m1"
          @click="showSymbolSelectionModal = true"
          :disabled="
            !!news?.orderId || !binanceStore.exchangeInfo?.symbols?.length
          "
        >
          Add Symbol Guess
        </a-button>
        <a-button
          type="danger"
          class="m1"
          @click="markAsIgnore"
          :disabled="!!news?.orderId || news?.orderStatus == 'ignore'"
        >
          Mark as Ignore
        </a-button>
      </a-col>
      <a-col :span="12" class="code-container" v-if="showFullNews">
        <code>
          {{ formatJSON(news) }}
        </code>
      </a-col>
    </a-row>
    <SymbolSelectionModal
      v-if="binanceStore.exchangeInfo?.symbols?.length"
      :visible="showSymbolSelectionModal"
      :exchangeInfoSymbols="binanceStore.exchangeInfo?.symbols"
      @close="showSymbolSelectionModal = false"
      @ok="addSymbolToNews"
    />
  </div>
</template>

<script lang="ts" setup>
import { LinkOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { ref } from "vue";
import { Server } from "../api/server";
import SymbolSelectionModal from "../components/Orders/SymbolSelectionModal.vue";
import { BinanceError } from "../models/binance";
import { News, ProspectOrderStatus } from "../models/feed";
import { router } from "../router";
import { setIsLoading, formatJSON } from "../services/utils";
import { useBinanceStore } from "../stores/binance";

const news = ref<News>();

const props = defineProps<{
  id: string;
}>();

const getNews = async () => {
  setIsLoading(true);
  await Server.News.getById(props.id)
    .then((res) => (news.value = res))
    .catch((err) => {
      console.log(err);
      message.error(err.message);
    })
    .finally(() => setIsLoading(false));
};

getNews();

const showFullNews = ref(false);

const binanceStore = useBinanceStore();

const getExchangeInfo = () =>
  Server.Transaction.getExchangeInfo()
    .then((res) => {
      if (res) binanceStore.setExchangeInfo(res);
      else message.warning(`Error getting exchange info`);
    })
    .catch((err: BinanceError) => {
      console.error(err);
      message.error(err.response.data.msg || `Error getting exchange info`);
    });

getExchangeInfo();

const showSymbolSelectionModal = ref(false);
const addSymbolToNews = (symbol: string) => {
  showSymbolSelectionModal.value = false;
  const newsId = news?.value?._id || "";
  if (!newsId) {
    message.error(`News id not found`);
    return;
  }
  Server.Orders.createOrder(symbol, newsId)
    .then(() => {
      message.success(`Order created`);
      getNews();
    })
    .catch((err: BinanceError) => {
      console.error(err);
      message.error(err.response.data.msg || `Error creating order`);
    });
};

const getColor = (status?: ProspectOrderStatus) => {
  switch (status) {
    case "linked":
      return "green";
    case "prospect":
      return "yellow";
    case "error":
      return "red";
    default:
      return "default";
  }
};

const openOrder = () => {
  const orderId = news?.value?.orderId || "";
  const symbol = news?.value?.symbolsGuess?.[0] || "";
  router.push(`/order/${symbol}/${orderId}`);
};

if (!binanceStore.exchangeInfo) getExchangeInfo();

const markAsIgnore = () => {
  if (!news?.value) {
    message.error(`News not found`);
    return;
  }
  const newsToUpdate: News = {
    ...news?.value,
    orderStatus: "ignore",
  };
  Server.News.updateById(newsToUpdate)
    .then(() => {
      message.success(`News marked as ignore`);
      getNews();
    })
    .catch((err: BinanceError) => {
      console.error(err);
      message.error(err.response.data.msg || `Error marking news as ignore`);
    });
};
</script>

<style lang="scss">
.code-container {
  text-align: left;
  padding: 10px;
  background-color: #ffffff;
  border: 1px solid #e8e8e8;
}
code {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
