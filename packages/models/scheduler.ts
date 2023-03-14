import { TradeConfig } from "./transactions";

export interface Scheduler {
  job: any | null;
  startTime: number;
  tradeConfig?: TradeConfig;
}
