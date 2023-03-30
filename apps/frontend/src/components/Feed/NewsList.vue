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
    <a-button @click="getNews()" type="danger" class="m1"
      >Get All GoodFeedItem</a-button
    >
  </div>
  <a-table
    :columns="cols"
    :rowKey="(record:GoodFeedItem) => record._id"
    :data-source="news"
    :pagination="{ pageSize: 10 }"
    :row-class-name="(record:GoodFeedItem) => (record.matchFound ? 'row-match-found' : null)"
    :custom-row="customRow"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.title === 'Symbols'">
        <a-tag v-for="symbol in record.symbols">{{ symbol }}</a-tag>
      </template>
      <template v-if="column.title === 'Guess'">
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
        <a-button type="primary" @click="() => openProspect(record._id)"
          >Details</a-button
        >
      </template>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import { computed, ref } from "vue";
import { ApiClient } from "../../api/server";
import { GoodFeedItem } from "icrypto.trade-types/database";
import { router } from "../../router";
import { isMobile, setIsLoading } from "../../services/utils";

const columns = [
  {
    title: "Title",
    dataIndex: "title",
    width: 15,
    ellipsis: true,
  },
  {
    title: "👍🏻",
    dataIndex: "likes",
    width: 2,
    sorter: (a: GoodFeedItem, b: GoodFeedItem) => a.likes - b.likes,
  },
  {
    title: "👎🏻",
    dataIndex: "dislikes",
    width: 2,
    sorter: (a: GoodFeedItem, b: GoodFeedItem) => a.dislikes - b.dislikes,
  },
  {
    title: "Symbols",
    dataIndex: "symbols",
    width: 3,
  },
  {
    title: "Guess",
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
    sorter: (a: GoodFeedItem, b: GoodFeedItem) => a.time - b.time,
  },
  {
    title: "Details",
    width: 3,
  },
];

const columnsMobile = [
  {
    title: "👍🏻",
    dataIndex: "likes",
    width: 2,
    sorter: (a: GoodFeedItem, b: GoodFeedItem) => a.likes - b.likes,
  },
  {
    title: "👎🏻",
    dataIndex: "dislikes",
    width: 2,
    sorter: (a: GoodFeedItem, b: GoodFeedItem) => a.dislikes - b.dislikes,
  },
  {
    title: "Guess",
    dataIndex: "symbolsGuess",
    width: 3,
  },
  {
    title: "Date",
    dataIndex: "time",
    width: 3,
    sorter: (a: GoodFeedItem, b: GoodFeedItem) => a.time - b.time,
  },
];

const cols = computed(() => {
  return isMobile.value ? columnsMobile : columns;
});

const news = ref<GoodFeedItem[]>([]);
const originalNews = ref<GoodFeedItem[]>([]);

const searchElement = ref<string>("");
const onSearch = (searchValue: string) => {
  news.value = originalNews.value?.filter(
    (item) =>
      item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.symbolsGuess?.includes(searchValue.toLowerCase()) ||
      item.symbols?.includes(searchValue.toLowerCase())
  );
};

const getNews = async () => {
  setIsLoading(true);
  await ApiClient.News.get()
    .then((res) => {
      news.value = res;
    })
    .catch((err) => {
      console.log(err);
      message.error("Error getting news");
    })
    .finally(() => setIsLoading(false));
};

const openProspect = (id: string) => {
  router.push(`/news/prospect/${id}`);
};

const customRow = (record: GoodFeedItem) => {
  return {
    onClick: () => openProspect(record._id),
  };
};
</script>
