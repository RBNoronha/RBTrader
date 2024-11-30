<p align="center">
  <a href="https://github.com/RBNoronha/RBTrader" title="RB Trader Bot">
    <img src=".github/images/logo.png" alt="RB Trader Bot logo" width="128" />
  </a>
</p>

[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/RBNoronha/RBTrader/dev.yml)](https://github.com/RBNoronha/RBTrader/actions)
[![NPM Version](https://img.shields.io/npm/v/rbtrader?color=blue)](https://www.npmjs.com/package/rbtrader)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/RBNoronha/RBTrader)](https://github.com/RBNoronha/RBTrader/graphs/contributors)
[![Static Badge](https://img.shields.io/badge/Discord-white?logo=Discord)](https://discord.gg/RS7y3ffvvG)
[![Static Badge](https://img.shields.io/badge/Reddit-white?logo=Reddit)](https://www.reddit.com/r/RBTrader)
[![Static Badge](https://img.shields.io/badge/Telegram-white?logo=Telegram)](https://t.me/+cJLNxLSjcW83Njgy)

[RB Trader Bot](https://github.com/RBNoronha/RBTrader) is an advanced cryptocurrency trading bot offering high-frequency, cross-exchange arbitrage and event-based strategies, including technical analysis with indicators. Features a user-friendly management UI, robust backtesting capabilities, and support for 100+ exchanges via CCXT.

**Features:**

- **✨ Robust UI**: A user-friendly interface for managing the bots.
- **🌐 Multiple Exchanges:** Trade across various cryptocurrency exchanges.
- **📝 Paper Trading**: Test your strategies without risking real money.
- **⚙️ Easy Installation:** Install effortlessly via NPM for a streamlined setup process.

**Strategies:**

- [x] [Grid](packages/bot-templates/src/templates/grid-bot.ts): Make profits from market fluctuations by creating a grid of buy and sell orders.
- [x] [DCA](packages/bot-templates/src/templates/dca.ts): Entry with multiple orders to average the entry price and sell on price swings.
- [x] [RSI](packages/bot-templates/src/templates/rsi.ts): Places orders based on the RSI indicator value.
- [ ] `ARB`: Arbitrage strategy that takes advantage of price differences through cross-exchange trading.
- [x] [CUSTOM](https://github.com/Open-Trader/custom-strategy): Build your own strategy in just a few lines of code

# 🤖 State of the Project

This project is a personal passion, developed in my free time, and currently not monetized. If you find it useful, please give it a ⭐️. Your support means a lot and motivates me to keep improving the bot. If you'd like to make a donation, see the options below. 💖

> [!NOTE]
> If you choose to build the project from source, please note that you'll only be able to interact with the bot via the CLI, and you can run only one bot instance. Running multiple bots requires the UI, which currently resides in a private repo until I finalize the licensing and funding options.

Currently, the NPM version includes the full bot functionality, including the UI, and I'm offering it for free to early adopters. 🎉

# Quick start

Get started with RB Trader Bot in just a few steps. Follow this quick guide to install, configure, and run your crypto trading bot.

## Installation

1. Install RB Trader Bot globally using npm:

```bash
npm install -g rbtrader
```

2. Set an admin password for later accessing the RB Trader Bot UI:

```bash
rbtrader set-password <password>
```

3. Start the RB Trader Bot app

```bash
rbtrader up
```

The app will start the RPC server and listen on port 8000.

> **Tip**: Use `rbtrader up -d` to start the app as a daemon. To stop it, run `rbtrader down`.

# Usage

## UI

The user interface allows managing multiple bots and strategies, viewing backtest results, and monitoring live trading.

![UI Preview](.github/images/ui.png)

You can access the RB Trader Bot UI on: http://localhost:8000

## CLI

### Connect an exchange

Copy the `exchanges.sample.json5` file to `exchanges.json5` and add your API keys.

> Available exchanges: OKX, BYBIT, BINANCE, KRAKEN, COINBASE, GATEIO

### Choose a strategy

Create the strategy configuration file `config.json5`. We will use the `grid` strategy as an example.

```json5
{
  // Grid strategy params
  settings: {
    highPrice: 70000, // upper price of the grid
    lowPrice: 60000, // lower price of the grid
    gridLevels: 20, // number of grid levels
    quantityPerGrid: 0.0001, // quantity in base currency per each grid
  },
  pair: "BTC/USDT",
  exchange: "DEFAULT",
}
```

> Currently supported strategies: `grid`, `dca`, `rsi`

### Run a backtest

Command: `rbtrader backtest <strategy> --from <date> --to <date> -t <timeframe>`

Example running a `grid` strategy on `1h` timeframe.

```bash
rbtrader backtest grid --from 2024-03-01 --to 2024-06-01 -t 1h
```

> Para obter resultados mais precisos, use um período menor, por exemplo, 1 mês. No entanto, levará mais tempo para baixar os dados OHLC da bolsa.

### Running a Live Trading

Command: `rbtrader trade <strategy>`

Example running a live trading with `grid` strategy.

```bash
rbtrader trade grid
```

> To stop the live trading, run `rbtrader stop`

# Project structure

- Strategies dir: [packages/bot-templates](/packages/bot-templates/src/templates)
- Indicators: [packages/indicators](/packages/indicators/src/indicators)
- Exchange connectors: [packages/exchanges](/packages/exchanges/src/exchanges)

# 🪪 License

Licensed under the [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0) License. See the [LICENSE](LICENSE) file for more information.

# Disclaimer

This software is for educational purposes only. USE THE SOFTWARE AT YOUR OWN RISK. THE AUTHORS AND ALL AFFILIATES ASSUME NO RESPONSIBILITY FOR YOUR TRADING RESULTS. Do not risk money that you are afraid to lose. There might be bugs in the code - this software DOES NOT come with ANY warranty.

# Donate

If you find RB Trader Bot useful and would like to support its development, consider making a donation. Your contributions will help cover the costs of maintaining and improving this project.

**Donate via:**

- **Bitcoin (BTC):** `1LBqWWne1ac455UmUDVF32ozVAhy1HgVXn`
- **Ethereum (ETH):** `0x60371d49F9Cc7ec7d7e34979D5DD31996B7B43Ff`

Thank you for your support!
