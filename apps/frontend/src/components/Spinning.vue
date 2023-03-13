<script lang="ts" setup>
import { loading } from "../services/utils";
import { LoadingOutlined } from "@ant-design/icons-vue";
import { h } from "vue";
const indicator = h(LoadingOutlined, {
  style: {
    fontSize: "45px",
  },
  spin: true,
});
</script>

<template>
  <div class="overlay flex-center" :class="{ 'not-loading': !loading }">
    <a-spin :spinning="loading" :indicator="indicator" />
  </div>
</template>

<style lang="scss" scoped>
.overlay {
  width: 100%;
  height: 100%;
  position: absolute;
  text-align: center;
  z-index: 1000;
  padding-top: 0px;
  background: rgba(0, 0, 0, 0.25);
  &.not-loading {
    display: none;
  }
}
</style>
