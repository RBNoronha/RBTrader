import { z } from "zod";
import { buy, sell, cancelSmartTrade, IBotConfiguration, TBotContext, useMovingAverage } from "@opentrader/bot-processor";
import { logger } from "@opentrader/logger";

export function* movingAverageCrossover(ctx: TBotContext<MovingAverageCrossoverParams, MovingAverageCrossoverState>) {
  const {
    config: { settings: params },
    state,
  } = ctx;

  if (ctx.onStart) {
    logger.info(params, "[MovingAverageCrossover] Bot started with params");
    return;
  }

  if (ctx.onStop) {
    logger.info("[MovingAverageCrossover] Bot stopped");
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

    logger.info(state, "[MovingAverageCrossover] State initialized");
  }

  const shortMA: number = yield useMovingAverage(params.shortPeriod);
  const longMA: number = yield useMovingAverage(params.longPeriod);
  logger.info(`[MovingAverageCrossover] Short MA: ${shortMA}, Long MA: ${longMA}`);

  if (shortMA > longMA) {
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

    logger.info(`[MovingAverageCrossover] In bullish trend since ${state.trend.duration} candle(s)`);

    if (state.trend.duration >= params.persistence) {
      state.trend.persisted = true;
    }

    if (state.trend.persisted && !state.trend.adviced) {
      state.trend.adviced = true;

      logger.info("[MovingAverageCrossover] Advised to BUY");
      yield buy({
        quantity: params.quantity,
        orderType: "Market",
      });
    }
  } else if (shortMA < longMA) {
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

    logger.info(`[MovingAverageCrossover] In bearish trend since ${state.trend.duration} candle(s)`);

    if (state.trend.duration >= params.persistence) {
      state.trend.persisted = true;
    }

    if (state.trend.persisted && !state.trend.adviced) {
      state.trend.adviced = true;

      logger.info("[MovingAverageCrossover] Advised to SELL");
      yield sell({
        quantity: params.quantity,
        orderType: "Market",
      });
    }
  } else {
    logger.info("[MovingAverageCrossover] In no trend");
  }
}

movingAverageCrossover.displayName = "Moving Average Crossover Strategy";
movingAverageCrossover.schema = z.object({
  shortPeriod: z.number().positive().default(50).describe("Short period for moving average"),
  longPeriod: z.number().positive().default(200).describe("Long period for moving average"),
  persistence: z.number().positive().default(1).describe("Number of candles to persist in trend before buying/selling"),
  quantity: z.number().positive().default(0.0001).describe("Quantity to buy/sell"),
});

movingAverageCrossover.requiredHistory = 200;
movingAverageCrossover.timeframe = ({ timeframe }: IBotConfiguration) => timeframe;
movingAverageCrossover.runPolicy = {
  onCandleClosed: true,
};
movingAverageCrossover.watchers = {
  watchCandles: ({ symbol }: IBotConfiguration) => symbol,
};

type MovingAverageCrossoverState = {
  trend?: {
    direction: "bullish" | "bearish" | "none";
    duration: number;
    persisted: boolean;
    adviced: boolean;
  };
};

export type MovingAverageCrossoverParams = IBotConfiguration<z.infer<typeof movingAverageCrossover.schema>>;
