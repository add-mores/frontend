const express = require('express');
const promClient = require('prom-client');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Prometheus 메트릭 수집 설정
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestCounter = new promClient.Counter({
  name: 'frontend_http_requests_total',
  help: 'Total number of HTTP requests to frontend',
  labelNames: ['method', 'status'],
});

const httpRequestDuration = new promClient.Histogram({
  name: 'frontend_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'status'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
});

register.registerMetric(httpRequestCounter);
register.registerMetric(httpRequestDuration);

// ✅ /metrics 먼저 등록!
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// 요청 시간 측정 미들웨어
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    httpRequestCounter.labels(req.method, res.statusCode.toString()).inc();
    end({ method: req.method, status: res.statusCode.toString() });
  });
  next();
});

// ✅ 그 다음에 프록시 등록
app.use(
  '/',
  createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
  })
);

const PORT = 9200;
app.listen(PORT, () => {
  console.log(`Monitoring proxy running at http://localhost:${PORT}`);
});

