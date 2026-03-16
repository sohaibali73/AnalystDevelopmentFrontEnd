/**
 * Generative UI Components
 * 
 * Rich React components that render tool call results as interactive UI
 * instead of plain text. Maps to backend tools in core/tools.py.
 * 
 * Usage in ChatPage: When AI SDK v5 returns a tool part with
 * type `tool-${toolName}`, render the corresponding component.
 */

// Stock data display (get_stock_data tool)
export { StockCard } from './StockCard';

// Live stock chart with candlestick/line/area (get_stock_chart tool)
export { LiveStockChart } from './LiveStockChart';

// Technical analysis indicators & signals (technical_analysis tool)
export { TechnicalAnalysis } from './TechnicalAnalysis';

// Weather display with forecast (get_weather tool)
export { WeatherCard } from './WeatherCard';

// News headlines with sentiment (get_news tool)
export { NewsHeadlines } from './NewsHeadlines';

// Interactive code sandbox (code_sandbox tool)
export { CodeSandbox } from './CodeSandbox';

// Data visualization charts - bar, line, pie, donut, scatter, area (create_chart tool)
export { DataChart } from './DataChart';

// Python code execution result (execute_python tool)
export { CodeExecution } from './CodeExecution';

// Knowledge base search results (search_knowledge_base tool)
export { KnowledgeBaseResults } from './KnowledgeBaseResults';

// AFL code tools (generate, validate, debug, explain, sanity_check)
export {
  AFLGenerateCard,
  AFLValidateCard,
  AFLDebugCard,
  AFLExplainCard,
  AFLSanityCheckCard,
} from './AFLCodeCard';

// Web search results (web_search tool)
export { WebSearchResults } from './WebSearchResults';

// Loading state for any tool
export { ToolLoading } from './ToolLoading';

// NEW: Stock Screener (screen_stocks tool)
export { StockScreener } from './StockScreener';

// NEW: Stock Comparison (compare_stocks tool)
export { StockComparison } from './StockComparison';

// NEW: Sector Performance heatmap (get_sector_performance tool)
export { SectorPerformance } from './SectorPerformance';

// NEW: Position Size Calculator (calculate_position_size tool)
export { PositionSizer } from './PositionSizer';

// NEW: Correlation Matrix (get_correlation_matrix tool)
export { CorrelationMatrix } from './CorrelationMatrix';

// NEW: Dividend Info Card (get_dividend_info tool)
export { DividendCard } from './DividendCard';

// NEW: Risk Metrics (calculate_risk_metrics tool)
export { RiskMetrics } from './RiskMetrics';

// NEW: Market Overview (get_market_overview tool)
export { MarketOverview } from './MarketOverview';

// NEW: Quick Backtest Results (backtest_quick tool)
export { BacktestResults } from './BacktestResults';

// NEW: Options Snapshot (get_options_snapshot tool)
export { OptionsSnapshot } from './OptionsSnapshot';

// NEW: Presentation Card (create_presentation tool)
export { PresentationCard } from './PresentationCard';

// NEW: Live Sports Scores (get_live_scores tool)
export { LiveSportsScores } from './LiveSportsScores';

// NEW: Search Trends (get_search_trends tool)
export { SearchTrends } from './SearchTrends';

// NEW: LinkedIn Post Preview (create_linkedin_post tool)
export { LinkedInPost } from './LinkedInPost';

// NEW: Website Preview (preview_website tool)
export { WebsitePreview } from './WebsitePreview';

// NEW: Food Order (order_food tool)
export { FoodOrder } from './FoodOrder';

// NEW: Flight Tracker (track_flight tool)
export { FlightTracker } from './FlightTracker';

// NEW: Flight Search (search_flights tool)
export { FlightSearchCard } from './FlightSearchCard';

// Legacy React component wrapper
export { default as ReactComponent } from './ReactComponent';
