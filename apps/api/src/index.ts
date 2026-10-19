import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { db } from './db'
import { accessRequests } from './db/schema'
import { sendMail } from './mail'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const app = new Hono()

app.use('/api/*', cors({ origin: '*' }))

app.get('/api/health', (c) => c.json({ ok: true }))

app.post('/api/access-requests', async (c) => {
  let body: { email?: unknown; intent?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_body' }, 400)
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!EMAIL_RE.test(email)) {
    return c.json({ error: 'invalid_email' }, 400)
  }
  const intent = typeof body.intent === 'string' ? body.intent.slice(0, 500) : null

  db.insert(accessRequests).values({ email, intent }).run()

  sendMail({
    to: email,
    subject: 'You are on the Tarima list',
    text: 'Thanks for requesting access to Tarima. We are letting organizers in small batches — you will hear from us soon.',
  }).catch((err) => console.error('[mail] send failed', err))

  return c.json({ ok: true }, 201)
})

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on :${info.port}`)
})
