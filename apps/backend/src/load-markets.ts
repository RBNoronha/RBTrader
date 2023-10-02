import { exchanges } from '@opentrader/exchanges';
import { ExchangeCode } from '@opentrader/types';

export async function loadMarkets() {
  const exchangesList = Object.values(ExchangeCode);

  for (const exchangeCode of exchangesList) {
    const exchange = exchanges[exchangeCode](); // since `loadMarkets` is a public API, there is no need in `credentials`

    await exchange.loadMarkets();
  }
}