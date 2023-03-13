import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { router } from "./router/index";
import Antd from "ant-design-vue";
import "ant-design-vue/dist/antd.css";
import { createPinia } from "pinia";
import { checkUserIsLoggedIn } from "./api/auth";

const pinia = createPinia();

checkUserIsLoggedIn();

createApp(App).use(router).use(pinia).use(Antd).mount("#app");
