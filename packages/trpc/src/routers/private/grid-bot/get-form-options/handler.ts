import { exchangeProvider } from "@opentrader/exchanges";
import { Context } from "#trpc/utils/context";
import {
  decomposeSymbolId,
  findHighestCandlestickBy,
  findLowestCandlestickBy,
} from "@opentrader/tools";
import { BarSize, ExchangeCode } from "@opentrader/types";
import { TGetGridBotFormOptionsInputSchema } from "./schema";

type Options = {
  ctx: {
    user: NonNullable<Context["user"]>;
  };
  input: TGetGridBotFormOptionsInputSchema;
};

/**
 * Returns the Highest and Lowest price for last month.
 *
 * @param exchangeCode
 * @param currencyPair
 */
async function fetchHighestAndLowestPrice(
  exchangeCode: ExchangeCode,
  currencyPair: string,
) {
  const exchange = exchangeProvider.fromCode(exchangeCode);

  const oneMonthAgo = Date.now() - 28 * 24 * 3600 * 1000; // days * hours * seconds * ms
  const candlesticks = await exchange.getCandlesticks({
    symbol: currencyPair,
    bar: BarSize.ONE_DAY,
    since: oneMonthAgo,
  });

  const lowestCandlestick = findLowestCandlestickBy("low", candlesticks);
  const highestCandlestick = findHighestCandlestickBy("high", candlesticks);

  return { lowestCandlestick, highestCandlestick };
}

async function calcHighLowPrice(
  exchangeCode: ExchangeCode,
  currencyPair: string,
) {
  const exchange = exchangeProvider.fromCode(exchangeCode);

  const { price } = await exchange.getMarketPrice({
    symbol: currencyPair,
  });

  const highPrice = price + price * 0.3; // +30% up
  const lowPrice = price - price * 0.3; // -30% down

  return { highPrice, lowPrice };
}

export async function getFormOptions({ ctx, input }: Options) {
  const { symbolId } = input;
  const { exchangeCode, currencyPairSymbol } = decomposeSymbolId(symbolId);

  const { highPrice, lowPrice } = await calcHighLowPrice(
    exchangeCode,
    currencyPairSymbol,
  );

  return {
    highPrice,
    lowPrice,
  };
}