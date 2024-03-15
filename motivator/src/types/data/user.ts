import { Status } from "@/types/enum/status";

export type User = {
  id: string;
  addressName: string;
  volume: number;
  pnl: number;
  actions: number;
  status?: Status;
};
