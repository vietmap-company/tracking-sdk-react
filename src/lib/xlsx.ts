/**
 * Trình ghi XLSX tối giản, zero-dependency (~200 dòng thay vì kéo SheetJS ~1MB).
 *
 * File .xlsx bản chất là ZIP chứa các XML theo chuẩn SpreadsheetML. Ở đây:
 *   - ZIP ghi ở chế độ STORED (không nén) — Excel/LibreOffice/Google Sheets
 *     đều đọc bình thường; dữ liệu export cỡ vài nghìn dòng thì kích thước
 *     không thành vấn đề.
 *   - String ghi dạng inline (`t="inlineStr"`) để khỏi cần sharedStrings.xml.
 *   - Chỉ hỗ trợ giá trị string | number | null (đủ cho bảng export).
 */

export type XlsxCell = string | number | null | undefined
export interface XlsxSheet {
  name: string
  rows: XlsxCell[][]
  /** Tô kiểu dòng đầu làm header (nền xanh đậm, chữ trắng đậm, viền, canh
   *  giữa) như file báo cáo mẫu. Mặc định `true`. */
  headerRow?: boolean
}

/**
 * styles.xml — 2 kiểu ô: mặc định (index 0) và HEADER (index 1) khớp file mẫu:
 * nền xanh đậm #1F4E79, chữ trắng in đậm, viền mảnh, canh giữa + wrap.
 */
const STYLES_XML =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<fonts count="2">` +
  `<font><sz val="11"/><name val="Calibri"/></font>` +
  `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>` +
  `</fonts>` +
  `<fills count="3">` +
  `<fill><patternFill patternType="none"/></fill>` +
  `<fill><patternFill patternType="gray125"/></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/></patternFill></fill>` +
  `</fills>` +
  `<borders count="2">` +
  `<border><left/><right/><top/><bottom/><diagonal/></border>` +
  `<border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border>` +
  `</borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="2">` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>` +
  `</cellXfs>` +
  `</styleSheet>`

// ── CRC32 (bảng chuẩn IEEE 802.3, dùng cho ZIP) ──────────────────────────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++)
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

// ── ZIP writer (STORED) ──────────────────────────────────────────────────────

interface ZipEntry {
  path: string
  data: Uint8Array
}

function dosDateTime(d: Date): { date: number; time: number } {
  return {
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
  }
}

function buildZip(entries: ZipEntry[]): Uint8Array {
  const enc = new TextEncoder()
  const now = dosDateTime(new Date())
  const parts: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0

  const u16 = (v: number) => [v & 0xff, (v >>> 8) & 0xff]
  const u32 = (v: number) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]

  for (const { path, data } of entries) {
    const name = enc.encode(path)
    const crc = crc32(data)
    // Local file header — bit 11 (0x800): tên file UTF-8.
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), // STORED
      ...u16(now.time), ...u16(now.date), ...u32(crc),
      ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0),
    ])
    parts.push(local, name, data)

    central.push(new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0),
      ...u16(now.time), ...u16(now.date), ...u32(crc),
      ...u32(data.length), ...u32(data.length), ...u16(name.length),
      ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset),
    ]), name)
    offset += local.length + name.length + data.length
  }

  const centralSize = central.reduce((s, p) => s + p.length, 0)
  const eocd = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0),
    ...u16(entries.length), ...u16(entries.length),
    ...u32(centralSize), ...u32(offset), ...u16(0),
  ])

  const total = offset + centralSize + eocd.length
  const out = new Uint8Array(total)
  let pos = 0
  for (const p of [...parts, ...central, eocd]) {
    out.set(p, pos)
    pos += p.length
  }
  return out
}

// ── SpreadsheetML ────────────────────────────────────────────────────────────

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

/** Chỉ số cột 0-based → tên cột A1 (0 → A, 26 → AA). */
function colName(i: number): string {
  let name = ''
  for (let n = i; n >= 0; n = Math.floor(n / 26) - 1)
    name = String.fromCharCode(65 + (n % 26)) + name
  return name
}

/** Excel giới hạn tên sheet 31 ký tự, cấm []:*?/\ */
function sanitizeSheetName(name: string): string {
  return name.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Sheet'
}

function sheetXml(sheet: XlsxSheet): string {
  const rows: string[] = []
  // Độ rộng cột auto theo nội dung dài nhất (cap 60 ký tự) cho dễ đọc.
  const widths: number[] = []
  sheet.rows.forEach((row, r) => {
    const cells: string[] = []
    // Dòng đầu = header (trừ khi tắt) → style index 1.
    const isHeader = r === 0 && sheet.headerRow !== false
    const sAttr = isHeader ? ' s="1"' : ''
    row.forEach((cell, c) => {
      if (cell === null || cell === undefined) return
      const ref = `${colName(c)}${r + 1}`
      const text = String(cell)
      widths[c] = Math.min(60, Math.max(widths[c] ?? 8, text.length + 2))
      if (typeof cell === 'number' && Number.isFinite(cell)) {
        cells.push(`<c r="${ref}"${sAttr}><v>${cell}</v></c>`)
      } else {
        cells.push(
          `<c r="${ref}"${sAttr} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(text)}</t></is></c>`,
        )
      }
    })
    rows.push(`<row r="${r + 1}">${cells.join('')}</row>`)
  })
  const cols = widths.length
    ? `<cols>${widths
        .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w ?? 10}" customWidth="1"/>`)
        .join('')}</cols>`
    : ''

  const withHeader = sheet.headerRow !== false && sheet.rows.length > 0
  const nCols = widths.length
  const lastRef = `${colName(Math.max(0, nCols - 1))}${sheet.rows.length}`
  // Freeze dòng header (cuộn vẫn thấy tiêu đề) — thứ tự OOXML: sheetViews trước cols.
  const sheetViews = withHeader
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : ''
  // AutoFilter = nút sort/lọc trên header. Đặt SAU sheetData theo chuẩn OOXML.
  const autoFilter = withHeader && nCols > 0 ? `<autoFilter ref="A1:${lastRef}"/>` : ''

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `${sheetViews}${cols}<sheetData>${rows.join('')}</sheetData>${autoFilter}</worksheet>`
  )
}

/** Dựng file .xlsx từ danh sách sheet. Trả Blob sẵn sàng để tải về. */
export function buildXlsx(sheets: XlsxSheet[]): Blob {
  const enc = new TextEncoder()
  const names = sheets.map((s) => sanitizeSheetName(s.name))

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"` +
    ` xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>` +
    names.map((n, i) => `<sheet name="${xmlEscape(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
    `</sheets></workbook>`

  const stylesRelId = `rId${sheets.length + 1}`
  const workbookRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    sheets.map((_, i) =>
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
    ).join('') +
    `<Relationship Id="${stylesRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    sheets.map((_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    ).join('') +
    `</Types>`

  const rootRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`

  const zip = buildZip([
    { path: '[Content_Types].xml', data: enc.encode(contentTypes) },
    { path: '_rels/.rels', data: enc.encode(rootRels) },
    { path: 'xl/workbook.xml', data: enc.encode(workbook) },
    { path: 'xl/_rels/workbook.xml.rels', data: enc.encode(workbookRels) },
    { path: 'xl/styles.xml', data: enc.encode(STYLES_XML) },
    ...sheets.map((s, i) => ({
      path: `xl/worksheets/sheet${i + 1}.xml`,
      data: enc.encode(sheetXml(s)),
    })),
  ])

  return new Blob([zip], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/** Tải Blob về máy với tên file cho trước (chỉ chạy trong browser). */
export function downloadBlob(blob: Blob, fileName: string): void {
  if (typeof document === 'undefined') {
    throw new Error('[Fleetwork SDK] downloadBlob chỉ dùng được trong browser.')
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
