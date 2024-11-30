import { z } from "zod";
import { buy, sell, cancelSmartTrade, IBotConfiguration, TBotContext, useMACD } from "@opentrader/bot-processor";
import { logger } from "@opentrader/logger";

export function* macd(ctx: TBotContext<MacdParams, MacdState>) {
  const {
    config: { settings: params },
    state,
  } = ctx;

  if (ctx.onStart) {
    logger.info(params, "[MACD] Bot started with params");
    return;
  }

  if (ctx.onStop) {
    logger.info("[MACD] Bot stopped");
    yield cancelSmartTrade();
    return;
  }

  if (!state.trend) {
    state.trend = {
      direction: "none",
      duration: 0,
      persisted: false,
      adviced: false,
    };

    logger.info(state, "[MACD] State initialized");
  }

  const macd: number = yield useMACD(params.fastPeriod, params.slowPeriod, params.signalPeriod);
  logger.info(`[MACD] MACD value: ${macd}`);

  if (macd > params.signalLine) {
    // new trend detected
    if (state.trend.direction !== "bullish") {
      state.trend = {
        duration: 0,
        persisted: false,
        direction: "bullish",
        adviced: false,
      };
    }

    state.trend.duration++;

    logger.info(`[MACD] In bullish trend since ${state.trend.duration} candle(s)`);

    if (state.trend.duration >= params.persistence) {
      state.trend.persisted = true;
    }

    if (state.trend.persisted && !state.trend.adviced) {
      state.trend.adviced = true;

      logger.info("[MACD] Advised to BUY");
      yield buy({
        quantity: params.quantity,
        orderType: "Market",
      });
    }
  } else if (macd < params.signalLine) {
    // new trend detected
    if (state.trend.direction !== "bearish") {
      state.trend = {
        duration: 0,
        persisted: false,
        direction: "bearish",
        adviced: false,
      };
    }

    state.trend.duration++;

    logger.info(`[MACD] In bearish trend since ${state.trend.duration} candle(s)`);

    if (state.trend.duration >= params.persistence) {
      state.trend.persisted = true;
    }

    if (state.trend.persisted && !state.trend.adviced) {
      state.trend.adviced = true;

      logger.info("[MACD] Advised to SELL");
      yield sell({
        quantity: params.quantity,
        orderType: "Market",
      });
    }
  } else {
    logger.info("[MACD] In no trend");
  }
}

macd.displayName = "MACD Strategy";
macd.schema = z.object({
  fastPeriod: z.number().positive().default(12).describe("Fast period for MACD"),
  slowPeriod: z.number().positive().default(26).describe("Slow period for MACD"),
  signalPeriod: z.number().positive().default(9).describe("Signal period for MACD"),
  signalLine: z.number().default(0).describe("Signal line for MACD"),
  persistence: z.number().positive().default(1).describe("Number of candles to persist in trend before buying/selling"),
  quantity: z.number().positive().default(0.0001).describe("Quantity to buy/sell"),
});

macd.requiredHistory = 26;
macd.timeframe = ({ timeframe }: IBotConfiguration) => timeframe;
macd.runPolicy = {
  onCandleClosed: true,
};
macd.watchers = {
  watchCandles: ({ symbol }: IBotConfiguration) => symbol,
};

type MacdState = {
  trend?: {
    direction: "bullish" | "bearish" | "none";
    duration: number;
    persisted: boolean;
    adviced: boolean;
  };
};

export type MacdParams = IBotConfiguration<z.infer<typeof macd.schema>>;
