import net from 'node:net'
import dns from 'node:dns'
import os from 'node:os'

import type { PayloadRequest } from 'payload'
import { getPayload } from 'payload'
import { NextRequest } from 'next/server'

import configPromise from '@payload-config'

/**
 * Measures, from inside the running deployment, what this server can and
 * cannot reach — so a mail failure is diagnosed from the machine it happens
 * on rather than inferred from a developer's laptop.
 *
 * Written because two SMTP ports timed out in production with nothing to
 * distinguish "the host blocks this" from "something in our code is wrong".
 * Those two have completely different fixes and no amount of reading the code
 * separates them: the only thing that does is a raw socket, opened from the
 * same container, with a stopwatch on it.
 *
 * How to read the result:
 *
 *  - refused almost instantly (ECONNREFUSED)  something is listening and said
 *    no; the port is reachable and the problem is above the network layer.
 *  - times out after seconds with nothing    packets are being dropped in
 *    silence, which is what a blocking firewall does and what a mail server
 *    never does.
 *  - connects                                the network is fine and the fault
 *    is ours — credentials, TLS, or the library.
 *
 * Staff-only. It reveals nothing secret, but it does open outbound sockets on
 * request, and an endpoint that does that should not be anonymous.
 */

const TIMEOUT_MS = 12_000

type Probe = {
  target: string
  outcome: 'connected' | 'refused' | 'timed out' | 'error'
  ms: number
  detail?: string
}

/** One TCP connection attempt, with the clock running and no data sent. */
const probe = (host: string, port: number): Promise<Probe> =>
  new Promise((resolve) => {
    const started = Date.now()
    const target = `${host}:${port}`
    const socket = new net.Socket()
    let settled = false

    const finish = (outcome: Probe['outcome'], detail?: string) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve({ target, outcome, ms: Date.now() - started, detail })
    }

    socket.setTimeout(TIMEOUT_MS)
    socket.once('connect', () => finish('connected'))
    socket.once('timeout', () => finish('timed out', `no response in ${TIMEOUT_MS}ms`))
    socket.once('error', (err) => {
      const code = (err as NodeJS.ErrnoException).code
      finish(code === 'ECONNREFUSED' ? 'refused' : 'error', code || err.message)
    })

    socket.connect(port, host)
  })

const resolveBoth = async (host: string) => {
  const lookup = (family: 4 | 6) =>
    new Promise<string[]>((resolve) => {
      const fn = family === 4 ? dns.resolve4 : dns.resolve6
      fn(host, (_err, addresses) => resolve(addresses ?? []))
    })
  return { ipv4: await lookup(4), ipv6: await lookup(6) }
}

export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config: configPromise })

  let user
  try {
    const auth = await payload.auth({
      req: req as unknown as PayloadRequest,
      headers: req.headers,
    })
    user = auth.user
  } catch {
    user = null
  }

  // Staff only, and specifically not guests: a guest session is not an
  // operator of this server.
  if (!user || user.collection !== 'users') {
    return new Response('Sign in to the admin panel first, then reload this page.', {
      status: 403,
    })
  }

  const dnsResult = await resolveBoth('smtp.gmail.com')

  // Gmail's three SMTP ports, plus the HTTPS port on the same infrastructure.
  // The last one is the control: if 443 connects and 587 does not, the network
  // is selectively blocking mail rather than being broken or offline.
  const probes = await Promise.all([
    probe('smtp.gmail.com', 587),
    probe('smtp.gmail.com', 465),
    probe('smtp.gmail.com', 25),
    probe('gmail.googleapis.com', 443),
    probe('oauth2.googleapis.com', 443),
  ])

  const interfaces = Object.entries(os.networkInterfaces()).flatMap(([name, addrs]) =>
    (addrs ?? []).map((a) => `${name} ${a.family} ${a.internal ? '(internal)' : ''}`.trim()),
  )

  const smtpBlocked = probes
    .filter((p) => p.target.startsWith('smtp.gmail.com'))
    .every((p) => p.outcome !== 'connected')
  const httpsWorks = probes.some((p) => p.target.endsWith(':443') && p.outcome === 'connected')

  return Response.json(
    {
      verdict: smtpBlocked
        ? httpsWorks
          ? 'SMTP is blocked outbound; HTTPS works. Mail must go over an API, not SMTP.'
          : 'Nothing outbound is reachable — this is broader than mail.'
        : 'SMTP is reachable. A mail failure here is not the network.',
      probes,
      dns: dnsResult,
      networkInterfaces: interfaces,
      mailConfig: {
        adapter: payload.email?.name ?? 'none',
        gmailApiConfigured: Boolean(
          process.env.GMAIL_CLIENT_ID &&
          process.env.GMAIL_CLIENT_SECRET &&
          process.env.GMAIL_REFRESH_TOKEN &&
          process.env.GMAIL_FROM_ADDRESS,
        ),
        smtpHostSet: Boolean(process.env.SMTP_HOST),
        smtpPort: process.env.SMTP_PORT ?? '(unset, defaults to 587)',
        resendKeySet: Boolean(process.env.RESEND_API_KEY),
      },
      node: process.version,
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}
