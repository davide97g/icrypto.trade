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
    :columns="cols"
    :rowKey="(record:FeedItem) => record._id"
    :data-source="feed"
    :pagination="{ pageSize: 10 }"
    :row-class-name="(record:FeedItem) => (record.matchFound ? 'row-match-found' : null)"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.title === 'Title' && !isMobile">
        <CopyOutlined
          style="cursor: pointer; margin-right: 10px"
          @click="copyToClipboard(record.title)"
        />
        {{ record.title }}
      </template>
      <template v-if="column.title === 'Symbols'">
        <a-tag v-for="symbol in record.symbols">{{ symbol }}</a-tag>
      </template>
      <template v-if="column.title === '👍🏻'">
        <p :class="{ mobile: isMobile }">
          {{ record.dislikes }}
        </p>
      </template>
      <template v-if="column.title === '👎🏻'">
        <p :class="{ mobile: isMobile }">
          {{ record.dislikes }}
        </p>
      </template>
      <template v-if="column.title === 'Guess'">
        <a-tag
          v-for="symbol in record.symbolsGuess"
          :class="{ mobile: isMobile }"
          >{{ symbol.toUpperCase() }}</a-tag
        >
      </template>
      <template v-if="column.title === 'Date'">
        <p :class="{ mobile: isMobile }">
          {{ new Date(record.time).toLocaleDateString() }}
        </p>
        <p :class="{ mobile: isMobile }">
          {{ new Date(record.time).toLocaleTimeString() }}
        </p>
      </template>
    </template>
    <template #expandedRowRender="{ record }" v-if="isMobile">
      <div style="width: calc(100vw - 45px)">
        <CopyOutlined
          style="cursor: pointer; margin-right: 10px"
          @click="copyToClipboard(record.title)"
        />
        <p :class="{ mobile: isMobile }">
          {{ record.title }}
        </p>
      </div>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { FeedItem } from "icrypto.trade-types/feed";
import { CopyOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { copyToClipboard, isMobile } from "../../services/utils";

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
    title: "Guess",
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

const columnsMobile = [
  {
    title: "Date",
    dataIndex: "time",
    width: 4,
    sorter: (a: FeedItem, b: FeedItem) => a.time - b.time,
  },
  {
    title: "👍🏻",
    dataIndex: "likes",
    width: 1,
    sorter: (a: FeedItem, b: FeedItem) => a.likes - b.likes,
  },
  {
    title: "👎🏻",
    dataIndex: "dislikes",
    width: 1,
    sorter: (a: FeedItem, b: FeedItem) => a.dislikes - b.dislikes,
  },
  {
    title: "Guess",
    dataIndex: "symbolsGuess",
    width: 1,
  },
];

const cols = computed(() => {
  return isMobile.value ? columnsMobile : columns;
});

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
</script>

<style lang="scss" scoped>
.mobile {
  p {
    font-size: 10px;
  }
  &.ant-tag {
    font-size: 10px;
  }
}
</style>
