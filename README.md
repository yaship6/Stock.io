# StockVision India

A React + Node.js stock market workspace for Indian markets (NSE/BSE) with Yahoo Finance market data, optional News API enrichment, virtual trading, and AI-themed research pages.

---

## 🚀 Quick Start

### 1. Project Structure
```
stockvision/
├── server.js              ← Express backend (Yahoo Finance proxy)
├── server-package.json    ← Backend dependencies
├── package.json           ← Frontend dependencies
├── public/
│   └── index.html
└── src/
    ├── App.js             ← Main router
    ├── index.js
    ├── index.css          ← Global dark green theme
    ├── context/
    │   └── AuthContext.js ← Auth + portfolio state
    ├── hooks/
    │   └── useStockData.js← Yahoo Finance API hooks
    ├── components/
    │   ├── Navbar.js/css
    │   ├── TickerTape.js/css
    │   ├── StockCard.js/css
    │   └── BuySellModal.js/css
    └── pages/
        ├── Home.js/css         ← Landing page
        ├── Auth.js/css         ← Sign In / Sign Up
        ├── Dashboard.js/css    ← User dashboard
        ├── News.js/css         ← Live news
        ├── About.js/css        ← About page
        ├── AIPrediction.js     ← LSTM price prediction
        ├── AISentiment.js      ← FinBERT news sentiment
        ├── AIAnomaly.js        ← Anomaly detector
        ├── AIRisk.js           ← Portfolio risk AI
        └── AIPages.css         ← Shared AI page styles
```

---

### 2. Install & Run Backend

```bash
npm install express cors axios

# Optional: copy env template and add your News API key
cp .env.example .env

# Run backend proxy on port 5001
node server.js
```

`NEWS_API_KEY` is optional. If it is missing, the backend still serves finance data from Yahoo and falls back to Yahoo Finance news results.

### 3. Install & Run Frontend

```bash
# Install React app dependencies
npm install

# Start frontend dev server (port 3000)
npm start
```

The React app proxies `/api/*` requests to `localhost:5001` (configured in package.json).

---

## 📡 Data Source

All market quotes and charts come from Yahoo Finance via the Express backend proxy:

| Endpoint | Description |
|----------|-------------|
| `GET /api/indices` | Nifty 50, Sensex, Nifty Bank |
| `GET /api/quotes` | Top 20 NSE stocks |
| `GET /api/quotes?symbols=X,Y` | Custom symbol quotes |
| `GET /api/chart/:symbol` | Historical chart data |
| `GET /api/news?query=X&category=Y` | Market news with News API enrichment and Yahoo fallback |
| `GET /api/search?q=X` | Symbol search |
| `GET /api/market-summary` | Breadth and leader snapshot |

Yahoo Finance does not require an API key in this implementation.
News API does require `NEWS_API_KEY` if you want the richer headline source enabled.

---

## 🎯 Features

### Landing Page
- Live Nifty 50, Sensex, and Nifty Bank cards
- Refreshed hero with 3D-style animated market scene
- Top movers view with gainers/losers filters
- Product overview cards for data, AI, and India-specific workflows

### Authentication
- Local sign up / sign in (localStorage)
- Virtual ₹1,00,000 starting balance
- Persistent portfolio and watchlist

### Dashboard
- Portfolio holdings with live P&L
- Watchlist management
- Transaction history
- Spotlight chart for selected symbols
- Browse & search market with Yahoo-backed symbol search
- Buy/Sell modal with order simulation

### News Page
- Search by stock, symbol, or sector
- Category filters for banking, IT, energy, FMCG, auto, and Nifty 50
- News source status and API fallback messaging
- Sentiment mix and trending ticker side panels

### AI Models
| Model | Algorithm | Description |
|-------|-----------|-------------|
| Stock Prediction | LSTM Neural Network | 7-day price forecast |
| Sentiment Analysis | FinBERT NLP | News sentiment scoring |
| Anomaly Detector | Isolation Forest + Z-score | Unusual price/volume patterns |
| Risk AI | Monte Carlo + MPT | Portfolio VaR, Sharpe, Beta |

---

## 🎨 Design System

- **Theme**: Dark green (#020d06 background, #00ff64 accent)
- **Fonts**: Syne (display), Space Mono (monospace), DM Sans (body)
- **CSS Variables**: Full theming via `:root` variables
- **Components**: Cards, badges, buttons, modals, charts (Recharts)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js + Express |
| Data | Yahoo Finance API (free) |
| State | React Context + localStorage |
| Styling | Pure CSS with variables |

---

## Notes

- **Virtual trading only** — no real money involved
- Yahoo Finance may rate limit occasionally; lightweight local fallbacks remain in place
- AI models simulate predictions for demo purposes
- For production: add rate limiting, proper auth (JWT), and a real broker API
# stockvision
