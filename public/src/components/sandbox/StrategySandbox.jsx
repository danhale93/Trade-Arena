import React, { useState } from 'react';

const StrategySandbox = () => {
  const [strategyCode, setStrategyCode] = useState('');
  const [marketPair, setMarketPair] = useState('ETH/USDC');
  const [timeframe, setTimeframe] = useState('1h');
  const [tradeCount, setTradeCount] = useState(10);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const defaultStrategy = `// Example Strategy: Simple Moving Average Crossover
// This is a placeholder strategy. Replace with your own code.
// The function should return an object with: action ('BUY' or 'SELL'), confidence (0-1), and size (0-1)

function calculateSMA(data, period) {
  if (data.length < period) return null;
  const closes = data.slice(-period).map(candle => candle.close);
  const sum = closes.reduce((a, b) => a + b, 0);
  return sum / period;
}

const shortPeriod = 10;
const longPeriod = 30;

const smaShort = calculateSMA(marketData, shortPeriod);
const smaLong = calculateSMA(marketData, longPeriod);

if (smaShort === null || smaLong === null) {
  return { action: 'HOLD', confidence: 0, size: 0 };
}

let action = 'HOLD';
let confidence = 0.5;
let size = 0.1;

if (smaShort > smaLong) {
  action = 'BUY';
  confidence = 0.7;
  size = 0.2;
} else if (smaShort < smaLong) {
  action = 'SELL';
  confidence = 0.7;
  size = 0.2;
}

return { action, confidence, size };
`;

  useEffect(() => {
    setStrategyCode(defaultStrategy);
  }, []);

  const runSimulation = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/sandbox/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategyCode,
          marketPair,
          timeframe,
          tradeCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Simulation failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <div className="strategy-sandbox">
        <h3>Strategy Sandbox</h3>
        <div className="sandbox-controls">
          <div className="control-group">
            <label>Strategy Code:</label>
            <textarea
              value={strategyCode}
              onChange={(e) => setStrategyCode(e.target.value)}
              placeholder="Enter your strategy code here..."
              className="strategy-textarea"
            />
          </div>
          <div className="control-group">
            <label>Market Pair:</label>
            <select
              value={marketPair}
              onChange={(e) => setMarketPair(e.target.value)}
            >
              <option value="ETH/USDC">ETH/USDC</option>
              <option value="BTC/USDC">BTC/USDC</option>
              <option value="SOL/USDC">SOL/USDC</option>
              <option value="ARB/USDC">ARB/USDC</option>
            </select>
          </div>
          <div className="control-group">
            <label>Timeframe:</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="30m">30m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
            </select>
          </div>
          <div className="control-group">
            <label>Trade Count:</label>
            <input
              type="number"
              value={tradeCount}
              onChange={(e) => setTradeCount(parseInt(e.target.value) || 10)}
              min="1"
              max="100"
            />
          </div>
          <button onClick={runSimulation} disabled={loading} className="sandbox-button">
            {loading ? 'Running Simulation...' : 'Run Simulation'}
          </button>
        </div>
        {error && (
          <div className="sandbox-error">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="strategy-sandbox">
      <h3>Strategy Sandbox Results</h3>
      <div className="sandbox-controls">
        <div className="control-group">
          <label>Market Pair:</label>
          <span>{result.marketPair || marketPair}</span>
        </div>
        <div className="control-group">
          <label>Timeframe:</label>
          <span>{result.timeframe || timeframe}</span>
        </div>
        <div className="control-group">
          <label>Trades Simulated:</label>
          <span>{result.totalTrades || 0}</span>
        </div>
      </div>
      {result.success ? (
        <>
          <div className="sandbox-metrics">
            <div className="metric">
              <label>Win Rate:</label>
              <span>{result.metrics.winRate}%</span>
            </div>
            <div className="metric">
              <label>Total P&L:</label>
              <span>${result.metrics.totalPnl}</span>
            </div>
            <div className="metric">
              <label>Return:</label>
              <span>{result.metrics.returnPercent}%</span>
            </div>
            <div className="metric">
              <label>Max Drawdown:</label>
              <span>{result.metrics.maxDrawdown}%</span>
            </div>
            <div className="metric">
              <label>Profit Factor:</label>
              <span>{result.metrics.profitFactor}</span>
            </div>
            <div className="metric">
              <label>Volatility:</label>
              <span>{result.metrics.volatility}%</span>
            </div>
          </div>
          <div className="sandbox-trades">
            <h4>Trade History</h4>
            <table className="trades-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Action</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>P&L</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {result.trades.map((trade, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{trade.action}</td>
                    <td>${trade.entryPrice.toFixed(4)}</td>
                    <td>${trade.exitPrice.toFixed(4)}</td>
                    <td className={trade.pnl >= 0 ? 'profit' : 'loss'}>
                      ${trade.pnl.toFixed(2)}
                    </td>
                    <td>{(trade.confidence * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sandbox-equity">
            <h4>Equity Curve</h4>
            <div className="equity-chart-placeholder">
              {/* In a real implementation, you would render a chart here */}
              <p>Equity chart would be displayed here (starting at $0)</p>
            </div>
          </div>
        </>
      ) : (
        <div className="sandbox-error">
          <strong>Simulation Failed:</strong> {result.error}
        </div>
      )}
      <button onClick={() => setResult(null)} className="sandbox-button">
        Run New Simulation
      </button>
    </div>
  );
};

export default StrategySandbox;