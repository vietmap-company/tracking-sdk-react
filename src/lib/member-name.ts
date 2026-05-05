/**
 * Extract a display name from a metadata blob using `nameKey`.
 *
 * Backend rows ship metadata as either a `Record<string, unknown>` or a
 * JSON-stringified blob. This helper handles both shapes and falls back to
 * `fallback` (or `undefined`) when the key is missing or empty.
 */
export function resolveMemberName(
  metaData: unknown,
  nameKey: string | undefined,
  fallback?: string,
): string | undefined {
  if (!nameKey) return fallback

  let obj: Record<string, unknown> | null = null
  if (metaData && typeof metaData === 'object' && !Array.isArray(metaData)) {
    obj = metaData as Record<string, unknown>
  } else if (typeof metaData === 'string' && metaData.length > 0) {
    try {
      const parsed = JSON.parse(metaData)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        obj = parsed as Record<string, unknown>
      }
    } catch {
      // Not JSON — leave obj null and fall through to fallback.
    }
  }

  if (!obj) return fallback
  const v = obj[nameKey]
  if (typeof v === 'string' && v.length > 0) return v
  if (typeof v === 'number') return String(v)
  return fallback
}
