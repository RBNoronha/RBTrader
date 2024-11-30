import { z } from "zod";
import { buy, sell, cancelSmartTrade, IBotConfiguration, TBotContext, useIchimokuCloud } from "@opentrader/bot-processor";
import { logger } from "@opentrader/logger";

export function* ichimokuCloud(ctx: TBotContext<IchimokuCloudParams, IchimokuCloudState>) {
  const {
    config: { settings: params },
    state,
  } = ctx;

  if (ctx.onStart) {
    logger.info(params, "[IchimokuCloud] Bot started with params");
    return;
  }

  if (ctx.onStop) {
    logger.info("[IchimokuCloud] Bot stopped");
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

    logger.info(state, "[IchimokuCloud] State initialized");
  }

  const { conversionLine, baseLine, leadingSpanA, leadingSpanB } = yield useIchimokuCloud(params.conversionPeriod, params.basePeriod, params.spanPeriod);
  logger.info(`[IchimokuCloud] Ichimoku Cloud values: conversionLine=${conversionLine}, baseLine=${baseLine}, leadingSpanA=${leadingSpanA}, leadingSpanB=${leadingSpanB}`);

  if (ctx.market.candles[0].close > leadingSpanA && ctx.market.candles[0].close > leadingSpanB) {
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

    logger.info(`[IchimokuCloud] In bullish trend since ${state.trend.duration} candle(s)`);

    if (state.trend.duration >= params.persistence) {
      state.trend.persisted = true;
    }

    if (state.trend.persisted && !state.trend.adviced) {
      state.trend.adviced = true;

      logger.info("[IchimokuCloud] Advised to BUY");
      yield buy({
        quantity: params.quantity,
        orderType: "Market",
      });
    }
  } else if (ctx.market.candles[0].close < leadingSpanA && ctx.market.candles[0].close < leadingSpanB) {
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

    logger.info(`[IchimokuCloud] In bearish trend since ${state.trend.duration} candle(s)`);

    if (state.trend.duration >= params.persistence) {
      state.trend.persisted = true;
    }

    if (state.trend.persisted && !state.trend.adviced) {
      state.trend.adviced = true;

      logger.info("[IchimokuCloud] Advised to SELL");
      yield sell({
        quantity: params.quantity,
        orderType: "Market",
      });
    }
  } else {
    logger.info("[IchimokuCloud] In no trend");
  }
}

ichimokuCloud.displayName = "Ichimoku Cloud Strategy";
ichimokuCloud.schema = z.object({
  conversionPeriod: z.number().positive().default(9).describe("Conversion period for Ichimoku Cloud"),
  basePeriod: z.number().positive().default(26).describe("Base period for Ichimoku Cloud"),
  spanPeriod: z.number().positive().default(52).describe("Span period for Ichimoku Cloud"),
  persistence: z.number().positive().default(1).describe("Number of candles to persist in trend before buying/selling"),
  quantity: z.number().positive().default(0.0001).describe("Quantity to buy/sell"),
});

ichimokuCloud.requiredHistory = 52;
ichimokuCloud.timeframe = ({ timeframe }: IBotConfiguration) => timeframe;
ichimokuCloud.runPolicy = {
  onCandleClosed: true,
};
ichimokuCloud.watchers = {
  watchCandles: ({ symbol }: IBotConfiguration) => symbol,
};

type IchimokuCloudState = {
  trend?: {
    direction: "bullish" | "bearish" | "none";
    duration: number;
    persisted: boolean;
    adviced: boolean;
  };
};

export type IchimokuCloudParams = IBotConfiguration<z.infer<typeof ichimokuCloud.schema>>;
