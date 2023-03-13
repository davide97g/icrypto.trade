<template>
  <div
    id="img-container"
    v-if="isLoggedIn"
    :class="{
      'top-left': props.position == 'topLeft',
      'top-center': props.position == 'topCenter',
      'top-right': props.position == 'topRight',
      relative: props.relative,
      absolute: !props.relative,
    }"
  >
    <router-link :to="{ name: ProfilePageName }">
      <img
        id="profile-img"
        :src="getPhotoURL(useUserStore().user)"
        alt="profile-img"
        :title="useUserStore().user?.displayName || ''"
        referrerpolicy="no-referrer"
        :class="{
          small: props.size == 'small',
          medium: props.size == 'medium',
          large: props.size == 'large',
        }"
      />
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { getPhotoURL, isLoggedIn } from "../services/utils";
import { useUserStore } from "../stores/user";
import { ProfilePageName } from "../router/index";

const props = withDefaults(
  defineProps<{
    position: "topLeft" | "topRight" | "topCenter";
    relative?: boolean;
    size?: "small" | "medium" | "large";
  }>(),
  {
    size: "small",
  }
);
</script>

<style lang="scss" scoped>
#img-container {
  &.relative {
    position: relative;
  }

  #profile-img {
    border-radius: 100%;
    border: 1px solid white;
    &.small {
      height: 45px;
      width: 45px;
    }
    &.medium {
      height: 60px;
      width: 60px;
    }
    &.large {
      height: 75px;
      width: 75px;
    }
  }

  &.asbolute {
    position: absolute;
    &.top-left {
      top: 5px;
      left: 5px;
    }
    &.top-center {
      top: 5px;
      left: 0;
      right: 0;
      margin-left: auto;
      margin-right: auto;
    }
    &.top-right {
      top: 5px;
      right: 5px;
    }
  }
}
</style>
