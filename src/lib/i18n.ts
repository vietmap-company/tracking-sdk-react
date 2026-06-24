import type { Locale } from './types'

type Dict = Record<string, string>

const vi: Dict = {
  // Summary cards
  'summary.activeEmployees':    'Nhân viên hoạt động',
  'summary.totalDistance':      'Tổng quãng đường hôm nay',
  'summary.totalTravelTime':    'Tổng thời gian di chuyển',
  'summary.totalFuelCost':      'Tổng chi phí nhiên liệu',

  // Dashboard member report
  'report.title':               'Báo cáo nhân viên hôm nay',
  'report.total':               'Tổng nhân viên',
  'report.moving':              'Đang di chuyển',
  'report.stopped':             'Dừng',
  'report.signalLost':          'Mất tín hiệu',
  'report.col.employee':        'Nhân viên',
  'report.col.distance':        'Quãng đường (km)',
  'report.col.travelTime':      'TG di chuyển',
  'report.col.fuel':            'Nhiên liệu (lít)',
  'report.col.fuelCost':        'Chi phí NL',
  'report.col.status':          'Trạng thái',
  'report.empty':               'Không có dữ liệu',
  'report.page':                'Trang',
  'report.of':                  '/',
  'report.prev':                'Trước',
  'report.next':                'Sau',

  // LiveMap member list
  'list.title':                 'Nhân viên',
  'list.search':                'Tìm kiếm...',
  'list.moving':                'Đang di chuyển',
  'list.stopped':               'Dừng',
  'list.lost':                  'Mất tín hiệu',

  // Status labels
  'status.moving':              'Đang di chuyển',
  'status.stopped':             'Dừng',
  'status.signal_lost':         'Mất tín hiệu',

  // Common
  'common.loading':             'Đang tải...',
  'common.error':               'Đã xảy ra lỗi',
  'common.retry':               'Thử lại',
  'common.noData':              'Chưa có dữ liệu',
  'common.back':                'Quay lại',
  'common.from':                'Từ ngày',
  'common.to':                  'Đến ngày',

  // Reports home
  'reports.title':              'Báo cáo',
  'reports.subtitle':           'Tổng hợp hoạt động đội xe & nhân viên',
  'reports.trip.title':         'Báo cáo hành trình',
  'reports.trip.subtitle':      'Quãng đường, thời gian, tốc độ',
  'reports.fuel.title':         'Báo cáo nhiên liệu',
  'reports.fuel.subtitle':      'Định mức & chi phí nhiên liệu',
  'reports.activity.title':     'Báo cáo giờ hoạt động',
  'reports.activity.subtitle':  'Số nhân viên hoạt động theo giờ',
  'reports.tab.summary':        'Tổng hợp',
  'reports.tab.detail':         'Chi tiết',
  'reports.viewDetail':         'Xem chi tiết',

  // Report columns
  'reports.col.employee':       'Nhân viên',
  'reports.col.action':         'Thao tác',
  'reports.col.group':          'Nhóm',
  'reports.col.date':           'Ngày',
  'reports.col.distance':       'Quãng đường',
  'reports.col.travelTime':     'TG di chuyển',
  'reports.col.stopTime':       'TG dừng',
  'reports.col.maxSpeed':       'Tốc độ max',
  'reports.col.minSpeed':       'Tốc độ min',
  'reports.col.tripDays':       'Số ngày',
  'reports.col.startTime':      'Bắt đầu',
  'reports.col.endTime':        'Kết thúc',
  'reports.col.startLocation':  'Điểm đầu',
  'reports.col.endLocation':    'Điểm cuối',
  'reports.col.fuelLiters':     'Định mức (lít)',
  'reports.col.pricePerLiter':  'Đơn giá (VNĐ/L)',
  'reports.col.totalCost':      'Chi phí',
  'reports.col.hour':           'Giờ',
  'reports.col.activeCount':    'Đang hoạt động',
  'reports.col.inactiveCount':  'Không hoạt động',
  'reports.totals':             'Tổng cộng',

  // Datepicker
  'datepicker.placeholder':     'Chọn ngày',
  'datepicker.apply':           'Áp dụng',
  'datepicker.cancel':          'Hủy',
  'datepicker.range.placeholder': 'Chọn khoảng ngày',

  // Fuel tracking chart
  'fuel.title':                 'Theo dõi nhiên liệu',
  'fuel.subtitle':              'Quãng đường vs Tiêu thụ nhiên liệu',
  'fuel.efficiency':            'Hiệu suất TB',
  'fuel.distance':              'Quãng đường (km)',
  'fuel.fuel':                  'Nhiên liệu (L)',

  // Monthly expenses chart
  'expenses.title':             'Chi phí theo tháng',
  'expenses.subtitle':          'Phân loại chi phí theo tháng',
  'expenses.unit':              'Triệu VNĐ',
  'expenses.fuel':              'Nhiên liệu',
  'expenses.maintenance':       'Bảo dưỡng',
  'expenses.insurance':         'Bảo hiểm',
  'expenses.other':             'Khác',

  // Activity heatmap
  'heatmap.title':              'Giờ hoạt động',
  'heatmap.less':               'Ít',
  'heatmap.more':               'Nhiều',
  'heatmap.prevWeek':           'Tuần trước',
  'heatmap.nextWeek':           'Tuần sau',

  // History panel
  'history.title':              'Lộ trình',
  'history.date':               'Ngày',
  'history.load':               'Tải',
  'history.loading':            'Đang tải lộ trình...',
  'history.noData':             'Không có dữ liệu di chuyển',
  'history.distance':           'Quãng đường',
  'history.duration':           'Thời gian',
  'history.moving':             'Di chuyển',
  'history.stopped':            'Dừng',
  'history.lostGps':            'Mất GPS',
}

// Tiếng Anh fallback về tiếng Việt
const en: Dict = { ...vi }

const DICTS: Record<Locale, Dict> = { vi, en }

export function createTranslator(locale: Locale) {
  const dict = DICTS[locale] ?? vi
  return (key: string): string => dict[key] ?? key
}

export type TFn = ReturnType<typeof createTranslator>
