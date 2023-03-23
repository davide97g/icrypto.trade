import { env } from "../config/environment";
import { heroku } from "../config/heroku";
import EventSource from "eventsource";

export const getApps = async () => {
  return heroku.get("/apps");
};

const LOGS: string[] = [];

const addLog = (event: MessageEvent) => {
  LOGS.push(event.data);
};

export const startLogs = async (app?: string) => {
  try {
    const appName = app || env.herokuAppName;
    const logSession = await heroku
      .post(`/apps/${appName}/log-sessions`, {
        body: {
          dyno: "web.1", // If you want logs from a specific dyno, use its name (e.g., 'web.1')
          tail: true, // Enable tailing to get a stream of logs
          lines: 100, // Number of log lines to return
        },
      })
      .catch((err) => console.log(err));

    const logUrl = logSession.logplex_url;
    const eventSource = new EventSource(logUrl);

    eventSource.onmessage = (event) => addLog(event);

    eventSource.onerror = (error) => {
      console.error("[Heroku Logs] Error:", error);
    };

    // Close the connection after 2 min
    setTimeout(() => {
      eventSource.close();
    }, 2 * 60 * 1000);
  } catch (err) {
    console.log(err);
  }
};

export const getLogs = async () => {
  return LOGS;
};
