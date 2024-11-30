import { z } from "zod";
import { buy, sell, cancelSmartTrade, IBotConfiguration, TBotContext } from "@opentrader/bot-processor";
import { logger } from "@opentrader/logger";

export function* positionSizing(ctx: TBotContext<PositionSizingParams, PositionSizingState>) {
  const {
    config: { settings: params },
    state,
  } = ctx;

  if (ctx.onStart) {
    logger.info(params, "[PositionSizing] Bot started with params");
    return;
  }

  if (ctx.onStop) {
    logger.info("[PositionSizing] Bot stopped");
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

    logger.info(state, "[PositionSizing] State initialized");
  }

  const positionSize = params.capital * (params.riskPercent / 100) / params.volatility;
  logger.info(`[PositionSizing] Calculated position size: ${positionSize}`);

  if (ctx.market.candles[0].close <= state.position.stopLossPrice) {
    logger.info("[PositionSizing] Stop loss triggered");
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
    logger.info("[PositionSizing] Take profit triggered");
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
    logger.info("[PositionSizing] Entry price reached");
    state.position = {
      entryPrice: params.entryPrice,
      stopLossPrice: params.entryPrice * (1 - params.stopLossPercent / 100),
      takeProfitPrice: params.entryPrice * (1 + params.takeProfitPercent / 100),
      quantity: positionSize,
    };
    yield buy({
      quantity: positionSize,
      orderType: "Market",
    });
  } else {
    logger.info("[PositionSizing] No action taken");
  }
}

positionSizing.displayName = "Position Sizing Strategy";
positionSizing.schema = z.object({
  entryPrice: z.number().positive().describe("Entry price for the strategy"),
  stopLossPercent: z.number().positive().describe("Stop loss percentage below the entry price"),
  takeProfitPercent: z.number().positive().describe("Take profit percentage above the entry price"),
  riskPercent: z.number().positive().describe("Risk percentage of capital per trade"),
  capital: z.number().positive().describe("Total capital available for trading"),
  volatility: z.number().positive().describe("Volatility of the asset"),
});

positionSizing.requiredHistory = 1;
positionSizing.timeframe = ({ timeframe }: IBotConfiguration) => timeframe;
positionSizing.runPolicy = {
  onCandleClosed: true,
};
positionSizing.watchers = {
  watchCandles: ({ symbol }: IBotConfiguration) => symbol,
};

type PositionSizingState = {
  position?: {
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    quantity: number;
  };
};

export type PositionSizingParams = IBotConfiguration<z.infer<typeof positionSizing.schema>>;
