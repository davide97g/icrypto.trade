<template>
  <a-button @click="addNewBannedToken" :disabled="loading">Ban Token</a-button>
  <a-list
    v-if="bannedTokens.length"
    id="banned-tokens-list"
    :class="{
      mobile: isMobile,
    }"
  >
    <a-list-item v-for="token in bannedTokens" :key="token.symbol">
      <div class="flex-center w100 space-between">
        {{ token.symbol }}
        <DeleteFilled
          style="cursor: pointer"
          @click="deleteBannedToken(token.symbol)"
        />
      </div>
    </a-list-item>
  </a-list>
</template>

<script setup lang="ts">
import { DeleteFilled } from "@ant-design/icons-vue";
import { ref } from "vue";
// import { ApiClient } from "../api/server";
// import { Token } from "icrypto.trade-types/token";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import { message } from "ant-design-vue";
import { setIsLoading, loading, isMobile } from "../../services/utils";

const db = getFirestore();

const bannedTokens = ref<{ symbol: string }[]>([]);

const getBannedTokens = async () => {
  setIsLoading(true);
  const querySnapshot = await getDocs(collection(db, "bannedTokens"));
  bannedTokens.value = querySnapshot.docs.map((doc) => doc.data()) as {
    symbol: string;
  }[];
  setIsLoading(false);
};

const addNewBannedToken = async () => {
  const newToken = prompt("Enter new token");
  if (newToken) {
    setIsLoading(true);
    bannedTokens.value.push({ symbol: newToken });
    await setDoc(doc(db, "bannedTokens", newToken), {
      symbol: newToken,
    })
      .then(() => {
        message.info(`Banned token ${newToken}`);
      })
      .catch((err) => {
        message.error(`Error banning token ${newToken}`);
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }
};

const deleteBannedToken = async (token: string) => {
  setIsLoading(true);
  await deleteDoc(doc(db, "bannedTokens", token))
    .then(() => {
      message.info(`Unbanned token ${token}`);
      bannedTokens.value = bannedTokens.value.filter((t) => t.symbol !== token);
    })
    .catch((err) => {
      message.error(`Error unbanning token ${token}`);
      console.error(err);
    })
    .finally(() => {
      setIsLoading(false);
    });
};

getBannedTokens();
</script>

<style lang="scss" scoped>
#banned-tokens-list {
  padding: 40px;
  max-height: 500px;
  overflow-y: auto;
  margin-top: 20px;
  &.mobile {
    padding: 10px;
    max-height: calc(100vh - 300px);
  }
}
</style>
