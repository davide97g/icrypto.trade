<template>
  <a-input-search
    class="m1"
    v-model:value="searchElement"
    placeholder="Cerca qui"
    style="width: 400px"
    @search="onSearch"
    @change="() => onSearch(searchElement)"
  />
  <a-table
    class="ant-table-custom"
    :columns="columns"
    :rowKey="(record:FeedItem) => record._id"
    :data-source="feed"
    :pagination="{ pageSize: 10 }"
    :row-class-name="(record:FeedItem) => (record.matchFound ? 'row-match-found' : null)"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.title === 'Title'">
        <CopyOutlined style="cursor:pointer; margin-right:10px" @click="copyToClipboard(record.title)"/> {{ record.title }} 
      </template>
      <template v-if="column.title === 'Symbols'">
        <a-tag v-for="symbol in record.symbols">{{ symbol }}</a-tag>
      </template>
      <template v-if="column.title === 'Symbols Guess'">
        <a-tag v-for="symbol in record.symbolsGuess">{{
          symbol.toUpperCase()
        }}</a-tag>
      </template>
      <template v-if="column.title === 'Date'">
        {{ new Date(record.time).toLocaleDateString() }}
        <br />
        {{ new Date(record.time).toLocaleTimeString() }}
      </template>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { FeedItem } from "../../models/feed";
import { CopyOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";


const props = defineProps<{
  feed: FeedItem[];
}>();

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
    sorter: (a: FeedItem, b: FeedItem) => a.likes - b.likes,
  },
  {
    title: "Dislikes",
    dataIndex: "dislikes",
    width: 2,
    sorter: (a: FeedItem, b: FeedItem) => a.dislikes - b.dislikes,
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
    title: "Date",
    dataIndex: "time",
    width: 3,
    sorter: (a: FeedItem, b: FeedItem) => a.time - b.time,
  },
];

watch(
  () => props.feed,
  (newFeed) => {
    feed.value = newFeed;
  }
);

const feed = ref<FeedItem[]>([]);

const searchElement = ref<string>("");
const onSearch = (searchValue: string) => {
  feed.value = props.feed?.filter(
    (item) =>
      item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.symbolsGuess?.includes(searchValue.toLowerCase()) ||
      item.symbols?.includes(searchValue.toLowerCase())
  );
};

const copyToClipboard = (title:string) => {
  navigator.clipboard.writeText(title);
  message.success("Title copied!");
}
</script>
