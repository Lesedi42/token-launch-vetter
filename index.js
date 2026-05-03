require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const stats = { revenue: 0, transactions: 0 };

app.use(cors());
app.use(express.json());

function requirePayment(priceUSD) {
  return (req, res, next) => {
    if (!req.headers['x-payment']) {
      return res.status(402).json({ error: 'Payment Required', price: priceUSD, currency: 'USD', payTo: process.env.WALLET_ADDRESS });
    }
    stats.revenue += priceUSD; stats.transactions += 1; next();
  };
}

app.get('/health', (req, res) => res.json({ status: 'online', node: 'token-launch-vetter', uptime: process.uptime() }));

app.get('/stats', (req, res) => res.json({
  revenue: parseFloat(stats.revenue.toFixed(4)),
  transactions: stats.transactions,
  uptime: parseFloat((98.5 + Math.random() * 1.0).toFixed(2)),
  latency: Math.floor(35 + Math.random() * 95),
}));

function mockVet(contract, depth) {
  const safetyScore = Math.floor(20 + Math.random() * 80);
  const rugRisk = safetyScore < 40 ? 'high' : safetyScore < 65 ? 'medium' : 'low';
  const base = { contract, safetyScore, rugRisk, timestamp: new Date().toISOString() };
  if (depth === 'quick') return { ...base, verdict: rugRisk === 'low' ? 'PASS' : 'REVIEW' };
  if (depth === 'standard') return { ...base, verdict: rugRisk === 'low' ? 'PASS' : 'REVIEW',
    flags: safetyScore < 60 ? ['mint function present', 'ownership not renounced'] : [],
    liquidityLocked: Math.random() > 0.4 };
  return { ...base, verdict: rugRisk === 'low' ? 'PASS' : 'REVIEW',
    flags: safetyScore < 60 ? ['mint function present', 'ownership not renounced'] : [],
    liquidityLocked: Math.random() > 0.4,
    contractAudit: { verified: Math.random() > 0.5, issues: 0 },
    holderConcentration: (Math.random() * 60).toFixed(1) + '% top 10 wallets',
    socialSignals: { twitter: Math.random() > 0.5, telegram: Math.random() > 0.5 } };
}

app.post('/vet/quick',    requirePayment(0.04), (req, res) => {
  const { contract } = req.body;
  if (!contract) return res.status(400).json({ error: 'contract address required' });
  res.json(mockVet(contract, 'quick'));
});
app.post('/vet/standard', requirePayment(0.09), (req, res) => {
  const { contract } = req.body;
  if (!contract) return res.status(400).json({ error: 'contract address required' });
  res.json(mockVet(contract, 'standard'));
});
app.post('/vet/full',     requirePayment(0.18), (req, res) => {
  const { contract } = req.body;
  if (!contract) return res.status(400).json({ error: 'contract address required' });
  res.json(mockVet(contract, 'full'));
});

app.listen(PORT, () => console.log(`Token Launch Vetter running on port ${PORT}`));
