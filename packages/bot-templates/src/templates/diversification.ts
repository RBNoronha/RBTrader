import { z } from "zod";
import { buy, sell, cancelSmartTrade, IBotConfiguration, TBotContext } from "@opentrader/bot-processor";
import { logger } from "@opentrader/logger";

export function* diversification(ctx: TBotContext<DiversificationParams, DiversificationState>) {
  const {
    config: { settings: params },
    state,
  } = ctx;

  if (ctx.onStart) {
    logger.info(params, "[Diversification] Bot started with params");
    return;
  }

  if (ctx.onStop) {
    logger.info("[Diversification] Bot stopped");
    yield cancelSmartTrade();
    return;
  }

  if (!state.positions) {
    state.positions = [];

    logger.info(state, "[Diversification] State initialized");
  }

  for (const asset of params.assets) {
    const position = state.positions.find((p) => p.asset === asset.symbol);

    if (!position) {
      logger.info(`[Diversification] Buying ${asset.quantity} of ${asset.symbol}`);
      yield buy({
        symbol: asset.symbol,
        quantity: asset.quantity,
        orderType: "Market",
      });
      state.positions.push({
        asset: asset.symbol,
        quantity: asset.quantity,
      });
    } else {
      logger.info(`[Diversification] Already holding ${position.quantity} of ${asset.symbol}`);
    }
  }
}

diversification.displayName = "Diversification Strategy";
diversification.schema = z.object({
  assets: z.array(
    z.object({
      symbol: z.string().describe("Symbol of the asset"),
      quantity: z.number().positive().describe("Quantity to buy"),
    }),
  ),
});

diversification.requiredHistory = 1;
diversification.timeframe = ({ timeframe }: IBotConfiguration) => timeframe;
diversification.runPolicy = {
  onCandleClosed: true,
};
diversification.watchers = {
  watchCandles: ({ symbol }: IBotConfiguration) => symbol,
};

type DiversificationState = {
  positions?: Array<{
    asset: string;
    quantity: number;
  }>;
};

export type DiversificationParams = IBotConfiguration<z.infer<typeof diversification.schema>>;
