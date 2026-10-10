// Fixed teaching data. These prices are invented fixtures, not current market data.
const quotes = Object.freeze([
  Object.freeze({ symbol: 'AAPL', priceCents: 18725 }),
  Object.freeze({ symbol: 'MSFT', priceCents: 41280 }),
  Object.freeze({ symbol: 'NVDA', priceCents: 11940 }),
  Object.freeze({ symbol: 'TSLA', priceCents: 22110 })
]);

module.exports = { quotes };
