import { setIsLoading } from "../../services/utils";
import { getIdToken } from "../auth";
import { API, apiHost } from "../server";

const routeName = "symbols";
export const SymbolsRoutes = {
  get: async (): Promise<Symbol[] | null> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/banned`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
};
