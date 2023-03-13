import { User } from "firebase/auth";
import { defineStore } from "pinia";

const ADMINS = ["so3l779cGxcl67Tv6gTfygGbTXa2", "gy1vjssjC3TrnEQcwZxthCygmCH2"];

export const useUserStore = defineStore("user", {
  state: () => {
    return {
      isLoggedIn: undefined as boolean | undefined,
      user: null as User | null,
      isAdmin: false as boolean,
    };
  },
  actions: {
    setUser(user: User | null) {
      this.user = user;
      this.isLoggedIn = !!this.user;
      this.isAdmin = this.isLoggedIn && ADMINS.includes(this.user!.uid);
    },
  },
});
