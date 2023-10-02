import { RouterOutput } from "src/lib/trpc/types";

export type TExchangeAccount = RouterOutput["exchangeAccount"]["list"][number];
export type TExchangeCode = TExchangeAccount["exchangeCode"];