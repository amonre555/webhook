import express from 'express';
import crypto from 'crypto';

const app = express();
const PORT = 3000;
const SECRET = 'whsec_student_test_secret_123';

app.use(express.raw({ type: 'application/json' }));

app.post('/webhook', (req, res) => {

  const sigHeader = req.headers['stripe-signature'];
  if (!sigHeader) return res.status(400).json({ error: 'missing signature' });

  const parts = sigHeader.split(',').map(p => p.trim());
  let timestamp, provided;
  parts.forEach(p => {
    const [k, v] = p.split('=');
    if (k === 't') timestamp = v;
    if (k === 'v1') provided = v;
  });

  const now = Math.floor(Date.now() / 1000);
  const diff = Math.abs(now - Number(timestamp || 0));
  if (diff > 300) return res.status(400).json({ error: 'timestamp too old' });

  const payload = req.body.toString();

  const computed = crypto
    .createHmac('sha256', SECRET)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  if (computed !== provided) {
    return res.status(401).json({ error: 'invalid signature' });
  }

  const event = JSON.parse(payload);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Listening http://localhost:${PORT}`);
});