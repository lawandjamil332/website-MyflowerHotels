# Payment gateway integration — My Flower Hotels

**For the payment processor's integration engineer.**
Site: `https://myflowerhotels.com` · Contact: the hotel will put you in touch with whoever is maintaining the site.

The website side is already built. Nothing on this page is a request for you to
write code against us — it is a description of what we already do, so the call
can be about credentials and field names rather than about architecture.

---

## What we have implemented

The **hosted redirect** flow:

1. A guest presses **Pay** on their own booking.
2. Our server calls your API to open a payment, giving the amount, the currency
   and our booking reference as the order id.
3. You return a URL. We send the guest's browser to it.
4. The guest enters their card **on your page**. No card number ever reaches our
   server, our database or our logs, and there is nowhere in our code to put one.
5. You redirect the guest back to us, and separately your server calls our
   webhook.
6. **We record the payment from the webhook only.** The browser redirect is
   treated as navigation, never as evidence.

If you also offer a direct/server-to-server card API, we are declining it. The
hosted redirect keeps the hotel out of full PCI scope, which is the point.

---

## What we send you

`POST` to the URL you give us, `Content-Type: application/json`,
`Authorization: Bearer <the key you give us>`.

```json
{
  "amount": 250000,
  "currency": "IQD",
  "order_id": "MF-A1B2C3",
  "description": "My Flower Hotels — booking MF-A1B2C3",
  "customer_name": "Guest Name",
  "customer_email": "guest@example.com",
  "customer_phone": "+9647705146161",
  "language": "en",
  "redirect_url": "https://myflowerhotels.com/en/booking/paid?ref=MF-A1B2C3",
  "cancel_url":   "https://myflowerhotels.com/en/booking/paid?ref=MF-A1B2C3&problem=cancelled",
  "callback_url": "https://myflowerhotels.com/next/payments/webhook",
  "merchant_id": "<if you need one>"
}
```

**Tell us if any field name differs** and we will change it — they are in one
file and one place in that file.

- `order_id` is our booking reference. It is short, unique, printed on the
  guest's confirmation and visible in the hotel's admin panel, so it is the
  string to quote in any dispute. Please echo it back in the webhook.
- `language` is `en`, `ku` (Kurdish Sorani) or `ar`. Show the guest your payment
  page in that language if you can.

### Your reply

We need a redirect URL. We look for it at `redirect_url`, `redirectUrl`,
`checkout_url`, `payment_url`, `url`, `data.redirect_url`, `data.url` and a few
more. **If yours is somewhere else, just tell us the path** — it is a
configuration value, not a code change.

---

## What you send us

`POST https://myflowerhotels.com/next/payments/webhook`

```json
{
  "order_id": "MF-A1B2C3",
  "status": "paid",
  "transaction_id": "your-id-here",
  "amount": 250000,
  "currency": "IQD"
}
```

We reply `200` once we have accepted it, `401` if the signature fails.

### Signature — required

**We refuse every unsigned callback.** An unsigned "this booking is paid"
message is a free hotel room for anyone who learns the address, and that
address ends up in logs and support tickets.

What we implement today:

- `HMAC-SHA256` over the **exact raw request body**, hex encoded
- in the header `X-Signature` (a `sha256=` prefix is accepted and stripped)
- compared in constant time

**If yours differs in any way** — a different algorithm, base64 instead of hex,
a signature over a concatenation of fields rather than the body, a different
header name — tell us. The header name is already configurable; the rest is a
few lines in one function.

### Status words

Anything in this list, case-insensitive, counts as paid:

`paid, captured, success, successful, completed, approved, settled`

**Anything not on the list counts as not paid.** That is deliberate — an
unrecognised status must never give away a room. Send us your list and we will
use it.

### Retries

Please do retry on a non-2xx. We are safe against duplicates: the transaction id
is uniquely indexed and the update is conditional, so the same callback arriving
five times records one payment.

---

## The one question that can cost real money

**Do you want Iraqi dinars as whole units or as fils?**

- ISO 4217 says IQD has 3 decimal places, so 250,000 IQD would be `250000000`.
- Fils have not circulated in decades, and many processors here treat IQD as a
  whole-unit currency, wanting `250000`.

Both are defensible and only you know which you mean. **Until you answer, our
site refuses to start any dinar payment at all** and logs the reason. That
refusal is intentional: guessing high charges a guest a thousand times too much
on the first live transaction.

Please answer literally: *"send 250,000 IQD as `250000`"* or *"as `250000000`"*.

USD we will send in cents unless you say otherwise.

---

## What we would like from you

1. The API URL, and how to authenticate to it.
2. The API key / merchant id, for test and for live.
3. The webhook signing secret.
4. Your field names, if they differ from above.
5. Your "paid" status words.
6. **The dinar unit answer.**
7. A test/sandbox environment, and test card numbers.
8. Confirmation of which currencies the merchant account is settled in.

---

## Things worth knowing about this site

- Card payment is **optional and off by default**. The hotel's model is booking
  with no card and paying on arrival, and that stays true. When switched on,
  a guest is *offered* the chance to pay now; the room is confirmed either way.
- The hotel can ask for a **deposit** (a percentage) instead of the full stay.
- Three languages, two of them right-to-left. Your hosted page will be seen in
  all three.
- Guests are in Iraq and abroad, and cards will be both local and international.

---

## After go-live

We would like, in this order:

1. One real payment of a small amount, checked end to end: gateway dashboard,
   our admin panel, and the money actually settling.
2. One refund through your dashboard, to confirm what your webhook sends for it
   — we have a `refunded` state and have not yet seen your shape for it.
3. Then, and only then, the hotel decides whether to require payment at booking
   rather than offer it afterwards.
