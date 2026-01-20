# Project Roadmap

## Current State (v0.1.0 - MVP)

A fully functional React + Firebase Google SSO template deployed to GitHub Pages.

### Completed Features

| Component | Status | Description |
|-----------|--------|-------------|
| React + TypeScript + Vite | ✅ | Modern frontend stack with fast HMR |
| Tailwind CSS + shadcn/ui | ✅ | Clean, accessible UI components |
| Firebase Auth | ✅ | Google SSO with popup flow and session persistence |
| AuthContext | ✅ | React context for auth state management |
| Protected Routes | ✅ | Route guards redirecting unauthenticated users |
| Login Page | ✅ | Google sign-in with shadcn Card components |
| Dashboard Page | ✅ | User profile display (photo, name, email, UID) |
| GitHub Actions CI/CD | ✅ | Auto-deploys to GitHub Pages on push to `main` |
| Makefile | ✅ | Central command interface |
| Documentation | ✅ | README with full setup instructions |

### Architecture

```
frontend/src/
├── components/
│   ├── ui/              # shadcn/ui components (Button, Card)
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx  # Auth state management
├── lib/
│   ├── firebase.ts      # Firebase initialization
│   └── utils.ts         # Utility functions (cn)
├── pages/
│   ├── LoginPage.tsx    # Public login page
│   └── DashboardPage.tsx # Protected dashboard
├── App.tsx              # Router configuration
└── main.tsx             # Entry point
```

---

## Completed (v0.2.0)

### Developer Experience (DX) Improvements

- [x] **Vitest + React Testing Library** - Unit test infrastructure with sample tests
- [x] **ESLint + Prettier** - Code quality and formatting with auto-fix
- [x] **Strict TypeScript** - `strictTypeChecked` ESLint preset enabled
- [x] **`make test`** - Run unit tests (`make test-watch` for watch mode)
- [x] **`make check`** - Autoformat, lint, and type-check in one command

---

## Completed (v0.3.0) - Playwright E2E Testing with SSO

### Goal
Set up Playwright for E2E testing using real Google SSO with manual auth state capture.

**Spec:** [`specs/playwright-sso-testing.md`](specs/playwright-sso-testing.md)

### Implementation Notes

Google blocks automated browsers from OAuth sign-in ("This browser or app may not be secure"). Solution: use real Chrome with CDP (Chrome DevTools Protocol) to capture auth state, then inject it into Playwright tests.

### Tasks

- [x] **Install and configure Playwright** - Test runner, browser config, tsconfig.e2e.json
- [x] **Auth capture via CDP** - `make e2e-chrome` + `make e2e-capture` workflow
- [x] **Test fixtures** - Auto-inject Firebase auth via `addInitScript()`, unauthenticated test support
- [x] **E2E test suite** - 9 tests covering auth flows and navigation
- [x] **Makefile targets** - `make e2e`, `make e2e-chrome`, `make e2e-capture`, `make e2e-ui`, etc.

---

## Next Up (v0.4.0) - G Suite API Access

### Goal
Extend Google OAuth to request Sheets and Calendar permissions, enabling the app to access user's G Suite data.

**Spec:** [`specs/gsuite-access.md`](specs/gsuite-access.md)

**Depends on:** v0.3.0 (Playwright E2E testing)

### Tasks

- [ ] **Extend GoogleAuthProvider with G Suite scopes** - Request Sheets and Calendar permissions
- [ ] **Token management library** - Store/refresh OAuth access tokens (`lib/google-api.ts`)
- [ ] **Scope validation utilities** - Check granted vs requested scopes
- [ ] **Unit tests for token logic** - Full coverage of non-UI code
- [ ] **E2E tests for scope consent** - Verify scope request flow

---

## Future Enhancements

### High Priority

- [ ] **404.html for SPA routing** - GitHub Pages client-side routing fix
- [ ] **Loading spinner** - Visual feedback during auth state check
- [ ] **Error boundary** - Graceful error handling

### Medium Priority

- [ ] **Dark mode toggle** - Theme switching (Tailwind `dark:` classes ready)
- [ ] **Logout confirmation** - Prevent accidental sign-outs
- [ ] **Auth error handling** - User-friendly error messages

### Low Priority (Template Enhancements)

- [ ] **Firestore integration example** - Data persistence pattern
- [ ] **Navigation component** - Header/sidebar example
- [ ] **Profile settings page** - User preference management

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | 2025-12-29 | Initial MVP - Working Google SSO |
| 0.2.0 | 2026-01-18 | DX improvements - Vitest, ESLint/Prettier, strict TypeScript |
| 0.3.0 | 2026-01-20 | Playwright E2E testing with real Google SSO via CDP auth capture |
