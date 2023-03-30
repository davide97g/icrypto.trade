<template>
  <div class="left">
    <h1>Prospect</h1>
    <a-row class="w100">
      <a-col :span="isMobile ? 24 : 12">
        <p>
          <CopyOutlined
            v-if="news"
            style="cursor: pointer; margin-right: 10px"
            @click="copyToClipboard(news!._id)"
          />
          <strong style="margin-right: 5px">ID:</strong>
          <a-tag>{{ news?._id }}</a-tag>
        </p>
        <p>
          <strong style="margin-right: 5px">Date: </strong>
          <span v-if="news?.time">
            {{ new Date(news?.time).toLocaleString() }}
          </span>
          <span v-else>-</span>
        </p>
        <h3>
          👍🏻 <a-tag color="green">{{ news?.likes }}</a-tag> 👎🏻
          <a-tag color="red">{{ news?.dislikes }}</a-tag>
        </h3>
      </a-col>
      <a-col :span="isMobile ? 24 : 12">
        <p>
          <strong style="margin-right: 5px"> Symbols Guess </strong>
          <a-tag
            v-if="news?.symbolsGuess.length"
            v-for="symbol in news?.symbolsGuess"
            :key="symbol"
            >{{ symbol }}</a-tag
          >
          <a-tag v-else>[ ]</a-tag>
        </p>
        <p v-if="news?.orderId">
          Order Id
          <span>
            <a-tag>{{ news?.orderId }}</a-tag>
            <LinkOutlined @click="openOrder" />
          </span>
        </p>
        <p v-if="news?.status">
          Status
          <a-tag :color="getColor(news?.status)">{{
            news?.status?.toUpperCase()
          }}</a-tag>
        </p>
        <p><strong>Title:</strong> {{ news?.title }}</p>
        <a-button size="small" @click="showFullNews = !showFullNews"
          >Show Full Transaction</a-button
        >
      </a-col>
    </a-row>
    <a-divider />
    <a-row>
      <a-col :span="isMobile ? 24 : 12">
        <h3>Actions</h3>

        <a-button
          type="primary"
          @click="showSymbolSelectionModal = true"
          :disabled="!!news?.orderId || !binance.exchangeInfo?.symbols?.length"
        >
          Add Symbol Guess
        </a-button>
        <a-button
          type="danger"
          @click="markAsIgnore"
          :disabled="!!news?.orderId || news?.status == 'ignore'"
        >
          Mark as Ignore
        </a-button>
      </a-col>
      <a-col
        :span="isMobile ? 24 : 12"
        class="code-container"
        :class="{
          mobile: isMobile,
        }"
        v-if="showFullNews"
      >
        <code>
          {{ formatJSON(news) }}
        </code>
      </a-col>
    </a-row>
    <SymbolSelectionModal
      v-if="binance.exchangeInfo?.symbols?.length"
      :visible="showSymbolSelectionModal"
      :exchangeInfoSymbols="binance.exchangeInfo?.symbols"
      @close="showSymbolSelectionModal = false"
      @ok="addSymbolToNews"
    />
  </div>
</template>

<script lang="ts" setup>
import { LinkOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { ref } from "vue";
import { ApiClient } from "../api/server";
import SymbolSelectionModal from "../components/Orders/SymbolSelectionModal.vue";
import { BinanceError } from "../models/binance";
import { GoodFeedItem, GoodFeedItemStatus } from "../models/database";
import { router } from "../router";
import {
  setIsLoading,
  formatJSON,
  isMobile,
  copyToClipboard,
} from "../services/utils";
import { CopyOutlined } from "@ant-design/icons-vue";
import { useBinanceStore } from "../stores/binance";

const news = ref<GoodFeedItem>();

const props = defineProps<{
  id: string;
}>();

const getNews = async () => {
  setIsLoading(true);
  await ApiClient.News.getById(props.id)
    .then((res) => (news.value = res))
    .catch((err) => {
      console.log(err);
      message.error(err.message);
    })
    .finally(() => setIsLoading(false));
};

getNews();

const showFullNews = ref(false);

const binance = useBinanceStore();

const showSymbolSelectionModal = ref(false);
const addSymbolToNews = (symbol: string) => {
  showSymbolSelectionModal.value = false;
  const newsId = news?.value?._id || "";
  if (!newsId) {
    message.error(`News id not found`);
    return;
  }
  ApiClient.Orders.addSymbolToNews(symbol, newsId)
    .then(() => {
      message.success(`Order created`);
      getNews();
    })
    .catch((err: BinanceError) => {
      console.error(err);
      message.error(err.response.data.msg || `Error creating order`);
    });
};

const getColor = (status?: GoodFeedItemStatus) => {
  switch (status) {
    case "success":
      return "green";
    case "missing":
    case "unavailable":
      return "yellow";
    case "market-error":
    case "oco-error":
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

const markAsIgnore = () => {
  message.warning(`'Marking as ignore' Not implemented yet`);
  return;
  // if (!news?.value) {
  //   message.error(`News not found`);
  //   return;
  // }
  // const newsToUpdate: News = {
  //   ...news?.value,
  //   orderStatus: "ignore",
  // };
  // ApiClient.News.updateById(newsToUpdate)
  //   .then(() => {
  //     message.success(`News marked as ignore`);
  //     getNews();
  //   })
  //   .catch((err: BinanceError) => {
  //     console.error(err);
  //     message.error(err.response.data.msg || `Error marking news as ignore`);
  //   });
};
</script>

<style lang="scss">
.code-container {
  text-align: left;
  padding: 10px;
  background-color: #ffffff;
  border: 1px solid #e8e8e8;
  &.mobile {
    margin-top: 10px;
    font-size: x-small;
  }
}
code {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
