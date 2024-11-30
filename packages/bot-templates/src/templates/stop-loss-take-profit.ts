import { z } from "zod";
import { buy, sell, cancelSmartTrade, IBotConfiguration, TBotContext } from "@opentrader/bot-processor";
import { logger } from "@opentrader/logger";

export function* stopLossTakeProfit(ctx: TBotContext<StopLossTakeProfitParams, StopLossTakeProfitState>) {
  const {
    config: { settings: params },
    state,
  } = ctx;

  if (ctx.onStart) {
    logger.info(params, "[StopLossTakeProfit] Bot started with params");
    return;
  }

  if (ctx.onStop) {
    logger.info("[StopLossTakeProfit] Bot stopped");
    yield cancelSmartTrade();
    return;
  }

  if (!state.position) {
    state.position = {
      entryPrice: 0,
      stopLossPrice: 0,
      takeProfitPrice: 0,
      quantity: 0,
    };

    logger.info(state, "[StopLossTakeProfit] State initialized");
  }

  if (ctx.market.candles[0].close <= state.position.stopLossPrice) {
    logger.info("[StopLossTakeProfit] Stop loss triggered");
    yield sell({
      quantity: state.position.quantity,
      orderType: "Market",
    });
    state.position = {
      entryPrice: 0,
      stopLossPrice: 0,
      takeProfitPrice: 0,
      quantity: 0,
    };
  } else if (ctx.market.candles[0].close >= state.position.takeProfitPrice) {
    logger.info("[StopLossTakeProfit] Take profit triggered");
    yield sell({
      quantity: state.position.quantity,
      orderType: "Market",
    });
    state.position = {
      entryPrice: 0,
      stopLossPrice: 0,
      takeProfitPrice: 0,
      quantity: 0,
    };
  } else if (ctx.market.candles[0].close <= params.entryPrice) {
    logger.info("[StopLossTakeProfit] Entry price reached");
    state.position = {
      entryPrice: params.entryPrice,
      stopLossPrice: params.entryPrice * (1 - params.stopLossPercent / 100),
      takeProfitPrice: params.entryPrice * (1 + params.takeProfitPercent / 100),
      quantity: params.quantity,
    };
    yield buy({
      quantity: params.quantity,
      orderType: "Market",
    });
  } else {
    logger.info("[StopLossTakeProfit] No action taken");
  }
}

stopLossTakeProfit.displayName = "Stop-Loss and Take-Profit Strategy";
stopLossTakeProfit.schema = z.object({
  entryPrice: z.number().positive().describe("Entry price for the strategy"),
  stopLossPercent: z.number().positive().describe("Stop loss percentage below the entry price"),
  takeProfitPercent: z.number().positive().describe("Take profit percentage above the entry price"),
  quantity: z.number().positive().describe("Quantity to buy/sell"),
});

stopLossTakeProfit.requiredHistory = 1;
stopLossTakeProfit.timeframe = ({ timeframe }: IBotConfiguration) => timeframe;
stopLossTakeProfit.runPolicy = {
  onCandleClosed: true,
};
stopLossTakeProfit.watchers = {
  watchCandles: ({ symbol }: IBotConfiguration) => symbol,
};

type StopLossTakeProfitState = {
  position?: {
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    quantity: number;
  };
};

export type StopLossTakeProfitParams = IBotConfiguration<z.infer<typeof stopLossTakeProfit.schema>>;
