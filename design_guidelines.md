# Design Guidelines: Real-time Multi-Asset Trading Dashboard

## Design Approach
**Reference-Based: Professional Trading Platforms**
Primary inspiration from TradingView, Bloomberg Terminal, and modern trading interfaces. Focus on data clarity, information density, and professional aesthetic that traders expect. Dark theme primary with high-contrast elements for 24/7 viewing comfort.

## Typography System
- **Primary Font**: Inter or IBM Plex Sans (clean, readable at small sizes)
- **Monospace**: JetBrains Mono or Roboto Mono (for prices, numbers, timestamps)
- **Hierarchy**:
  - Asset prices: text-3xl to text-4xl, font-bold, monospace
  - Section headers: text-lg, font-semibold
  - Data labels: text-sm, font-medium
  - Chart labels/numbers: text-xs to text-sm, monospace
  - Timestamps: text-xs, monospace, opacity-70

## Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 (p-2, m-4, gap-6, p-8)
- Tight spacing for data-dense areas (gap-2, p-2)
- Standard spacing for controls and panels (p-4, gap-4)
- Generous spacing for section breaks (p-6, p-8)

**Grid Structure**:
- Main layout: 12-column grid with sidebar (3 cols) + main chart area (6 cols) + insights panel (3 cols)
- Mobile: Single column stack with collapsible panels
- Chart area: Full-bleed with minimal padding
- Control panels: Compact, vertically efficient

## Component Library

### Header Bar
- Fixed top bar with subtle border-bottom
- Left: Logo and asset selector dropdown (pill-style buttons)
- Center: Real-time multi-timezone clock (UTC | IST | CST) in monospace, medium weight
- Right: Theme toggle, settings, PDF export button

### Asset Selector
- Horizontal pill tabs for SOL, BTC, ETH, XAU with active state indication
- Display current price and 24h change percentage inline
- Quick-switch keyboard shortcuts (1-4 keys)

### Main Chart Area
- TradingView Lightweight Charts integration
- Clean candlestick display with minimal gridlines
- Overlays: EMA lines (distinct line weights), Volume bars (subtle opacity)
- Buy/Sell/Sideways indicators as colored markers on chart with labels
- Take Profit/Stop Loss levels as horizontal dashed lines with price labels
- Timeframe selector: 1m, 5m, 15m, 1h, 4h, 1D pill buttons above chart

### Trading Signals Panel (Right Sidebar)
- Compact card design with icon badges
- Signal cards with: Icon (buy/sell/sideways), timestamp, price level, confidence score
- Color coding: Green (buy), Red (sell), Yellow (sideways)
- Holding time recommendation displayed prominently per signal
- Scrollable list with most recent signals at top

### Position Sizing Calculator
- Clean input fields for capital amount
- Percentage slider (1-100%) with value display
- Real-time lot size calculation display
- Grid showing: 1%, 5%, 10%, 25%, 50%, 100% quick presets
- Results displayed in card format with large, clear numbers

### Bid Simulator
- Interactive panel below chart
- Inputs: Entry price, position size percentage, leverage (if applicable)
- Large percentage slider with gradient track (1-100%)
- P&L visualization: Large number with +/- indication
- Distribution histogram showing potential outcomes (compact bar chart)
- Risk metrics: Max loss, breakeven point, expected return

### Technical Indicators Panel
- Toggle switches for each indicator (EMA 8/34, RSI, MACD, Volume)
- Compact display showing current values when enabled
- Mini charts for oscillators (RSI, MACD) as sparklines

### Market Insights Panel
- Current market condition badge (Bullish/Bearish/Sideways) - large, prominent
- Key metrics grid: Volatility, Trend Strength, Support/Resistance levels
- Recommended holding timeframe (minutes/hours/days)
- Quick stats: 24h high/low, volume, market cap

## Visual Treatment

**Dark Theme (Primary)**:
- Use very dark grays for backgrounds, not pure black
- High contrast white/light text for prices and critical data
- Subtle borders and dividers (low opacity)
- Colored accents for buy/sell signals only where meaningful

**Chart Colors**:
- Candlesticks: Green (up), Red (down) - standard trading convention
- EMA lines: Distinct colors with good contrast (blue, orange)
- Volume bars: Semi-transparent gray
- Signal markers: Bright, saturated colors for visibility

**Data Hierarchy**:
- Largest: Current asset price
- Large: P&L results, position sizes
- Medium: Chart labels, signal prices
- Small: Timestamps, secondary metrics

## Interaction Patterns

**Chart Interactions**:
- Hover crosshair with tooltip showing OHLC, indicators, signals
- Click on signal marker to highlight full signal details in sidebar
- Drag to pan historical data
- Scroll to zoom timeframe

**Real-time Updates**:
- Subtle pulse animation on new signals (1 second fade)
- Price updates without jarring transitions
- Live clock updates every second
- No distracting animations on chart updates

**Responsive Behavior**:
- Desktop: Full 3-panel layout
- Tablet: Collapsible sidebars with tab navigation
- Mobile: Stacked layout, chart full-width, panels as bottom sheets

## Performance Considerations
- Lazy load historical chart data
- Virtualize signal lists if exceeds 20 items
- Throttle chart redraws to 200ms
- Use CSS transforms for smooth animations
- Minimize re-renders on price ticks

## Accessibility
- High contrast mode support
- Keyboard navigation for all controls
- ARIA labels for chart regions and dynamic content
- Screen reader announcements for new signals
- Focus indicators on all interactive elements

## Images
No hero images required - this is a data-focused application. Focus on charts, graphs, and numerical displays. Optional: Small icon/logo in header representing each asset (SOL, BTC, ETH, XAU symbols).