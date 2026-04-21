import type { Locale } from "./types";

type Dict = Record<string, string>;

const vi: Dict = {
  "summary.activeEmployees": "Nhân viên đang hoạt động",
  "summary.totalDistance": "Tổng quãng đường hôm nay",
  "summary.totalTravelTime": "Tổng thời gian di chuyển",
  "summary.totalFuelCost": "Tổng chi phí nhiên liệu hôm nay",

  "report.title": "Báo cáo chi tiết Nhân viên hôm nay",
  "report.total": "Tổng nhân viên",
  "report.moving": "Đang hoạt động",
  "report.stopped": "Dừng / Nghỉ",
  "report.signalLost": "Mất tín hiệu",
  "report.col.employee": "Nhân viên",
  "report.col.distance": "Quãng đường (km)",
  "report.col.travelTime": "Thời gian di chuyển",
  "report.col.fuel": "Nhiên liệu (lít)",
  "report.col.fuelCost": "Chi phí nhiên liệu (triệu VNĐ)",
  "report.col.status": "Trạng thái",
  "report.empty": "Không có dữ liệu",
  "report.page": "Trang",
  "report.of": "/",
  "report.prev": "Trước",
  "report.next": "Sau",

  "heatmap.title": "Giờ hoạt động",
  "heatmap.less": "Ít",
  "heatmap.more": "Nhiều",

  "fuel.title": "Theo dõi nhiên liệu",
  "fuel.subtitle": "Quãng đường vs Tiêu thụ Nhiên liệu",
  "fuel.efficiency": "Hiệu suất TB",
  "fuel.distance": "Quãng đường (km)",
  "fuel.fuel": "Nhiên liệu (L)",

  "expenses.title": "Chi phí theo tháng",
  "expenses.subtitle": "Phân loại chi phí theo tháng",
  "expenses.unit": "Triệu VNĐ",
  "expenses.fuel": "Nhiên liệu",
  "expenses.maintenance": "Bảo dưỡng",
  "expenses.insurance": "Bảo hiểm",
  "expenses.other": "Khác",

  "list.title": "Nhân viên",
  "list.search": "Tìm kiếm...",
  "list.moving": "Hoạt động",
  "list.stopped": "Dừng",
  "list.lost": "Mất tín hiệu",

  "history.title": "Lộ trình",
  "history.date": "Ngày",
  "history.load": "Tải",
  "history.loading": "Đang tải lộ trình...",
  "history.noData": "Không có lịch sử di chuyển",
  "history.distance": "Quãng đường",
  "history.duration": "Thời gian",
  "history.moving": "Di chuyển",
  "history.stopped": "Dừng",
  "history.lostGps": "Mất GPS",

  "status.moving": "Đang di chuyển",
  "status.stopped": "Đang dừng",
  "status.signal_lost": "Mất tín hiệu",

  "common.loading": "Đang tải...",
  "common.error": "Đã xảy ra lỗi",
  "common.retry": "Thử lại",
  "common.noData": "Chưa có dữ liệu",
};

const en: Dict = {
  "summary.activeEmployees": "Active employees",
  "summary.totalDistance": "Today's total distance",
  "summary.totalTravelTime": "Total travel time",
  "summary.totalFuelCost": "Today's total fuel cost",

  "report.title": "Today's employee detail report",
  "report.total": "Total employees",
  "report.moving": "Active",
  "report.stopped": "Stopped / Idle",
  "report.signalLost": "Signal lost",
  "report.col.employee": "Employee",
  "report.col.distance": "Distance (km)",
  "report.col.travelTime": "Travel time",
  "report.col.fuel": "Fuel (L)",
  "report.col.fuelCost": "Fuel cost (million VND)",
  "report.col.status": "Status",
  "report.empty": "No data",
  "report.page": "Page",
  "report.of": "/",
  "report.prev": "Prev",
  "report.next": "Next",

  "heatmap.title": "Activity hours",
  "heatmap.less": "Less",
  "heatmap.more": "More",

  "fuel.title": "Fuel tracking",
  "fuel.subtitle": "Distance vs Fuel consumption",
  "fuel.efficiency": "Avg efficiency",
  "fuel.distance": "Distance (km)",
  "fuel.fuel": "Fuel (L)",

  "expenses.title": "Monthly expenses",
  "expenses.subtitle": "Cost breakdown by month",
  "expenses.unit": "Million VND",
  "expenses.fuel": "Fuel",
  "expenses.maintenance": "Maintenance",
  "expenses.insurance": "Insurance",
  "expenses.other": "Other",

  "list.title": "Members",
  "list.search": "Search...",
  "list.moving": "Active",
  "list.stopped": "Stopped",
  "list.lost": "Signal lost",

  "history.title": "Route history",
  "history.date": "Date",
  "history.load": "Load",
  "history.loading": "Loading route...",
  "history.noData": "No trip history for this day",
  "history.distance": "Distance",
  "history.duration": "Duration",
  "history.moving": "Moving",
  "history.stopped": "Stopped",
  "history.lostGps": "GPS lost",

  "status.moving": "Moving",
  "status.stopped": "Stopped",
  "status.signal_lost": "Signal lost",

  "common.loading": "Loading...",
  "common.error": "An error occurred",
  "common.retry": "Retry",
  "common.noData": "No data yet",
};

const DICTS: Record<Locale, Dict> = { vi, en };

export function createTranslator(locale: Locale) {
  const dict = DICTS[locale] ?? vi;
  return (key: string): string => dict[key] ?? key;
}

export type TFn = ReturnType<typeof createTranslator>;
