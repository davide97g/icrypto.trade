<template>
  <Avatar :position="'topCenter'" :size="'large'" />
  <div style="margin-top: 170px; margin-bottom: 20px">
    <h1>Profile</h1>
    <p>Name: {{ useUserStore().user?.displayName }}</p>
    <p>Email: {{ useUserStore().user?.email }}</p>
    <a-button type="primary" danger @click="FirebaseAuth.signOut"
      >Log out</a-button
    >
  </div>
  <div>
    <h2>Create Admins</h2>
    <div class="flex-center">
      <a-input
        type="text"
        v-model:value="userId"
        placeholder="User UID"
        style="width: 350px"
      />
      <a-button type="primary" @click="createAdmin(userId)" :disabled="!userId"
        >Create Admin</a-button
      >
    </div>
  </div>
  <br />
  <router-link :to="{ name: NewsPageName }">
    <a-button type="primary">Go To News</a-button>
  </router-link>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { FirebaseAuth } from "../api/auth";
import { ApiClient } from "../api/server";
import Avatar from "../components/Avatar.vue";
import { NewsPageName } from "../router";
import { useUserStore } from "../stores/user";

const userId = ref("");

const createAdmin = async (uid: string | undefined) => {
  if (!uid) return;
  await ApiClient.Account.createAdmin(uid);
};
</script>

<style lang="scss" scoped></style>
