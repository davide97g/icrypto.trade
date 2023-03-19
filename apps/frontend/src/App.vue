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
  <Footer />
</template>

<style lang="scss">
#router-view {
  height: calc(100vh - 90px);
  padding: 10px;
  overflow: auto;
  &.mobile {
    height: calc(100vh - 90px);
    padding: 10px;
    overflow: auto;
    .text {
      &.small {
        font-size: 10px;
      }
      &.very-small {
        font-size: 8px;
      }
    }
  }
}
</style>
