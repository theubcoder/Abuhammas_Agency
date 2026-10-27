# Abu Hammas — Agency Dashboard

A modern [Next.js](https://nextjs.org) application with Supabase integration and secure Admin Authentication.

## Getting Started

```bash
cd abuhammas
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Login & Authentication Details

Aapka login system `.env.local` file ke sath configure hai:

File path: `abuhammas/.env.local`

```env
# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=abuhammas_raza_agency_secure_session_key_2026
```

### Password Kaise Change Karein?
1. `abuhammas/.env.local` open karein.
2. `ADMIN_PASSWORD` ki value apni marzi ka naya password rakh lein (e.g., `ADMIN_PASSWORD=myNewPass2026!`).
3. Save karein. Agar dev server chal raha ho to restart karein (`Ctrl + C` then `npm run dev`).
4. Naye password ke sath login karein!

### Security & Validations Included:
- **Client & Server-side Validation**: Blank inputs, minimum length, clear error alerts.
- **Shake Animation & Visual Feedback**: Ghalat input par visual shake animation.
- **Brute-Force & Rate Limiting**: 5 ghalat attempts par 60-second lockout live countdown ke sath.
- **Show / Hide Password Toggle**: Eye icon ke sath password toggle.
- **Tamper-Proof Sessions**: Cryptographically signed HMAC-SHA256 HTTP-only cookies.
- **Route Protection**: Unauthenticated users seedha `/login` par redirect hote hain.
- **One-Click Logout**: Dashboard header par Logout button shamil hai.
