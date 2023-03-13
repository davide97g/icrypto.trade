<template>
  <a-button @click="addNewBannedToken" :disabled="loading">Ban Token</a-button>
  <a-list
    v-if="bannedTokens.length"
    style="padding: 100px; max-height: 500px; overflow-y: auto"
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
// import { Server } from "../api/server";
// import { Token } from "../models/token";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import { message } from "ant-design-vue";
import { setIsLoading, loading } from "../../services/utils";

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

// const tokens = ref<Token[]>([]);
// Server.Token.get().then((res) => {
//   console.info(res);
//   tokens.value = res.data.tokens;
// });
</script>
