// R2 image storage — upload / download / delete
// Replaces base64-in-D1 pattern to avoid Memory limit exceeded errors

function dec(b64: string): Uint8Array {
  const raw = b64.includes(',') ? b64.split(',')[1] : b64
  const len = Math.ceil(raw.length / 4) * 3
  const bytes = new Uint8Array(len)
  let p = 0
  for (let i = 0; i < raw.length; i += 4) {
    const a = dec64(raw.charCodeAt(i)), b = dec64(raw.charCodeAt(i + 1))
    const c = dec64(raw.charCodeAt(i + 2)), d = dec64(raw.charCodeAt(i + 3))
    bytes[p++] = (a << 2) | (b >> 4)
    if (c !== 64) bytes[p++] = ((b & 15) << 4) | (c >> 2)
    if (d !== 64) bytes[p++] = ((c & 3) << 6) | d
  }
  return bytes.slice(0, p)
}
function dec64(c: number): number {
  if (c >= 65 && c <= 90) return c - 65          // A-Z
  if (c >= 97 && c <= 122) return c - 71          // a-z
  if (c >= 48 && c <= 57) return c + 4            // 0-9
  return c === 43 ? 62 : c === 47 ? 63 : 64       // + /
}

function uuid(): string {
  return crypto.randomUUID()
}

export function r2Key(prefix: string): string {
  return `${prefix}_${uuid()}.jpg`
}

/** Upload base64 data URL to R2. Returns the stored key. */
export async function uploadImage(bucket: R2Bucket, key: string, base64: string): Promise<string> {
  const body = dec(base64)
  await bucket.put(key, body, { httpMetadata: { contentType: 'image/jpeg' } })
  return key
}

/** Delete an image from R2 by key (no-op if key is empty or object missing). */
export async function deleteImage(bucket: R2Bucket, key: string | null | undefined): Promise<void> {
  if (!key) return
  try { await bucket.delete(key) } catch { /* ignore */ }
}

/** Fetch an image from R2 as a Response (for serving). */
export async function getImage(bucket: R2Bucket, key: string): Promise<Response> {
  const obj = await bucket.get(key)
  if (!obj) return new Response('Not Found', { status: 404 })
  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

/** Fetch an image and re-encode as base64 data URL (for PDF embedding). */
export async function getImageAsBase64(bucket: R2Bucket, key: string): Promise<string | null> {
  const obj = await bucket.get(key)
  if (!obj) return null
  const buf = await obj.arrayBuffer()
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
  return `data:${obj.httpMetadata?.contentType ?? 'image/jpeg'};base64,${b64}`
}
