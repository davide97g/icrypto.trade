import { env } from "../config/environment";
import { heroku } from "../config/heroku";
import EventSource from "eventsource";
import { ServerLog } from "../models/bot";

export const getApps = async () => {
  return heroku.get("/apps");
};

let LOGS: string[] = [];

const addLog = (event: MessageEvent) => {
  LOGS.push(event.data);
};

const logger: {
  eventSource: EventSource | null;
} = {
  eventSource: null,
};

export const startLogs = async (app?: string) => {
  try {
    if (logger.eventSource) {
      logger.eventSource.close();
    }
    LOGS = [];
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
    logger.eventSource = new EventSource(logUrl);

    logger.eventSource.onmessage = (event) => addLog(event);

    logger.eventSource.onerror = (error) => {
      console.error("[Heroku Logs] Error:", error);
    };

    // Close the connection after 2 min
    setTimeout(() => {
      logger.eventSource?.close();
    }, 2 * 60 * 1000);
  } catch (err) {
    console.log(err);
  }
};

export const getLogs = (): ServerLog[] => {
  return LOGS.map((log) => {
    const timestamp = log.split(" ")[0];
    const source = log.split(" ")[1].replace(":", "");
    const message = log.split(" ").slice(2).join(" ");
    return {
      timestamp,
      source,
      message,
    };
  });
};
