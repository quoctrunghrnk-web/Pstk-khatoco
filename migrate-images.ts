// migrate-images.ts — Di chuyển ảnh base64 cũ từ D1 lên R2
// Chạy: npx tsx migrate-images.ts
// Cần CLOUDFLARE_API_TOKEN trong env

const CF = {
  accountId: 'f641ac63a637677d82ad06513e459e4d',
  dbId: '8557d955-d458-4979-a515-41d1a47079d6',
  bucket: 'chamcong-photos',
}
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || ''
if (!TOKEN) { console.error('Cần CLOUDFLARE_API_TOKEN'); process.exit(1) }

const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }

async function d1(sql: string, params: unknown[] = []) {
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF.accountId}/d1/database/${CF.dbId}/query`,
    { method: 'POST', headers: H, body: JSON.stringify({ sql, params }) }
  )
  const j = await r.json() as any
  if (!j.success) throw new Error(JSON.stringify(j.errors))
  return j.result[0].results as any[]
}

function dec(b64: string): Uint8Array {
  const raw = b64.includes(',') ? b64.split(',')[1] : b64
  const bin = atob(raw)
  return new Uint8Array(bin.length).map((_, i) => bin.charCodeAt(i))
}

async function uploadR2(key: string, body: Uint8Array) {
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF.accountId}/r2/buckets/${CF.bucket}/objects/${key}`,
    { method: 'PUT', headers: { Authorization: `Bearer ${TOKEN}` }, body }
  )
  if (!r.ok) throw new Error(`R2 upload failed: ${r.status} ${await r.text()}`)
  return key
}

async function migrate() {
  // Lấy danh sách records có base64 nhưng chưa có R2 key
  const records = await d1(`
    SELECT id, checkin_image1, checkin_image2, checkout_image1, checkout_image2
    FROM checkins
    WHERE (checkin_image1 IS NOT NULL OR checkout_image1 IS NOT NULL)
    AND (checkin_image1_r2 IS NULL AND checkout_image1_r2 IS NULL)
    ORDER BY id
  `)
  console.log(`Tìm thấy ${records.length} records cần migrate`)

  let done = 0
  for (const r of records) {
    const imgs = [
      ['checkin_image1_r2', r.checkin_image1],
      ['checkin_image2_r2', r.checkin_image2],
      ['checkout_image1_r2', r.checkout_image1],
      ['checkout_image2_r2', r.checkout_image2],
    ].filter(([, b64]) => b64 && b64.startsWith('data:image/')) as [string, string][]

    if (imgs.length === 0) continue

    try {
      const upds: string[] = []
      const vals: unknown[] = []
      for (const [col, b64] of imgs) {
        const key = `migrated_${r.id}_${col}.jpg`
        const body = dec(b64)
        await uploadR2(key, body)
        upds.push(`${col} = ?`)
        vals.push(key)
      }
      upds.push('checkin_image1 = NULL, checkin_image2 = NULL, checkout_image1 = NULL, checkout_image2 = NULL')
      await d1(`UPDATE checkins SET ${upds.join(', ')} WHERE id = ?`, [...vals, r.id])

      done++
      if (done % 5 === 0) console.log(`  Đã migrate ${done}/${records.length}...`)
    } catch (e: any) {
      console.error(`  Lỗi record ${r.id}:`, e.message)
    }
  }
  console.log(`Hoàn tất! Đã migrate ${done} records.`)
}

migrate()