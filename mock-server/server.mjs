import express from 'express'
import cors from 'cors'
import {
  buildSummary,
  buildMemberReport,
  buildHeatmap,
  buildFuelTracking,
  buildMonthlyCosts,
  buildLatestForUser,
  buildAllLatest,
  buildHistory,
  buildUsers,
  buildTripSummary,
  buildTripDetail,
  buildFuelSummary,
  buildFuelDetail,
  buildActivityTime,
  MEMBERS,
  LARGE_MEMBERS,
} from './data.mjs'

const PORT = Number(process.env.PORT ?? 3001)
const DELAY_MS = Number(process.env.MOCK_DELAY ?? 150)
const EXPECTED_KEY = process.env.MOCK_API_KEY ?? null // if set, enforce X-API-Key

// CORS: allow localhost (any port) + 192.168.10.185 (any port)
// Add more IPs via CORS_ORIGINS env var (comma-separated)
const EXTRA_ORIGINS = (process.env.CORS_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean)
const CORS_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.10\.185)(:\d+)?$/

const app = express()
app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin requests (curl, Postman, mobile apps)
    if (!origin) return cb(null, true)
    const ok = CORS_PATTERN.test(origin) || EXTRA_ORIGINS.includes(origin)
    cb(ok ? null : new Error(`CORS: origin not allowed — ${origin}`), ok)
  },
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))

app.use((req, _res, next) => {
  const ts = new Date().toISOString()
  console.log(`[${ts}] ${req.method} ${req.originalUrl}`)
  next()
})

function auth(req, res, next) {
  if (!EXPECTED_KEY) return next()
  const key = req.header('X-API-Key') || req.header('Authorization')?.replace(/^Bearer\s+/i, '')
  if (key !== EXPECTED_KEY) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or invalid X-API-Key', code: 401 })
  }
  next()
}

function wrap(handler) {
  return async (req, res) => {
    try {
      if (DELAY_MS) await new Promise((r) => setTimeout(r, DELAY_MS))
      await handler(req, res)
    } catch (err) {
      console.error('[mock-server] handler error:', err)
      res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message, code: 500 })
    }
  }
}

function startOfTodayMs() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
function startOfYearMs() {
  const d = new Date()
  d.setMonth(0, 1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
function endOfYearMs() {
  const d = new Date()
  d.setMonth(11, 31)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}
const DAY_MS = 86_400_000

// ---------- DASHBOARD ----------
app.get('/api/v1/dashboard/gps-manager/summary', auth, wrap((req, res) => {
  const date = Number(req.query.date) || startOfTodayMs()
  res.json(buildSummary(date))
}))

app.get('/api/v1/dashboard/gps-manager/users', auth, wrap((req, res) => {
  const date = Number(req.query.date) || startOfTodayMs()
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 20
  const status = req.query.status || undefined
  res.json(buildMemberReport(date, { page, pageSize, status }))
}))

app.get('/api/v1/dashboard/gps-manager/activity-heatmap', auth, wrap((req, res) => {
  const to = Number(req.query.to) || Date.now()
  const from = Number(req.query.from) || to - 14 * DAY_MS
  const metric = req.query.metric || 'distance'
  res.json(buildHeatmap(from, to, metric))
}))

app.get('/api/v1/dashboard/gps-manager/fuel-tracking', auth, wrap((req, res) => {
  const from = Number(req.query.from) || startOfYearMs()
  const to = Number(req.query.to) || endOfYearMs()
  const groupBy = req.query.groupBy || 'week'
  res.json(buildFuelTracking(from, to, groupBy))
}))

app.get('/api/v1/dashboard/gps-manager/monthly-costs', auth, wrap((req, res) => {
  const from = Number(req.query.from) || startOfYearMs()
  const to = Number(req.query.to) || endOfYearMs()
  const currency = req.query.currency || 'VND'
  res.json(buildMonthlyCosts(from, to, currency))
}))

// All-in-one composite
app.get('/api/v1/dashboard/gps-manager', auth, wrap((req, res) => {
  const date = Number(req.query.date) || startOfTodayMs()
  const report = buildMemberReport(date, { page: 1, pageSize: 5 })
  res.json({
    summary: buildSummary(date),
    usersPreview: { summary: report.summary, topUsers: report.users },
    activityHeatmap: buildHeatmap(date - 13 * DAY_MS, date),
    fuelTracking: buildFuelTracking(startOfYearMs(), endOfYearMs(), 'week'),
    monthlyCosts: buildMonthlyCosts(startOfYearMs(), endOfYearMs()),
    generatedAt: Date.now(),
    cacheExpiresAt: Date.now() + 5 * 60_000,
  })
}))

// ---------- GPS TRACKING ----------
app.get('/api/v1/gps-tracking/users', auth, wrap((req, res) => {
  res.json(buildUsers({
    keyword: req.query.keyword,
    status: req.query.status,
    pageNumber: Number(req.query.PageNumber || req.query.pageNumber) || 1,
    // SDK sends lowercase pageSize; server legacy used PascalCase — accept both
    pageSize: Number(req.query.pageSize || req.query.PageSize) || 3000,
    sortDesc: req.query.SortDescending !== 'false',
  }))
}))

app.get('/api/v1/gps-tracking/latest/users/:userId', auth, wrap((req, res) => {
  const data = buildLatestForUser(req.params.userId)
  if (!data) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found', code: 404 })
  res.json({ success: true, data })
}))

app.get('/api/v1/gps-tracking/latest/vehicles/:vehicleId', auth, wrap((req, res) => {
  const member = MEMBERS.find((m) => m.vehicleId === req.params.vehicleId)
  if (!member) return res.status(404).json({ error: 'NOT_FOUND', message: 'Vehicle not found', code: 404 })
  res.json(buildLatestForUser(member.userId))
}))

app.get('/api/v1/gps-tracking/latest/devices/:deviceId', auth, wrap((req, res) => {
  const userId = req.params.deviceId.replace(/^device-/, '')
  const row = buildLatestForUser(userId)
  if (!row) return res.status(404).json({ error: 'NOT_FOUND', message: 'Device not found', code: 404 })
  res.json(row)
}))

app.get('/api/v1/gps-tracking/history', auth, wrap((req, res) => {
  res.json(
    buildHistory({
      vehicleId: req.query.VehicleId,
      userId: req.query.UserId,
      deviceId: req.query.DeviceId,
      fromTime: req.query.FromTime,
      toTime: req.query.ToTime,
      page: Number(req.query.PageNumber) || 1,
      pageSize: Number(req.query.PageSize) || 100,
      sortDesc: req.query.SortDescending !== 'false',
    }),
  )
}))

app.post('/api/v1/gps-tracking', auth, wrap((req, res) => {
  const arr = Array.isArray(req.body) ? req.body : [req.body]
  const invalid = arr.find((p) => !p.userId && !p.vehicleId && !p.deviceId)
  if (invalid) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'At least one of vehicleId, userId, or deviceId is required', code: 400 })
  }
  res.json({})
}))

app.post('/api/v1/gps-tracking/bulk', auth, wrap((req, res) => {
  const arr = Array.isArray(req.body) ? req.body : []
  const invalid = arr.find((p) => !p.userId && !p.vehicleId && !p.deviceId)
  if (invalid) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Each GPS point must include at least one of vehicleId, userId, or deviceId', code: 400 })
  }
  res.json({})
}))

// ---------- REPORTS ----------
function requireRange(req, res) {
  const from = Number(req.query.from)
  const to = Number(req.query.to)
  if (!from || !to) {
    res.status(400).json({ error: 'BAD_REQUEST', message: 'from/to required', code: 400 })
    return null
  }
  return { from, to, page: Number(req.query.page) || 1, pageSize: Number(req.query.pageSize) || 20 }
}

app.get('/api/v1/reports/trip/summary', auth, wrap((req, res) => {
  const p = requireRange(req, res); if (!p) return
  res.json(buildTripSummary(p.from, p.to, { page: p.page, pageSize: p.pageSize }))
}))

app.get('/api/v1/reports/trip/detail', auth, wrap((req, res) => {
  const p = requireRange(req, res); if (!p) return
  res.json(buildTripDetail(p.from, p.to, { page: p.page, pageSize: Number(req.query.pageSize) || 50 }))
}))

app.get('/api/v1/reports/fuel/summary', auth, wrap((req, res) => {
  const p = requireRange(req, res); if (!p) return
  res.json(buildFuelSummary(p.from, p.to, { page: p.page, pageSize: p.pageSize }))
}))

app.get('/api/v1/reports/fuel/detail', auth, wrap((req, res) => {
  const p = requireRange(req, res); if (!p) return
  res.json(buildFuelDetail(p.from, p.to, { page: p.page, pageSize: Number(req.query.pageSize) || 50 }))
}))

app.get('/api/v1/reports/activity-time', auth, wrap((req, res) => {
  const p = requireRange(req, res); if (!p) return
  res.json(buildActivityTime(p.from, p.to, { page: p.page, pageSize: Number(req.query.pageSize) || 50 }))
}))

// ---------- HEALTH ----------
app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'fleetwork-mock-server', members: MEMBERS.length, liveMapUsers: LARGE_MEMBERS.length })
})

app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: `No route for ${req.method} ${req.originalUrl}`, code: 404 })
})

app.listen(PORT, () => {
  console.log(`\n[fleetwork-mock] listening on http://localhost:${PORT}`)
  console.log(`  delay:   ${DELAY_MS}ms  (override with MOCK_DELAY=)`)
  console.log(`  api-key: ${EXPECTED_KEY ? 'enforced' : 'disabled (set MOCK_API_KEY=... to enable)'}\n`)
})

