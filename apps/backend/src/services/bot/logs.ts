import { getApps, getLogs, startLogs } from "../../connections/heroku";

export const getHerokuApps = async () => {
  return getApps();
};

export const startHerokuLogs = async (app?: string) => {
  return startLogs(app);
};

export const getHerokuLogs = async () => {
  return getLogs();
};
