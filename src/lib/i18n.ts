import type { Locale } from './types'

type Dict = Record<string, string>

const vi = {
  // Summary cards
  'summary.activeEmployees':    'Nhân viên hoạt động',
  'summary.totalDistance':      'Tổng quãng đường hôm nay',
  'summary.totalTravelTime':    'Tổng thời gian di chuyển',
  'summary.totalFuelCost':      'Tổng chi phí nhiên liệu',
  'summary.activeSuffix':       'đang hoạt động',

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
  'list.more':                  '{n} người nữa...',

  // LiveMap marker popup
  'popup.speed':                'Tốc độ',
  'popup.updated':              'Cập nhật',
  'popup.group':                'Nhóm',
  'popup.coords':               'Tọa độ',
  'popup.viewHistory':          'Xem lộ trình',

  // Export Excel
  'export.title':               'Xuất Excel theo bộ lọc hiện tại',

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

  // Thời gian tương đối + đơn vị rút gọn ({n} được thay bằng số)
  'time.justNow':               'vừa xong',
  'time.minutesAgo':            '{n} phút trước',
  'time.hoursAgo':              '{n} giờ trước',
  'time.daysAgo':               '{n} ngày trước',
  'unit.d':                     'n',
  'unit.h':                     'g',
  'unit.m':                     'p',
  'unit.s':                     's',

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
  'reports.employees':          'nhân viên',

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
  'heatmap.gpsPoints':          'điểm GPS',
  'heatmap.noActivity':         'Không có hoạt động',
  'heatmap.day.0':              'T2',
  'heatmap.day.1':              'T3',
  'heatmap.day.2':              'T4',
  'heatmap.day.3':              'T5',
  'heatmap.day.4':              'T6',
  'heatmap.day.5':              'T7',
  'heatmap.day.6':              'CN',

  // History panel
  'history.title':              'Lộ trình',
  'history.date':               'Ngày',
  'history.load':               'Tải',
  'history.loading':            'Đang tải lộ trình...',
  'history.noData':             'Không có dữ liệu di chuyển',
  'history.noDataDay':          'Không có dữ liệu trong ngày này',
  'history.distance':           'Quãng đường',
  'history.duration':           'Thời gian',
  'history.moving':             'Di chuyển',
  'history.stopped':            'Dừng',
  'history.lostGps':            'Mất GPS',
  'history.points':             'điểm',
  'history.col.time':           'Giờ',
  'history.col.speed':          'Tốc độ',

  // Playback controls
  'playback.speed':             'Tốc độ phát lại',
  'playback.showRaw':           'Hiện GPS gốc (raw)',
  'playback.hideRaw':           'Ẩn GPS gốc (raw)',
  'playback.followOn':          'Tự bám theo: bật',
  'playback.followOff':         'Tự bám theo: tắt',
} satisfies Dict

type Key = keyof typeof vi

// Kiểu `Record<Key, string>` — thiếu key nào so với `vi` là TypeScript báo lỗi.
const en: Record<Key, string> = {
  'summary.activeEmployees':    'Active employees',
  'summary.totalDistance':      'Total distance today',
  'summary.totalTravelTime':    'Total travel time',
  'summary.totalFuelCost':      'Total fuel cost',
  'summary.activeSuffix':       'active',

  'report.title':               "Today's employee report",
  'report.total':               'Total employees',
  'report.moving':              'Moving',
  'report.stopped':             'Stopped',
  'report.signalLost':          'Signal lost',
  'report.col.employee':        'Employee',
  'report.col.distance':        'Distance (km)',
  'report.col.travelTime':      'Travel time',
  'report.col.fuel':            'Fuel (L)',
  'report.col.fuelCost':        'Fuel cost',
  'report.col.status':          'Status',
  'report.empty':               'No data',
  'report.page':                'Page',
  'report.of':                  '/',
  'report.prev':                'Previous',
  'report.next':                'Next',

  'list.title':                 'Employees',
  'list.search':                'Search...',
  'list.moving':                'Moving',
  'list.stopped':               'Stopped',
  'list.lost':                  'Signal lost',
  'list.more':                  '{n} more...',

  'popup.speed':                'Speed',
  'popup.updated':              'Updated',
  'popup.group':                'Group',
  'popup.coords':               'Coordinates',
  'popup.viewHistory':          'View route',

  'export.title':               'Export to Excel with current filters',

  'status.moving':              'Moving',
  'status.stopped':             'Stopped',
  'status.signal_lost':         'Signal lost',

  'common.loading':             'Loading...',
  'common.error':               'Something went wrong',
  'common.retry':               'Retry',
  'common.noData':              'No data yet',
  'common.back':                'Back',
  'common.from':                'From',
  'common.to':                  'To',

  'time.justNow':               'just now',
  'time.minutesAgo':            '{n} min ago',
  'time.hoursAgo':              '{n} h ago',
  'time.daysAgo':               '{n} d ago',
  'unit.d':                     'd',
  'unit.h':                     'h',
  'unit.m':                     'm',
  'unit.s':                     's',

  'reports.title':              'Reports',
  'reports.subtitle':           'Fleet & employee activity overview',
  'reports.trip.title':         'Trip report',
  'reports.trip.subtitle':      'Distance, time, speed',
  'reports.fuel.title':         'Fuel report',
  'reports.fuel.subtitle':      'Fuel allowance & cost',
  'reports.activity.title':     'Activity hours report',
  'reports.activity.subtitle':  'Active employees by hour',
  'reports.tab.summary':        'Summary',
  'reports.tab.detail':         'Detail',
  'reports.viewDetail':         'View detail',
  'reports.employees':          'employees',

  'reports.col.employee':       'Employee',
  'reports.col.action':         'Action',
  'reports.col.group':          'Group',
  'reports.col.date':           'Date',
  'reports.col.distance':       'Distance',
  'reports.col.travelTime':     'Travel time',
  'reports.col.stopTime':       'Stop time',
  'reports.col.maxSpeed':       'Max speed',
  'reports.col.minSpeed':       'Min speed',
  'reports.col.tripDays':       'Days',
  'reports.col.startTime':      'Start',
  'reports.col.endTime':        'End',
  'reports.col.startLocation':  'Start location',
  'reports.col.endLocation':    'End location',
  'reports.col.fuelLiters':     'Allowance (L)',
  'reports.col.pricePerLiter':  'Price (VND/L)',
  'reports.col.totalCost':      'Cost',
  'reports.col.hour':           'Hour',
  'reports.col.activeCount':    'Active',
  'reports.col.inactiveCount':  'Inactive',
  'reports.totals':             'Total',

  'datepicker.placeholder':     'Pick a date',
  'datepicker.apply':           'Apply',
  'datepicker.cancel':          'Cancel',
  'datepicker.range.placeholder': 'Pick a date range',

  'fuel.title':                 'Fuel tracking',
  'fuel.subtitle':              'Distance vs fuel consumption',
  'fuel.efficiency':            'Avg efficiency',
  'fuel.distance':              'Distance (km)',
  'fuel.fuel':                  'Fuel (L)',

  'expenses.title':             'Monthly expenses',
  'expenses.subtitle':          'Expenses by category per month',
  'expenses.unit':              'Million VND',
  'expenses.fuel':              'Fuel',
  'expenses.maintenance':       'Maintenance',
  'expenses.insurance':         'Insurance',
  'expenses.other':             'Other',

  'heatmap.title':              'Activity hours',
  'heatmap.less':               'Less',
  'heatmap.more':               'More',
  'heatmap.prevWeek':           'Previous week',
  'heatmap.nextWeek':           'Next week',
  'heatmap.gpsPoints':          'GPS points',
  'heatmap.noActivity':         'No activity',
  'heatmap.day.0':              'Mon',
  'heatmap.day.1':              'Tue',
  'heatmap.day.2':              'Wed',
  'heatmap.day.3':              'Thu',
  'heatmap.day.4':              'Fri',
  'heatmap.day.5':              'Sat',
  'heatmap.day.6':              'Sun',

  'history.title':              'Route',
  'history.date':               'Date',
  'history.load':               'Load',
  'history.loading':            'Loading route...',
  'history.noData':             'No movement data',
  'history.noDataDay':          'No data for this day',
  'history.distance':           'Distance',
  'history.duration':           'Duration',
  'history.moving':             'Moving',
  'history.stopped':            'Stopped',
  'history.lostGps':            'GPS lost',
  'history.points':             'points',
  'history.col.time':           'Time',
  'history.col.speed':          'Speed',

  'playback.speed':             'Playback speed',
  'playback.showRaw':           'Show raw GPS',
  'playback.hideRaw':           'Hide raw GPS',
  'playback.followOn':          'Auto-follow: on',
  'playback.followOff':         'Auto-follow: off',
}

const DICTS: Record<Locale, Dict> = { vi, en }

export function createTranslator(locale: Locale) {
  const dict = DICTS[locale] ?? vi
  return (key: string): string => dict[key] ?? (vi as Dict)[key] ?? key
}

export type TFn = ReturnType<typeof createTranslator>
