<script setup lang="ts">
import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue";
import Spinning from "./components/Spinning.vue";
import { isMobile, setIsLoading } from "./services/utils";
setIsLoading(false);
</script>

<template>
  <Spinning />
  <Header />
  <div id="router-view" :class="{ mobile: isMobile }">
    <router-view />
  </div>
  <Footer v-if="!isMobile" />
</template>

<style lang="scss">
#router-view {
  height: calc(100vh - 90px);
  padding: 10px;
  overflow: auto;
  &.mobile {
    height: calc(100vh - 70px);
    padding: 10px;
    overflow: auto;
    .text {
      &.small {
        font-size: 9px;
      }
      &.very-small {
        font-size: 7px;
      }
    }
  }
}
</style>
