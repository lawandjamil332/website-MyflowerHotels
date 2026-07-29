import net from 'node:net'

/**
 * Why a mail send failed, decided by measurement rather than by argument.
 *
 * A send failure alone cannot distinguish the two causes that matter, and they
 * have opposite fixes: either the host refuses to let mail traffic out at all,
 * in which case no credential or port will ever help, or the network is fine
 * and the fault is in this application. Reading the code cannot separate them
 * either — the only thing that can is opening a socket from the machine it
 * happened on and timing what comes back.
 *
 * So this runs on the first failure and prints its finding into the same log
 * line the failure is already in. The owner is already reading that log; making
 * them visit a diagnostic page instead is one more step between a problem and
 * its explanation.
 *
 * Runs once per process, then caches. A hotel with a bad afternoon should not
 * open three sockets per booking, and the answer cannot change without a
 * redeploy anyway.
 */

const PROBE_TIMEOUT_MS = 8_000

type Outcome = 'connected' | 'refused' | 'timed out' | `error: ${string}`

const probe = (
  host: string,
  port: number,
): Promise<{ label: string; outcome: Outcome; ms: number }> =>
  new Promise((resolve) => {
    const started = Date.now()
    const socket = new net.Socket()
    let settled = false

    const done = (outcome: Outcome) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve({ label: `${host}:${port}`, outcome, ms: Date.now() - started })
    }

    socket.setTimeout(PROBE_TIMEOUT_MS)
    socket.once('connect', () => done('connected'))
    socket.once('timeout', () => done('timed out'))
    socket.once('error', (err) => {
      const code = (err as NodeJS.ErrnoException).code ?? err.message
      done(code === 'ECONNREFUSED' ? 'refused' : (`error: ${code}` as Outcome))
    })
    socket.connect(port, host)
  })

let cached: Promise<string> | null = null

const run = async (): Promise<string> => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'

  // The configured mail port and Gmail's other one, against an HTTPS port on
  // the same infrastructure as a control. The control is what makes this
  // conclusive: a network that is merely down fails all three, while a network
  // that blocks mail specifically fails only the first two.
  const [mailA, mailB, https] = await Promise.all([
    probe(smtpHost, Number(process.env.SMTP_PORT || 587)),
    probe(smtpHost, 465),
    probe('oauth2.googleapis.com', 443),
  ])

  const table = [mailA, mailB, https]
    .map((r) => `      ${r.label.padEnd(28)} ${r.outcome} (${r.ms}ms)`)
    .join('\n')

  const mailReachable = mailA.outcome === 'connected' || mailB.outcome === 'connected'
  const httpsReachable = https.outcome === 'connected'

  let verdict: string
  if (mailReachable) {
    verdict =
      'The mail port IS reachable from this server, so the network is not the problem — ' +
      'this failure is credentials, TLS, or this application. That is ours to fix.'
  } else if (httpsReachable) {
    verdict =
      'This host does not permit outbound mail connections, but ordinary HTTPS works. ' +
      'No password, port or SMTP setting can change that — mail has to go over an API ' +
      'instead (set GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN / ' +
      'GMAIL_FROM_ADDRESS to send from the same Gmail account over HTTPS).'
  } else {
    verdict =
      'Nothing outbound is reachable at all, not even HTTPS. This is wider than mail — ' +
      'check whether this deployment has any outbound network access.'
  }

  return `\n    Network check, measured from this server:\n${table}\n    → ${verdict}`
}

export const diagnoseMailNetwork = (): Promise<string> => {
  if (!cached) {
    cached = run().catch(
      (err) => `\n    Network check could not be completed — ${String(err).slice(0, 200)}`,
    )
  }
  return cached
}
