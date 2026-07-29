import dns from 'node:dns'

/**
 * Stops the mail library from ever trying to reach the SMTP host over IPv6.
 *
 * nodemailer resolves both the A and AAAA records for the mail server and then
 * connects to one address picked at random from the combined list. Whether
 * IPv6 is even offered depends on nodemailer seeing an IPv6-capable network
 * interface on the machine it is running on — which Railway's containers have,
 * even though the container cannot actually route that traffic out to the
 * internet. So roughly half of every attempt reached for an address that was
 * never going anywhere, and failed with ECONNREFUSED/ENETUNREACH — while the
 * other half, picking the IPv4 address, worked. A guest's booking succeeding
 * or its confirmation email arriving looked like unrelated coin flips, because
 * they were: two different random choices made a few lines apart.
 *
 * There is no transport option in nodemailer to turn this off — it decides
 * from the machine's own interfaces, not from anything the caller can pass in.
 * So it is disabled at the source instead: nodemailer asks a `dns.Resolver` for
 * the AAAA records, and this makes that ask always come back empty, which is
 * exactly what nodemailer already does on its own when it believes IPv6 is
 * unsupported — this just stops it guessing wrong about a container's network.
 *
 * Narrow on purpose. This touches `dns.Resolver#resolve6` only, which nothing
 * else in this codebase calls — Postgres and ordinary HTTP requests resolve
 * hostnames through `dns.lookup`, a completely separate mechanism in Node, and
 * are untouched by this.
 */
export const forceIPv4Smtp = (): void => {
  if (!dns.Resolver) return
  dns.Resolver.prototype.resolve6 = ((...args: unknown[]) => {
    const callback = args[args.length - 1]
    if (typeof callback === 'function') callback(null, [])
  }) as typeof dns.Resolver.prototype.resolve6
}
