# React Firebase Google SSO GitHub Pages Template

A modern React application template with Firebase Google SSO authentication, built with TypeScript, Vite, Tailwind CSS, and shadcn/ui, deployable to GitHub Pages.

## Features

- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Firebase Authentication** with Google SSO (client-side only)
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for beautiful, accessible components
- **React Router** for client-side routing
- **GitHub Actions** for automated deployment to GitHub Pages

## Tech Stack

- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Firebase](https://firebase.google.com/) - Authentication
- [React Router](https://reactrouter.com/) - Client-side routing

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- A Firebase project with Google Authentication enabled
- A GitHub repository for deployment

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/neozenith/template-react-firebase-github-pages-webapp.git
cd template-react-firebase-github-pages-webapp
```

### 2. Install dependencies

```bash
make install
```

Or manually:

```bash
npm --prefix frontend install
```

### 3. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication in Firebase Console → Authentication → Sign-in method
3. Register your web app in Firebase Console → Project Settings
4. Copy the Firebase configuration

### 4. Set up environment variables

Copy the example environment file:

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 5. Configure GitHub Pages

1. Go to your GitHub repository → Settings → Pages
2. Under "Build and deployment", select "GitHub Actions" as the source
3. Add the following secrets to your repository (Settings → Secrets and variables → Actions):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`

### 6. Update the base URL (if needed)

If your repository name is different, update the `base` in:
- `frontend/vite.config.ts` (line 7)
- `frontend/src/App.tsx` (line 9)

Replace `/template-react-firebase-github-pages-webapp/` with `/your-repo-name/`

## Development

Start the development server:

```bash
make dev
```

Or manually:

```bash
npm --prefix frontend run dev
```

The app will be available at `http://localhost:5173`

## Build

Build for production:

```bash
make build
```

Or manually:

```bash
npm --prefix frontend run build
```

Preview the production build:

```bash
make preview
```

## Deployment

The app automatically deploys to GitHub Pages when you push to the `main` branch. The deployment workflow is configured in `.github/workflows/deploy.yml`.

To manually trigger a deployment:

1. Go to your repository → Actions
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow"

## Project Structure

```
.
├── frontend/              # Frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── ui/       # shadcn/ui components
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/     # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── lib/          # Utilities
│   │   │   ├── firebase.ts
│   │   │   └── utils.ts
│   │   ├── pages/        # Page components
│   │   │   ├── LoginPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   ├── package.json
│   └── vite.config.ts
├── .github/
│   └── workflows/
│       └── deploy.yml    # GitHub Actions deployment
├── Makefile              # Project commands
├── CLAUDE.md             # Project memory
└── README.md
```

## Available Commands

- `make install` - Install all dependencies
- `make dev` - Start development server
- `make build` - Build for production
- `make preview` - Preview production build
- `make clean` - Clean build artifacts and dependencies
- `make test` - Run tests (not yet implemented)

## Firebase Configuration

### Authorized Domains

Make sure to add your GitHub Pages domain to Firebase:

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add `your-username.github.io`

### OAuth Redirect URIs

The OAuth redirect will be handled by Firebase automatically once you add the authorized domain.

## Resources

### Prior Art Repositories

- [IgorBayerl/react-vite-tailwind-typescript-firebase-auth-template](https://github.com/IgorBayerl/react-vite-tailwind-typescript-firebase-auth-template)
- [Homvi/vite-react-firebase-google-auth](https://github.com/Homvi/vite-react-firebase-google-auth)
- [TeXmeijin/vite-react-ts-tailwind-firebase-starter](https://github.com/TeXmeijin/vite-react-ts-tailwind-firebase-starter)

### Official Documentation

- [Firebase Authentication Web Guide](https://firebase.google.com/docs/auth/web/start)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
