<template>
  <a-input-search
    class="m1"
    v-model:value="searchElement"
    placeholder="Cerca per titolo"
    style="width: 400px"
    @search="onSearch"
    @change="() => onSearch(searchElement)"
  />
  <div class="flex-center">
    <p style="margin-bottom: 0">
      News since: {{ new Date(defaultLast24Hours()).toLocaleString() }}
    </p>
    <a-button @click="getNews(true)" type="danger" class="m1"
      >Get All News</a-button
    >
  </div>
  <a-table
    class="ant-table-custom"
    :columns="columns"
    :rowKey="(record:News) => record._id"
    :data-source="news"
    :pagination="{ pageSize: 10 }"
    :row-class-name="(record:News) => (record.matchFound ? 'row-match-found' : null)"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.title === 'Symbols'">
        <a-tag v-for="symbol in record.symbols">{{ symbol }}</a-tag>
      </template>
      <template v-if="column.title === 'Symbols Guess'">
        <a-tag
          v-for="symbol in record.symbolsGuess"
          v-if="record.symbolsGuess.length"
          >{{ symbol }}</a-tag
        >
        <a-tag v-else>[ ]</a-tag>
      </template>
      <template v-if="column.title === 'Date'">
        {{ new Date(record.time).toLocaleDateString() }}
        <br />
        {{ new Date(record.time).toLocaleTimeString() }}
      </template>
      <template v-if="column.title === 'Details'">
        <a-button
          type="primary"
          @click="() => $router.push(`/news/prospect/${record._id}`)"
          >Details</a-button
        >
      </template>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import { ref } from "vue";
import { Server } from "../../api/server";
import { News } from "../../models/feed";
import { setIsLoading } from "../../services/utils";

const columns = [
  {
    title: "Title",
    dataIndex: "title",
    width: 15,
    ellipsis: true,
  },
  {
    title: "Likes",
    dataIndex: "likes",
    width: 2,
    sorter: (a: News, b: News) => a.likes - b.likes,
  },
  {
    title: "Dislikes",
    dataIndex: "dislikes",
    width: 2,
    sorter: (a: News, b: News) => a.dislikes - b.dislikes,
  },
  {
    title: "Symbols",
    dataIndex: "symbols",
    width: 3,
  },
  {
    title: "Symbols Guess",
    dataIndex: "symbolsGuess",
    width: 3,
  },
  {
    title: "Order id",
    dataIndex: "orderId",
    width: 2,
  },
  {
    title: "Date",
    dataIndex: "time",
    width: 3,
    sorter: (a: News, b: News) => a.time - b.time,
  },
  {
    title: "Details",
    width: 3,
  },
];

const news = ref<News[]>([]);
const originalNews = ref<News[]>([]);

const searchElement = ref<string>("");
const onSearch = (searchValue: string) => {
  news.value = originalNews.value?.filter(
    (item) =>
      item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.symbolsGuess?.includes(searchValue.toLowerCase()) ||
      item.symbols?.includes(searchValue.toLowerCase())
  );
};

const defaultLast24Hours = () => {
  // last 24 hours
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.getTime();
};

const getNews = async (all?: boolean) => {
  setIsLoading(true);
  const time = all ? undefined : defaultLast24Hours();
  await Server.News.get({ time })
    .then((res) => {
      news.value = res;
    })
    .catch((err) => {
      console.log(err);
      message.error("Error getting news");
    })
    .finally(() => setIsLoading(false));
};
getNews();
</script>
