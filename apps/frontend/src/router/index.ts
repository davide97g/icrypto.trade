import {
  createRouter,
  createWebHistory,
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteRecordRaw,
} from "vue-router";
import { checkUserIsLoggedIn } from "../api/auth";
import { useUserStore } from "../stores/user";

export const LoginPageName = "Login";
export const ProfilePageName = "Profile";
export const NewsPageName = "News";
export const PotentialOrderPageName = "PotentialOrder";
export const OrdersPageName = "Orders";
export const OrderPageName = "Order";
export const SettingsPageName = "Settings";
export const AssetsPageName = "Assets";

const loggedInGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  try {
    const userStore = useUserStore();
    await checkUserIsLoggedIn();
    if (to.name != LoginPageName && !userStore.isLoggedIn)
      next({ name: LoginPageName });
    else next();
  } catch (err) {
    console.error(err);
    next({ name: LoginPageName });
  }
};

const routes: Readonly<RouteRecordRaw[]> = [
  {
    path: "/",
    redirect: "/news",
  },
  {
    path: "/news",
    name: NewsPageName,
    component: () => import("../pages/News.vue"),
    beforeEnter: loggedInGuard,
  },
  {
    path: "/news/prospect/:id",
    name: PotentialOrderPageName,
    component: () => import("../pages/ProspectOrder.vue"),
    beforeEnter: loggedInGuard,
    props: true,
  },
  {
    path: "/login",
    name: LoginPageName,
    component: () => import("../pages/Login.vue"),
  },
  {
    path: "/profile",
    name: ProfilePageName,
    component: () => import("../pages/Profile.vue"),
    beforeEnter: loggedInGuard,
  },
  {
    path: "/orders/:symbol?",
    name: OrdersPageName,
    component: () => import("../pages/Orders.vue"),
    beforeEnter: loggedInGuard,
    props: true,
  },
  {
    path: "/order/:symbol/:orderId",
    name: OrderPageName,
    component: () => import("../pages/Order.vue"),
    beforeEnter: loggedInGuard,
    props: true,
  },
  {
    path: "/settings",
    name: SettingsPageName,
    component: () => import("../pages/Settings.vue"),
    beforeEnter: loggedInGuard,
  },
  {
    path: "/assets",
    name: AssetsPageName,
    component: () => import("../pages/Assets.vue"),
    beforeEnter: loggedInGuard,
  },
  { path: "/:pathMatch(.*)*", redirect: "/news" },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
