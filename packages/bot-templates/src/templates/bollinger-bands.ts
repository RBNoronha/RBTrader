import { z } from "zod";
import { buy, sell, cancelSmartTrade, IBotConfiguration, TBotContext, useBollingerBands } from "@opentrader/bot-processor";
import { logger } from "@opentrader/logger";

export function* bollingerBands(ctx: TBotContext<BollingerBandsParams, BollingerBandsState>) {
  const {
    config: { settings: params },
    state,
  } = ctx;

  if (ctx.onStart) {
    logger.info(params, "[BollingerBands] Bot started with params");
    return;
  }

  if (ctx.onStop) {
    logger.info("[BollingerBands] Bot stopped");
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

    logger.info(state, "[BollingerBands] State initialized");
  }

  const { upper, middle, lower } = yield useBollingerBands(params.period, params.stdDev);
  logger.info(`[BollingerBands] Bollinger Bands values: upper=${upper}, middle=${middle}, lower=${lower}`);

  if (ctx.market.candles[0].close <= lower) {
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

    logger.info(`[BollingerBands] In bullish trend since ${state.trend.duration} candle(s)`);

    if (state.trend.duration >= params.persistence) {
      state.trend.persisted = true;
    }

    if (state.trend.persisted && !state.trend.adviced) {
      state.trend.adviced = true;

      logger.info("[BollingerBands] Advised to BUY");
      yield buy({
        quantity: params.quantity,
        orderType: "Market",
      });
    }
  } else if (ctx.market.candles[0].close >= upper) {
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

    logger.info(`[BollingerBands] In bearish trend since ${state.trend.duration} candle(s)`);

    if (state.trend.duration >= params.persistence) {
      state.trend.persisted = true;
    }

    if (state.trend.persisted && !state.trend.adviced) {
      state.trend.adviced = true;

      logger.info("[BollingerBands] Advised to SELL");
      yield sell({
        quantity: params.quantity,
        orderType: "Market",
      });
    }
  } else {
    logger.info("[BollingerBands] In no trend");
  }
}

bollingerBands.displayName = "Bollinger Bands Strategy";
bollingerBands.schema = z.object({
  period: z.number().positive().default(20).describe("Period for Bollinger Bands"),
  stdDev: z.number().positive().default(2).describe("Standard deviation for Bollinger Bands"),
  persistence: z.number().positive().default(1).describe("Number of candles to persist in trend before buying/selling"),
  quantity: z.number().positive().default(0.0001).describe("Quantity to buy/sell"),
});

bollingerBands.requiredHistory = 20;
bollingerBands.timeframe = ({ timeframe }: IBotConfiguration) => timeframe;
bollingerBands.runPolicy = {
  onCandleClosed: true,
};
bollingerBands.watchers = {
  watchCandles: ({ symbol }: IBotConfiguration) => symbol,
};

type BollingerBandsState = {
  trend?: {
    direction: "bullish" | "bearish" | "none";
    duration: number;
    persisted: boolean;
    adviced: boolean;
  };
};

export type BollingerBandsParams = IBotConfiguration<z.infer<typeof bollingerBands.schema>>;
