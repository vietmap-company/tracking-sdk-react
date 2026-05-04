// Deterministic PRNG to keep mock data stable across refreshes for the same seed.
function mulberry32(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DAY_MS = 86_400_000

// ─── Original 12 members (used by Dashboard / Reports) ──────────────────────
export const MEMBERS = [
  { userId: 'user-001', name: 'Nguyễn Văn An', groupName: 'Đội A', vehicleId: 'vehicle-001', baseLat: 21.0285, baseLng: 105.8542 },
  { userId: 'user-002', name: 'Trần Thị Bình', groupName: 'Đội A', vehicleId: 'vehicle-002', baseLat: 21.0333, baseLng: 105.8500 },
  { userId: 'user-003', name: 'Lê Văn Cường', groupName: 'Đội B', vehicleId: 'vehicle-003', baseLat: 10.7769, baseLng: 106.7009 },
  { userId: 'user-004', name: 'Phạm Thị Dung', groupName: 'Đội B', vehicleId: 'vehicle-004', baseLat: 10.8231, baseLng: 106.6297 },
  { userId: 'user-005', name: 'Hoàng Văn Em', groupName: 'Đội C', vehicleId: 'vehicle-005', baseLat: 16.0544, baseLng: 108.2022 },
  { userId: 'user-006', name: 'Vũ Thị Phương', groupName: 'Đội C', vehicleId: 'vehicle-006', baseLat: 20.9101, baseLng: 105.7536 },
  { userId: 'user-007', name: 'Đặng Văn Giang', groupName: 'Đội A', vehicleId: 'vehicle-007', baseLat: 21.0122, baseLng: 105.8264 },
  { userId: 'user-008', name: 'Bùi Thị Hoa', groupName: 'Đội B', vehicleId: 'vehicle-008', baseLat: 10.7626, baseLng: 106.6602 },
  { userId: 'user-009', name: 'Ngô Văn Khánh', groupName: 'Đội C', vehicleId: 'vehicle-009', baseLat: 16.4637, baseLng: 107.5909 },
  { userId: 'user-010', name: 'Lý Thị Linh', groupName: 'Đội A', vehicleId: 'vehicle-010', baseLat: 21.0450, baseLng: 105.8300 },
  { userId: 'user-011', name: 'Phan Văn Minh', groupName: 'Đội B', vehicleId: 'vehicle-011', baseLat: 10.8000, baseLng: 106.6500 },
  { userId: 'user-012', name: 'Trịnh Thị Ngọc', groupName: 'Đội C', vehicleId: 'vehicle-012', baseLat: 12.2388, baseLng: 109.1967 },
]

const ADDRESSES = [
  'Hoàn Kiếm, Hà Nội',
  'Cầu Giấy, Hà Nội',
  'Ba Đình, Hà Nội',
  'Quận 1, TP. Hồ Chí Minh',
  'Quận 3, TP. Hồ Chí Minh',
  'Bình Thạnh, TP. Hồ Chí Minh',
  'Hải Châu, Đà Nẵng',
  'Thanh Khê, Đà Nẵng',
  'Huế',
  'Nha Trang',
]

const STATUS_LABELS = {
  moving: 'Đang di chuyển',
  stopped: 'Đã dừng',
  signal_lost: 'Mất tín hiệu',
}

// ─── 3500 large-scale members (used by GPS Tracking / LiveMap) ───────────────

const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Ngô', 'Lý', 'Phan', 'Trịnh', 'Đinh', 'Dương', 'Đỗ', 'Hà', 'Hồ', 'Cao', 'Võ', 'Tạ']
const MIDDLE_NAMES = ['Văn', 'Thị', 'Hữu', 'Minh', 'Ngọc', 'Thành', 'Quang', 'Thanh', 'Đức', 'Kim']
const FIRST_NAMES = ['An', 'Bình', 'Cường', 'Dung', 'Phương', 'Giang', 'Hoa', 'Khánh', 'Linh', 'Minh', 'Ngọc', 'Phúc', 'Sơn', 'Thảo', 'Uyên', 'Vân', 'Xuân', 'Hùng', 'Long', 'Nam', 'Tú', 'Việt', 'Anh', 'Hà', 'Thu', 'Mai', 'Đạt', 'Tâm', 'Hiếu', 'Trang']

// Major Vietnamese cities/provinces with spread radius (degrees)
const CITY_CLUSTERS = [
  { baseLat: 21.0285, baseLng: 105.8542, spread: 0.20 }, // Hà Nội
  { baseLat: 10.7769, baseLng: 106.7009, spread: 0.20 }, // TP.HCM
  { baseLat: 16.0544, baseLng: 108.2022, spread: 0.12 }, // Đà Nẵng
  { baseLat: 12.2388, baseLng: 109.1967, spread: 0.10 }, // Nha Trang
  { baseLat: 16.4637, baseLng: 107.5909, spread: 0.10 }, // Huế
  { baseLat: 20.8449, baseLng: 106.6881, spread: 0.12 }, // Hải Phòng
  { baseLat: 10.0452, baseLng: 105.7469, spread: 0.12 }, // Cần Thơ
  { baseLat: 11.0754, baseLng: 106.6427, spread: 0.10 }, // Bình Dương
  { baseLat: 10.9354, baseLng: 106.8252, spread: 0.10 }, // Đồng Nai
  { baseLat: 21.5928, baseLng: 105.8454, spread: 0.08 }, // Thái Nguyên
]

const TOTAL_LARGE_USERS = 3500
// Fixed seed — stable positions across server restarts
const _largeRand = mulberry32(20241101)

export const LARGE_MEMBERS = Array.from({ length: TOTAL_LARGE_USERS }, (_, i) => {
  const last = LAST_NAMES[Math.floor(_largeRand() * LAST_NAMES.length)]
  const mid = MIDDLE_NAMES[Math.floor(_largeRand() * MIDDLE_NAMES.length)]
  const first = FIRST_NAMES[Math.floor(_largeRand() * FIRST_NAMES.length)]
  const city = CITY_CLUSTERS[Math.floor(_largeRand() * CITY_CLUSTERS.length)]
  const group = Math.floor(i / 100) + 1 // 35 groups of ~100 users
  const baseLat = +(city.baseLat + (_largeRand() - 0.5) * city.spread * 2).toFixed(6)
  const baseLng = +(city.baseLng + (_largeRand() - 0.5) * city.spread * 2).toFixed(6)
  return {
    userId: `u${String(i + 1).padStart(4, '0')}`,
    name: `${last} ${mid} ${first}`,
    groupName: `Đội ${group}`,
    vehicleId: `v${String(i + 1).padStart(4, '0')}`,
    baseLat,
    baseLng,
  }
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfDayMs(ts) {
  const d = new Date(Number(ts))
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function fmtVnd(value) {
  return `${value.toLocaleString('vi-VN')} VND`
}

function pickStatus(rand) {
  const r = rand()
  if (r < 0.55) return 'moving'
  if (r < 0.85) return 'stopped'
  return 'signal_lost'
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
export function buildSummary(dateMs) {
  const date = startOfDayMs(dateMs)
  const rand = mulberry32(date)
  const active = 4 + Math.floor(rand() * 8) // 4..11
  const total = MEMBERS.length
  const km = +(400 + rand() * 800).toFixed(1)
  const seconds = Math.floor(8 * 3600 + rand() * 30 * 3600)
  const fuelCost = Math.floor(500_000 + rand() * 2_500_000)
  return {
    date,
    activeUsers: { active, total },
    totalDistance: { value: km, unit: 'km' },
    totalTravelTime: {
      totalSeconds: seconds,
      formatted: `${Math.floor(seconds / 3600)} giờ ${Math.floor((seconds % 3600) / 60)} phút`,
    },
    totalFuelCost: { value: fuelCost, currency: 'VND', formatted: fmtVnd(fuelCost) },
    generatedAt: Date.now(),
  }
}

// ─── DASHBOARD MEMBER REPORT ─────────────────────────────────────────────────
export function buildMemberReport(dateMs, { page = 1, pageSize = 20, status } = {}) {
  const date = startOfDayMs(dateMs)
  const rand = mulberry32(date + 1)
  const rows = MEMBERS.map((m, idx) => {
    const r = mulberry32(date + idx * 7)
    const st = pickStatus(r)
    const distanceKm = +(20 + r() * 240).toFixed(1)
    const travelSec = Math.floor(1800 + r() * 7 * 3600)
    const liters = +(distanceKm / (12 + r() * 6)).toFixed(1)
    const costVnd = Math.round(liters * 23000)
    const speed = st === 'moving' ? +(15 + r() * 70).toFixed(1) : 0
    const lastSeenAt = Date.now() - Math.floor(r() * (st === 'signal_lost' ? 60 * 60 * 1000 : 10 * 60 * 1000))
    const addr = ADDRESSES[idx % ADDRESSES.length]
    const jitter = () => (r() - 0.5) * 0.05
    return {
      userId: m.userId,
      groupName: m.groupName,
      distance: { value: distanceKm, unit: 'km' },
      travelTime: { totalSeconds: travelSec, formatted: fmtDuration(travelSec) },
      fuel: {
        consumedLiters: liters,
        costVnd,
        costFormatted: fmtVnd(costVnd),
        efficiencyKmPerL: +(distanceKm / liters).toFixed(1),
      },
      status: st,
      statusLabel: STATUS_LABELS[st],
      lastLocation: {
        lat: +(m.baseLat + jitter()).toFixed(6),
        lng: +(m.baseLng + jitter()).toFixed(6),
        address: addr,
        speed,
        time: lastSeenAt,
      },
      lastSeenAt,
      metaData: { userName: m.name, userAvatar: null },
    }
  })

  const filtered = status ? rows.filter((r) => r.status === status) : rows
  const summary = {
    total: rows.length,
    moving: rows.filter((r) => r.status === 'moving').length,
    stopped: rows.filter((r) => r.status === 'stopped').length,
    signalLost: rows.filter((r) => r.status === 'signal_lost').length,
  }

  const start = (page - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  return {
    date,
    summary,
    users: pageItems,
    pagination: {
      page,
      pageSize,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    },
  }
}

// ─── HEATMAP ─────────────────────────────────────────────────────────────────
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function buildHeatmap(fromMs, toMs, metric = 'distance') {
  const from = startOfDayMs(fromMs)
  const to = startOfDayMs(toMs)
  const cells = []
  let maxValue = 0
  let minValue = Infinity
  for (let day = from; day <= to; day += DAY_MS) {
    const rand = mulberry32(day)
    for (let hour = 0; hour < 24; hour++) {
      const peak = (hour >= 7 && hour <= 10) || (hour >= 16 && hour <= 19) ? 1.5 : 0.5
      const base = rand() * 60 * peak
      const value = +(base).toFixed(1)
      maxValue = Math.max(maxValue, value)
      minValue = Math.min(minValue, value)
      cells.push({
        dayOfWeek: DOW[new Date(day).getDay()],
        date: day,
        hour,
        value,
        label: metric === 'distance' ? `${value.toFixed(0)} km` : `${Math.floor(value)} pts`,
      })
    }
  }
  return {
    from,
    to,
    metric,
    resolution: 'hour',
    cells,
    maxValue: +maxValue.toFixed(1),
    minValue: minValue === Infinity ? 0 : +minValue.toFixed(1),
    totalCells: cells.length,
  }
}

// ─── FUEL TRACKING ───────────────────────────────────────────────────────────
export function buildFuelTracking(fromMs, toMs, groupBy = 'week') {
  const from = Number(fromMs)
  const to = Number(toMs)
  const series = []
  let totalDist = 0
  let totalFuel = 0

  if (groupBy === 'day') {
    for (let d = startOfDayMs(from); d <= to; d += DAY_MS) {
      const rand = mulberry32(d)
      const distance = +(50 + rand() * 200).toFixed(1)
      const liters = +(distance / (13 + rand() * 4)).toFixed(1)
      totalDist += distance
      totalFuel += liters
      const iso = new Date(d).toISOString().slice(0, 10)
      series.push({ period: iso, label: iso.slice(5), distanceKm: distance, fuelLiters: liters, efficiencyKmPerL: +(distance / liters).toFixed(2) })
    }
  } else if (groupBy === 'month') {
    const start = new Date(from)
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    for (let cur = start.getTime(); cur <= to; ) {
      const dt = new Date(cur)
      const rand = mulberry32(cur)
      const distance = +(800 + rand() * 2500).toFixed(1)
      const liters = +(distance / (14 + rand() * 4)).toFixed(1)
      totalDist += distance
      totalFuel += liters
      const mm = String(dt.getMonth() + 1).padStart(2, '0')
      series.push({ period: `${dt.getFullYear()}-${mm}`, label: dt.toLocaleString('en', { month: 'short' }), distanceKm: distance, fuelLiters: liters, efficiencyKmPerL: +(distance / liters).toFixed(2) })
      dt.setMonth(dt.getMonth() + 1)
      cur = dt.getTime()
    }
  } else {
    const start = new Date(from)
    const day = start.getDay() || 7
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - (day - 1))
    for (let cur = start.getTime(), i = 1; cur <= to; cur += 7 * DAY_MS, i++) {
      const rand = mulberry32(cur)
      const distance = +(200 + rand() * 900).toFixed(1)
      const liters = +(distance / (14 + rand() * 4)).toFixed(1)
      totalDist += distance
      totalFuel += liters
      const y = new Date(cur).getFullYear()
      const w = String(i).padStart(2, '0')
      series.push({ period: `${y}-W${w}`, label: `W${i}`, distanceKm: distance, fuelLiters: liters, efficiencyKmPerL: +(distance / liters).toFixed(2) })
    }
  }

  const avg = totalFuel > 0 ? totalDist / totalFuel : 0
  return {
    from,
    to,
    groupBy,
    fuelEfficiency: { value: +avg.toFixed(2), unit: 'km/L', trend: avg > 15 ? 'improving' : avg < 13 ? 'declining' : 'stable' },
    series,
    totals: { totalDistanceKm: +totalDist.toFixed(1), totalFuelLiters: +totalFuel.toFixed(1), avgEfficiencyKmPerL: +avg.toFixed(2) },
  }
}

// ─── MONTHLY COSTS ────────────────────────────────────────────────────────────
export function buildMonthlyCosts(fromMs, toMs, currency = 'VND') {
  const from = Number(fromMs)
  const to = Number(toMs)
  const start = new Date(from)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  const months = []
  const totals = { fuel: 0, maintenance: 0, insurance: 0, other: 0, grandTotal: 0 }
  for (let cur = start.getTime(); cur <= to; ) {
    const dt = new Date(cur)
    const rand = mulberry32(cur)
    const fuel = Math.round(500_000 + rand() * 2_500_000)
    const maintenance = Math.round(1_000_000 + rand() * 8_000_000)
    const insurance = Math.round(1_500_000 + rand() * 3_000_000)
    const other = Math.round(200_000 + rand() * 1_500_000)
    const total = fuel + maintenance + insurance + other
    totals.fuel += fuel
    totals.maintenance += maintenance
    totals.insurance += insurance
    totals.other += other
    totals.grandTotal += total
    months.push({ month: dt.getMonth() + 1, label: dt.toLocaleString('en', { month: 'short' }), costs: { fuel, maintenance, insurance, other, total } })
    dt.setMonth(dt.getMonth() + 1)
    cur = dt.getTime()
  }
  return {
    from,
    to,
    currency,
    months,
    totals,
    categories: [
      { key: 'fuel', label: 'Nhiên liệu', color: '#4F8EF7' },
      { key: 'maintenance', label: 'Bảo dưỡng', color: '#F7C24F' },
      { key: 'insurance', label: 'Bảo hiểm', color: '#4FF79B' },
      { key: 'other', label: 'Khác', color: '#F74F4F' },
    ],
  }
}

// ─── GPS HISTORY / LATEST ─────────────────────────────────────────────────────
export function buildLatestForUser(userId) {
  const m = MEMBERS.find((x) => x.userId === userId)
         || LARGE_MEMBERS.find((x) => x.userId === userId)
  if (!m) return null
  const rand = mulberry32(Date.now() % 100000 + userId.length * 13)
  const jitter = () => (rand() - 0.5) * 0.04
  const now = Date.now()
  const speed = +(rand() * 80).toFixed(1)
  const statusCode = speed > 0 ? 1 : 2
  return {
    time: now - Math.floor(rand() * 60_000),
    status: statusCode,
    lat: +(m.baseLat + jitter()).toFixed(6),
    lng: +(m.baseLng + jitter()).toFixed(6),
    speed,
    heading: Math.floor(rand() * 360),
    userId: m.userId,
    vehicleId: m.vehicleId,
    deviceId: `device-${m.userId}`,
    // metadata as JSON string so SDK can parse it
    metadata: JSON.stringify({ userName: m.name, groupName: m.groupName }),
    data: null,
  }
}

export function buildAllLatest() {
  return MEMBERS.map((m) => buildLatestForUser(m.userId)).filter(Boolean)
}

export function buildHistory({ vehicleId, userId, deviceId, fromTime, toTime, page = 1, pageSize = 100, sortDesc = true }) {
  const member =
    MEMBERS.find((m) => m.vehicleId === vehicleId) ||
    MEMBERS.find((m) => m.userId === userId) ||
    LARGE_MEMBERS.find((m) => m.userId === userId) ||
    MEMBERS[0]

  const from = Number(fromTime) || Date.now() - DAY_MS
  const to = Number(toTime) || Date.now()
  const stepMs = 60_000
  const totalCount = Math.max(0, Math.floor((to - from) / stepMs))

  const rand = mulberry32(from)
  const points = []
  let lat = member.baseLat
  let lng = member.baseLng
  for (let i = 0; i < totalCount; i++) {
    lat += (rand() - 0.5) * 0.0008
    lng += (rand() - 0.5) * 0.0008
    const speed = +(20 + rand() * 40).toFixed(1)
    points.push({
      time: from + i * stepMs,
      status: speed > 0 ? 1 : 2,
      lat: +lat.toFixed(6),
      lng: +lng.toFixed(6),
      speed,
      heading: Math.floor(rand() * 360),
      userId: member.userId,
      vehicleId: member.vehicleId,
      deviceId: `device-${member.userId}`,
      metadata: null,
      data: null,
    })
  }

  if (sortDesc) points.reverse()
  const start = (page - 1) * pageSize
  const paged = points.slice(start, start + pageSize)

  return {
    trackingData: paged,
    totalCount: points.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(points.length / pageSize)),
    hasNextPage: start + pageSize < points.length,
    hasPreviousPage: page > 1,
  }
}

// ─── GPS TRACKING USERS (LiveMap endpoint) ────────────────────────────────────
// Uses LARGE_MEMBERS (3500 users) with minute-stable positions.
// Positions shift slightly every poll interval to simulate real-time movement.
export function buildUsers({ keyword, status, pageNumber = 1, pageSize = 3000 } = {}) {
  const now = Date.now()
  // timeSeed changes every 30s → positions drift slightly each poll
  const timeSeed = Math.floor(now / 30_000)

  let items = LARGE_MEMBERS.map((m, idx) => {
    const rand = mulberry32(timeSeed + idx * 7)
    const roll = rand()
    // 55% moving, 30% stopped, 15% signal_lost
    const statusCode = roll < 0.55 ? 1 : roll < 0.85 ? 2 : 0
    const speed = statusCode === 1 ? +(15 + rand() * 70).toFixed(1) : 0
    // Members 50–52 share a fixed isolated coordinate for spiderfy testing
    // (picked a location away from city clusters so they don't visually interfere)
    const SPIDER_TEST = idx >= 50 && idx < 53
    const lat = SPIDER_TEST ? 16.400000 : +(m.baseLat + (rand() - 0.5) * 0.004).toFixed(6)
    const lng = SPIDER_TEST ? 107.600000 : +(m.baseLng + (rand() - 0.5) * 0.004).toFixed(6)
    const lastSeenDeltaMs = statusCode === 0
      ? Math.floor(rand() * 2 * 3_600_000)  // signal_lost: 0–2h ago
      : Math.floor(rand() * 60_000)          // active: within last minute
    const lastSeenAt = now - lastSeenDeltaMs
    const statusStr = statusCode === 1 ? 'moving' : statusCode === 2 ? 'stopped' : 'signal_lost'

    return {
      id: m.userId,
      userId: m.userId,
      vehicleId: m.vehicleId,
      deviceId: `device-${m.userId}`,
      status: statusStr,
      statusCode,
      lastSeenAt,
      lastLocation: {
        time: lastSeenAt,
        status: statusCode,
        lat,
        lng,
        speed,
        heading: Math.floor(rand() * 360),
        userId: m.userId,
        vehicleId: m.vehicleId,
        deviceId: `device-${m.userId}`,
        // metadata as JSON string so SDK parseMeta() can parse it
        metadata: JSON.stringify({ userName: m.name, groupName: m.groupName }),
        data: null,
      },
    }
  })

  if (status) items = items.filter((u) => u.status === status)
  if (keyword) {
    const q = keyword.toLowerCase()
    items = items.filter((u) => u.userId.toLowerCase().includes(q))
  }

  const totalCount = items.length
  const start = (pageNumber - 1) * pageSize
  const paged = items.slice(start, start + pageSize)

  return {
    users: paged,
    totalCount,
    page: pageNumber,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    hasNextPage: start + pageSize < totalCount,
    hasPreviousPage: pageNumber > 1,
  }
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
export function buildTripSummary(fromMs, toMs, { page = 1, pageSize = 20 } = {}) {
  const from = Number(fromMs)
  const to = Number(toMs)
  const employees = MEMBERS.map((m, i) => {
    const r = mulberry32(from + i)
    const dist = +(500 + r() * 2000).toFixed(1)
    const travelSec = Math.floor(20 * 3600 + r() * 120 * 3600)
    const stopSec = Math.floor(2 * 3600 + r() * 20 * 3600)
    return {
      userId: m.userId,
      name: m.name,
      groupName: m.groupName,
      totalDistanceKm: dist,
      travelTime: { totalSeconds: travelSec, formatted: `${Math.floor(travelSec / 3600)} giờ ${Math.floor((travelSec % 3600) / 60)} phút` },
      stopTime: { totalSeconds: stopSec, formatted: `${Math.floor(stopSec / 3600)} giờ ${Math.floor((stopSec % 3600) / 60)} phút` },
      maxSpeedKmh: +(60 + r() * 50).toFixed(1),
      minSpeedKmh: +(5 + r() * 15).toFixed(1),
      tripDays: Math.floor(5 + r() * 20),
    }
  })
  const start = (page - 1) * pageSize
  return {
    reportType: 'trip_summary',
    from,
    to,
    employees: employees.slice(start, start + pageSize),
    pagination: { page, pageSize, totalItems: employees.length, totalPages: Math.ceil(employees.length / pageSize) },
    generatedAt: Date.now(),
  }
}

function fmtDuration(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${h} giờ ${m} phút`
}

function formatVnd(n) {
  return n.toLocaleString('vi-VN') + ' VNĐ'
}

function daySpan(fromMs, toMs) {
  return Math.max(1, Math.ceil((toMs - fromMs) / DAY_MS))
}

export function buildTripDetail(fromMs, toMs, { page = 1, pageSize = 50 } = {}) {
  const from = Number(fromMs)
  const to = Number(toMs)
  const days = daySpan(from, to)
  const trips = []
  MEMBERS.forEach((m, mi) => {
    for (let d = 0; d < days; d++) {
      const r = mulberry32(from + mi * 31 + d * 7)
      const dayStart = from + d * DAY_MS
      const startOffset = Math.floor(6 * 3600 + r() * 4 * 3600) * 1000
      const durationMs = Math.floor(4 * 3600 + r() * 8 * 3600) * 1000
      const dist = +(40 + r() * 200).toFixed(1)
      const travelSec = Math.floor(durationMs / 1000)
      const stopSec = Math.floor(travelSec * 0.2)
      trips.push({
        date: dayStart,
        userId: m.userId,
        name: m.name,
        startTime: dayStart + startOffset,
        endTime: dayStart + startOffset + durationMs,
        distanceKm: dist,
        travelTime: { totalSeconds: travelSec, formatted: fmtDuration(travelSec) },
        stopTime: { totalSeconds: stopSec, formatted: fmtDuration(stopSec) },
        maxSpeedKmh: +(60 + r() * 50).toFixed(1),
        minSpeedKmh: +(5 + r() * 15).toFixed(1),
        startLocation: { lat: m.baseLat, lng: m.baseLng, address: `Điểm đầu ${mi}-${d}` },
        endLocation: { lat: m.baseLat + 0.02, lng: m.baseLng + 0.02, address: `Điểm cuối ${mi}-${d}` },
      })
    }
  })
  const start = (page - 1) * pageSize
  return {
    reportType: 'trip_detail',
    trips: trips.slice(start, start + pageSize),
    pagination: { page, pageSize, totalItems: trips.length, totalPages: Math.ceil(trips.length / pageSize) },
    generatedAt: Date.now(),
  }
}

export function buildFuelSummary(fromMs, toMs, { page = 1, pageSize = 20 } = {}) {
  const from = Number(fromMs)
  const to = Number(toMs)
  const efficiency = 7.0
  const price = 23000
  const employees = MEMBERS.map((m, i) => {
    const r = mulberry32(from + i * 13)
    const dist = +(500 + r() * 2000).toFixed(1)
    const travelSec = Math.floor(20 * 3600 + r() * 120 * 3600)
    const liters = +((dist * efficiency) / 100).toFixed(1)
    const cost = Math.round(liters * price)
    return {
      userId: m.userId,
      name: m.name,
      groupName: m.groupName,
      distanceKm: dist,
      travelTime: { totalSeconds: travelSec, formatted: fmtDuration(travelSec) },
      fuelStandardLiters: liters,
      totalCostVnd: cost,
      totalCostFormatted: formatVnd(cost),
    }
  })
  const totals = employees.reduce(
    (acc, e) => ({ distanceKm: +(acc.distanceKm + e.distanceKm).toFixed(1), fuelStandardLiters: +(acc.fuelStandardLiters + e.fuelStandardLiters).toFixed(1), totalCostVnd: acc.totalCostVnd + e.totalCostVnd }),
    { distanceKm: 0, fuelStandardLiters: 0, totalCostVnd: 0 },
  )
  const start = (page - 1) * pageSize
  return {
    reportType: 'fuel_summary',
    fuelConfig: { efficiencyLper100km: efficiency, pricePerLiterVnd: price },
    employees: employees.slice(start, start + pageSize),
    totals: { ...totals, totalCostFormatted: formatVnd(totals.totalCostVnd) },
    pagination: { page, pageSize, totalItems: employees.length, totalPages: Math.ceil(employees.length / pageSize) },
    generatedAt: Date.now(),
  }
}

export function buildFuelDetail(fromMs, toMs, { page = 1, pageSize = 50 } = {}) {
  const from = Number(fromMs)
  const to = Number(toMs)
  const efficiency = 7.0
  const price = 23000
  const days = daySpan(from, to)
  const trips = []
  MEMBERS.forEach((m, mi) => {
    for (let d = 0; d < days; d++) {
      const r = mulberry32(from + mi * 31 + d * 11)
      const dayStart = from + d * DAY_MS
      const startOffset = Math.floor(6 * 3600 + r() * 4 * 3600) * 1000
      const durationMs = Math.floor(4 * 3600 + r() * 8 * 3600) * 1000
      const dist = +(40 + r() * 200).toFixed(1)
      const travelSec = Math.floor(durationMs / 1000)
      const liters = +((dist * efficiency) / 100).toFixed(1)
      const cost = Math.round(liters * price)
      trips.push({
        date: dayStart,
        userId: m.userId,
        name: m.name,
        startTime: dayStart + startOffset,
        endTime: dayStart + startOffset + durationMs,
        distanceKm: dist,
        travelTime: { totalSeconds: travelSec, formatted: fmtDuration(travelSec) },
        fuelStandardLiters: liters,
        fuelPricePerLiterVnd: price,
        totalCostVnd: cost,
        totalCostFormatted: formatVnd(cost),
      })
    }
  })
  const totals = trips.reduce(
    (acc, e) => ({ distanceKm: +(acc.distanceKm + e.distanceKm).toFixed(1), fuelStandardLiters: +(acc.fuelStandardLiters + e.fuelStandardLiters).toFixed(1), totalCostVnd: acc.totalCostVnd + e.totalCostVnd }),
    { distanceKm: 0, fuelStandardLiters: 0, totalCostVnd: 0 },
  )
  const start = (page - 1) * pageSize
  return {
    reportType: 'fuel_detail',
    trips: trips.slice(start, start + pageSize),
    totals: { ...totals, totalCostFormatted: formatVnd(totals.totalCostVnd) },
    pagination: { page, pageSize, totalItems: trips.length, totalPages: Math.ceil(trips.length / pageSize) },
    generatedAt: Date.now(),
  }
}

export function buildActivityTime(fromMs, toMs, { page = 1, pageSize = 50 } = {}) {
  const from = Number(fromMs)
  const to = Number(toMs)
  const days = daySpan(from, to)
  const rows = []
  const total = MEMBERS.length
  for (let d = 0; d < days; d++) {
    const dayStart = from + d * DAY_MS
    for (let h = 0; h < 24; h++) {
      const r = mulberry32(from + d * 37 + h * 3)
      const active = h >= 7 && h <= 19
        ? Math.floor(2 + r() * Math.max(1, total - 2))
        : Math.floor(r() * Math.min(2, total))
      rows.push({
        date: dayStart,
        hour: h,
        activeEmployeeCount: active,
        inactiveEmployeeCount: Math.max(0, total - active),
        totalDistanceKm: +(active * (20 + r() * 80)).toFixed(1),
      })
    }
  }
  const totals = { totalDistanceKm: +rows.reduce((a, r) => a + r.totalDistanceKm, 0).toFixed(1) }
  const start = (page - 1) * pageSize
  return {
    reportType: 'activity_time',
    totalEmployees: total,
    rows: rows.slice(start, start + pageSize),
    totals,
    pagination: { page, pageSize, totalItems: rows.length, totalPages: Math.ceil(rows.length / pageSize) },
    generatedAt: Date.now(),
  }
}
