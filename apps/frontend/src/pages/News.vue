<template>
  <a-tabs v-model:activeKey="activeKey" style="margin-top: 50px">
    <a-tab-pane key="1" tab="News">
      <NewsList />
    </a-tab-pane>
    <a-tab-pane key="2" tab="Feed">
      <a-input-number
        v-model:value="feedSize"
        :placeholder="'Select Feed Size'"
        style="margin: 10px"
      />
      <a-button type="primary" @click="getFeed" style="margin: 10px"
        >Get All Feed</a-button
      >
      <span>With Guess</span>
      <a-switch v-model:checked="withGuess" style="margin: 10px" />
      <FeedList :feed="feed" />
    </a-tab-pane>
    <a-tab-pane key="3" tab="Symbols">
      <p>Test Symbols Extraction</p>
      <a-textarea
        v-model:value="text"
        placeholder="Insert your text here"
        :rows="6"
        style="width: calc(100vw - 200px)"
      />
      <a-button
        type="primary"
        @click="extractSymbolsFromText"
        :disabled="!text"
        class="m1"
        >Extract</a-button
      >
      <br />
      <div class="m1">
        <a-tag v-for="symbol in symbols">{{ symbol.toUpperCase() }}</a-tag>
      </div>
    </a-tab-pane>
  </a-tabs>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { FeedItem } from "../models/feed";
import { Server } from "../api/server";
import FeedList from "../components/Feed/FeedList.vue";
import NewsList from "../components/Feed/NewsList.vue";
import { message } from "ant-design-vue";
import { setIsLoading } from "../services/utils";

const feed = ref<FeedItem[]>([]);
const activeKey = ref("1");

const text = ref("");
const symbols = ref<String[]>([]);

const feedSize = ref(100);
const withGuess = ref(false);

const getFeed = async () => {
  setIsLoading(true);
  await Server.Feed.getFeed({ limit: feedSize.value, guess: withGuess.value })
    .then((res) => (feed.value = res))
    .catch((err) => console.log(err))
    .finally(() => setIsLoading(false));
};

const extractSymbolsFromText = async () => {
  await Server.Symbols.extract(text.value)
    .then((res) => (symbols.value = res))
    .catch((err) => {
      console.error(err);
      message.error(`Error extracting symbols from text`);
    });
};
</script>

<style scoped lang="scss">
.item-title {
  display: -webkit-box;
  max-width: 700px;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  padding: 20px;
  overflow-y: auto;
}

.item-id {
  width: 200px;
}

.feed-list {
  height: calc(100vh - 200px);
  overflow-y: auto;

  .feed-item {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    height: 100px;
    .feed-item-id {
      font-size: small;
    }
  }
}

.ant-table-custom :deep(.row-match-found) td {
  background-color: rgba(127, 255, 212, 0.5);
}
.ant-table-custom :deep(.row-match-found):hover td {
  background-color: rgba(127, 255, 212, 0.9);
}
</style>
