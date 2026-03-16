# YFinance API Integration

## Overview
This document summarizes the integration of YFinance API routes into the frontend.

## Backend Features Added
The backend (`api/routes/yfinance.py`) provides comprehensive financial data retrieval with the following endpoints:

### Endpoints
1. **GET `/yfinance/{ticker}`** - Comprehensive financial data
   - Parameters: `include`, `exclude`, `history_period`, `history_interval`, `options_date`
   - Returns: Full YFinance data with metadata

2. **GET `/yfinance/{ticker}/summary`** - Quick summary of key metrics
   - Returns: Company info, market data, key metrics, and financials

3. **GET `/yfinance/{ticker}/history`** - Historical price data
   - Parameters: `period`, `interval`
   - Returns: Historical OHLCV data

## Frontend Integration

### Types Added
Added to `src/types/api.ts`:
- `YFinanceDataRequest` - Request parameters
- `YFinanceDataResponse` - Full data response
- `YFinanceSummary` - Summary response
- `YFinanceHistory` - Historical data response

### API Client Methods
Added to `src/lib/api.ts`:

```typescript
// Direct client methods
apiClient.getYFinanceData(ticker, options?)
apiClient.getYFinanceSummary(ticker)
apiClient.getYFinanceHistory(ticker, options?)
```

### Convenience API Namespace
Available via `api.yfinance`:

```typescript
// Usage examples
api.yfinance.getData('AAPL')
api.yfinance.getData('AAPL', {
  include: 'info,history,earnings',
  history_period: '1y',
  history_interval: '1d'
})

api.yfinance.getSummary('AAPL')

api.yfinance.getHistory('AAPL', {
  period: '1y',
  interval: '1d'
})
```

## Available Data Categories
The comprehensive data endpoint supports 35+ financial data categories:

### Basic Data
- `info` - Company information
- `fast_info` - Real-time pricing and quick metrics
- `history` - Price history
- `actions` - Corporate actions

### Valuation & Metrics
- `earnings` - Annual and quarterly earnings
- `pe_ratio`, `forward_pe` - Price-to-earnings ratios
- `dividend_yield`, `dividend_rate` - Dividend information
- `beta` - Stock volatility metric

### Financial Statements
- `income_stmt` - Income statement
- `balance_sheet` - Balance sheet
- `cash_flow` - Cash flow statement
- Quarterly and TTM (trailing twelve months) versions available

### Analyst Data
- `analyst_price_targets` - Price target recommendations
- `earnings_estimate` - Earnings estimates
- `revenue_estimate` - Revenue estimates
- `upgrades_downgrades` - Analyst rating changes

### Holdings & Insider Data
- `major_holders` - Significant shareholders
- `institutional_holders` - Institutional investor holdings
- `insider_purchases` - Insider buying activity
- `insider_transactions` - Complete insider trading history

### Other Data
- `options` - Options chain data
- `news` - Recent news items
- `sustainability` - ESG metrics
- `sec_filings` - SEC filing information

## Usage Examples

### Get Complete Financial Profile
```typescript
const data = await api.yfinance.getData('AAPL', {
  include: 'info,history,earnings,balance_sheet,cash_flow,analyst_price_targets'
});
```

### Get Historical Data for Technical Analysis
```typescript
const history = await api.yfinance.getHistory('MSFT', {
  period: '1y',
  interval: '1d'
});
```

### Get Quick Company Summary
```typescript
const summary = await api.yfinance.getSummary('GOOGL');
// Returns: company info, current price, key metrics, financials
```

### Exclude Certain Categories
```typescript
const data = await api.yfinance.getData('TSLA', {
  exclude: 'insider_transactions,insider_purchases' // Skip slow data
});
```

## Integration Points

Potential integration points in the frontend:
- **Researcher Page**: Company research with YFinance data
- **Dashboard**: Real-time price and metrics
- **Market Analysis**: Historical data visualization
- **Strategy Analysis**: Company fundamentals for strategy evaluation
- **New YFinance Page**: Dedicated financial data explorer

## Notes

1. All YFinance endpoints require authentication (JWT token)
2. Data is cached and rate-limited on the backend
3. Historical data endpoint supports multiple time intervals and periods
4. Options data requires specifying an expiration date
5. Some data categories may not be available for all tickers

## Next Steps

1. Create a dedicated YFinance page component if desired
2. Integrate YFinance data into Researcher page
3. Add YFinance data visualization to Dashboard
4. Create market analysis tools using the historical data
