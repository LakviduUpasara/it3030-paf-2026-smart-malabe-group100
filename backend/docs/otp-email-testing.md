# Email OTP (2FA) — configuration and Postman testing

## Root causes that prevented Gmail OTP delivery (fixed in code)

1. **`JavaMailSender` missing** — Spring only creates this bean when `spring.mail.host` is set (e.g. `SPRING_MAIL_HOST` in `.env`). The old notifier used `ObjectProvider.ifAvailable(...)` and **did nothing** when the bean was absent, while the login flow still returned a 2FA challenge.
2. **Failures were silent** — No exception when SMTP was not configured; OTP was only logged at INFO.
3. **Gmail “From” address** — Using `noreply@smartcampus.local` as From often fails with Gmail. The app now falls back to `spring.mail.username` when the configured From is a placeholder.
4. **`APP_DEVELOPER_MODE=true`** — Skips all outbound OTP email (and skips 2FA verification). The `dev` profile sets this by default.
5. **Typo / wrong env names** — e.g. `PRING_MAIL_PASSWORD` instead of `SPRING_MAIL_PASSWORD` prevents Spring from binding the password.

## Gmail account settings

1. Enable **2-Step Verification** on the Google account.
2. Open **Google Account → Security → App passwords** (or search “App passwords”).
3. Create an app password for **Mail** / **Other** and use that 16-character value as `SPRING_MAIL_PASSWORD` (not your normal Gmail password).
4. Use the **same** mailbox for `SPRING_MAIL_USERNAME` and typically for the From address (or a **verified** Send mail as alias).

## Sample Spring Boot properties (Gmail)

Set via environment (recommended) or `backend/.env` (loaded by `AppApplication`):

```properties
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=you@gmail.com
SPRING_MAIL_PASSWORD=xxxx xxxx xxxx xxxx
APP_DEVELOPER_MODE=false
APP_NOTIFICATIONS_EMAIL_ENABLED=true
```

Optional explicit From (otherwise the app uses `spring.mail.username`):

```properties
APP_NOTIFICATIONS_EMAIL_FROM=you@gmail.com
```

`application.properties` already enables SMTP auth and STARTTLS on port 587.

## Sample OTP email body

The sign-in OTP email is plain text, for example:

```
Your Smart Campus verification code is: 123456

This code expires in a few minutes. If you did not try to sign in, you can ignore this message.
```

## Postman — send OTP (login step)

There is **no** dedicated “send OTP only” endpoint. The OTP is sent when password login requires 2FA.

1. **POST** `http://127.0.0.1:18081/api/v1/auth/login`  
   Headers: `Content-Type: application/json`  
   Body (raw JSON):

```json
{
  "email": "your.user@example.com",
  "password": "yourPassword"
}
```

2. If the account uses email OTP and developer mode is **off**, the response has `authStatus`: `TWO_FACTOR_REQUIRED` and `twoFactorChallenge.challengeId`. Check the inbox for the code. The UI never shows the OTP. For API-only debugging without SMTP, set `APP_AUTH_DEV_EXPOSE_OTP=true` (not for production).

## Postman — resend email OTP

1. **POST** `http://127.0.0.1:18081/api/v1/auth/resend-email-otp`  
   Body: `{ "challengeId": "<id from login response>" }`  
2. Rate-limited by `APP_AUTH_OTP_RESEND_COOLDOWN_SECONDS` (default 60). Returns **429** if called too soon.

## Postman — verify OTP

1. **POST** `http://127.0.0.1:18081/api/v1/auth/verify-2fa`  
   Headers: `Content-Type: application/json`  
   Body:

```json
{
  "challengeId": "<challengeId from login response>",
  "code": "123456"
}
```

2. On success, response has `authStatus`: `AUTHENTICATED` and a `token` for `Authorization: Bearer ...`.

## Expected errors when mail is misconfigured

- **503** with message about email not configured or SMTP failure — check host, App Password, and that `APP_DEVELOPER_MODE=false`.

## Files touched for this flow

- `AuthEmailOtpNotifier` — requires `JavaMailSender`, throws on missing SMTP or send failure; resolves From for Gmail.
- `AuthServiceImpl.buildTwoFactorChallenge` — saves OTP, sends email, deletes challenge if send fails.
- `application.properties` — shared SMTP client settings (STARTTLS, timeouts).
- `GlobalExceptionHandler` — logs 5xx `ApiException` causes; handles `MailException`.
- `ApiException` — optional cause for chained exceptions.
