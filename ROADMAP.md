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
