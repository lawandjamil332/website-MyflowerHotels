import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { resendAdapter } from '@payloadcms/email-resend'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Bookings } from './collections/Bookings'
import { Guests } from './collections/Guests'
import { PointEntries } from './collections/PointEntries'
import { Branches } from './collections/Branches'
import { Categories } from './collections/Categories'
import { Enquiries } from './collections/Enquiries'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Reviews } from './collections/Reviews'
import { Rooms } from './collections/Rooms'
import { Offers } from './collections/Offers'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Settings } from './globals/Settings/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { forceIPv4Smtp } from './utilities/forceIPv4Smtp'
import { gmailApiAdapter } from './utilities/gmailApiAdapter'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Mail, only if it has somewhere to send.
 *
 * Enquiries are announced by email, and with no transport configured Payload
 * writes them to the console instead — which is the correct fallback and is
 * exactly what this site did before. So an adapter is attached only when it has
 * what it needs to work: half-configured mail that throws on every enquiry
 * would be worse than no mail at all.
 *
 * Direct SMTP to Gmail from a Railway container hits a connection the
 * platform simply will not open — proven by testing both the ordinary
 * submission port and the implicit-TLS one and getting the identical timeout
 * on each, which is a network policy on Railway's side, not anything wrong
 * with the Gmail account or anything a setting here can route around.
 *
 * Two ways around that, tried in this order:
 *
 *  1. The Gmail API — the same Gmail account, sent over an ordinary HTTPS
 *     request instead of the connection Railway blocks. Chosen first because
 *     it keeps the owner's own inbox as the one place bookings are sent from
 *     and read from, with nothing else in between.
 *  2. Resend, if the owner would rather use a service built for sending mail
 *     than wire up their own Gmail account for it.
 *
 * SMTP is kept as a last-resort fallback rather than deleted, for a deploy
 * that runs somewhere SMTP is not blocked — Railway is not the only place
 * this runs during development, and the code should not assume it always
 * will be.
 */
const gmailClientId = process.env.GMAIL_CLIENT_ID
const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET
const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN
const gmailFromAddress = process.env.GMAIL_FROM_ADDRESS

const resendKey = process.env.RESEND_API_KEY
const smtpHost = process.env.SMTP_HOST
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS

const usingGmailApi = Boolean(
  gmailClientId && gmailClientSecret && gmailRefreshToken && gmailFromAddress,
)

if (!usingGmailApi && !resendKey && smtpHost && smtpUser && smtpPass) forceIPv4Smtp()

const email = usingGmailApi
  ? gmailApiAdapter({
      clientId: gmailClientId!,
      clientSecret: gmailClientSecret!,
      refreshToken: gmailRefreshToken!,
      defaultFromAddress: gmailFromAddress!,
      defaultFromName: process.env.SMTP_FROM_NAME || 'My Flower Hotels',
    })
  : resendKey
    ? resendAdapter({
        apiKey: resendKey,
        defaultFromName: process.env.SMTP_FROM_NAME || 'My Flower Hotels',
        // Resend requires the from-address's domain to be verified with them —
        // an address at a Gmail domain will be rejected outright, which is the
        // one setting here worth getting wrong loudly rather than silently.
        defaultFromAddress:
          process.env.SMTP_FROM || `bookings@${new URL(getServerSideURL()).hostname}`,
      })
    : smtpHost && smtpUser && smtpPass
      ? nodemailerAdapter({
          // Do not dial the mail server while booting. `npm run start` is
          // check-env && migrate && next start, so a verification handshake
          // against a slow or unreachable SMTP host does not fail the deploy —
          // it hangs it, before the site has served a single page. Mail is worth
          // nothing next to the site being up, and a send that fails is already
          // caught and logged with the enquiry attached.
          skipVerify: true,
          defaultFromName: process.env.SMTP_FROM_NAME || 'My Flower Hotels',
          defaultFromAddress: process.env.SMTP_FROM || smtpUser,
          transportOptions: {
            host: smtpHost,
            port: Number(process.env.SMTP_PORT || 587),
            // 465 is implicit TLS; everything else upgrades with STARTTLS.
            secure: Number(process.env.SMTP_PORT || 587) === 465,
            auth: { user: smtpUser, pass: smtpPass },
          },
        })
      : undefined

export default buildConfig({
  ...(email ? { email } : {}),
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    // Railway hands out DATABASE_URL; the project brief calls it DATABASE_URI.
    // Accept either so neither name is a silent misconfiguration.
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
    },
  }),
  // Three scripts, configured before any page is built. Retrofitting locales
  // later means rebuilding, so every localized field keys off this list.
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'کوردی', code: 'ku', rtl: true },
      { label: 'العربية', code: 'ar', rtl: true },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  collections: [
    Bookings,
    Guests,
    PointEntries,
    Reviews,
    Branches,
    Rooms,
    Offers,
    Enquiries,
    Pages,
    Posts,
    Media,
    Categories,
    Users,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Settings, Header, Footer],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
