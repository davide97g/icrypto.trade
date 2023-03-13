<template>
  <h1>Login</h1>
  <a-button type="primary" @click="signInWithGoogle" v-if="!useUserStore().user"
    >Sign In With Google</a-button
  >
  <a-button v-else type="danger" @click="FirebaseAuth.signOut">Logout</a-button>
</template>

<script setup lang="ts">
import { FirebaseAuth } from "../api/auth";
import { NewsPageName, router } from "../router";
import { useUserStore } from "../stores/user";

const signInWithGoogle = () => {
  FirebaseAuth.signInWithGoogle().then(() =>
    router.push({ name: NewsPageName })
  );
};
</script>
