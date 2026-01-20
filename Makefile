.PHONY: help install dev build preview clean test test-watch test-coverage check format lint typecheck e2e e2e-auth e2e-chrome e2e-capture e2e-ui e2e-headed e2e-debug ci

help:
	@echo "Available commands:"
	@echo "  make install       - Install all dependencies"
	@echo "  make dev           - Start development server"
	@echo "  make build         - Build for production"
	@echo "  make preview       - Preview production build"
	@echo "  make clean         - Clean build artifacts and dependencies"
	@echo "  make test          - Run tests once"
	@echo "  make test-watch    - Run tests in watch mode"
	@echo "  make test-coverage - Run tests with coverage report"
	@echo "  make check         - Run all checks (format, lint, typecheck)"
	@echo "  make format        - Auto-format code with Prettier"
	@echo "  make lint          - Lint and fix code with ESLint"
	@echo "  make typecheck     - Run TypeScript type checking"
	@echo ""
	@echo "E2E Testing (Playwright):"
	@echo "  make e2e           - Run all E2E tests"
	@echo "  make e2e-ui        - Run with Playwright UI"
	@echo "  make e2e-headed    - Run with visible browser"
	@echo "  make e2e-debug     - Run in debug mode"
	@echo ""
	@echo "E2E Auth Capture (for Google OAuth):"
	@echo "  make e2e-chrome    - Launch real Chrome for manual auth"
	@echo "  make e2e-capture   - Capture auth state from Chrome"
	@echo "  make e2e-auth      - Try Playwright auth (may be blocked by Google)"

install:
	npm --prefix frontend install

dev:
	npm --prefix frontend run dev

build:
	npm --prefix frontend run build

preview:
	npm --prefix frontend run preview

clean:
	rm -rf frontend/node_modules
	rm -rf frontend/dist
	rm -rf frontend/coverage

test:
	npm --prefix frontend run test

test-watch:
	npm --prefix frontend run test:watch

test-coverage:
	npm --prefix frontend run test:coverage

check:
	npm --prefix frontend run check

format:
	npm --prefix frontend run format

lint:
	npm --prefix frontend run lint

typecheck:
	npm --prefix frontend run typecheck

ci: format check lint test-coverage

e2e:
	npm --prefix frontend run e2e

e2e-chrome:
	@echo "Launching real Chrome with remote debugging..."
	@echo "1. Sign in with Google in Chrome"
	@echo "2. Navigate to http://localhost:5173 and verify /dashboard"
	@echo "3. Run 'make e2e-capture' in another terminal"
	@echo ""
	@if [ "$$(uname)" = "Darwin" ]; then \
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
			--remote-debugging-port=9222 \
			--user-data-dir=/tmp/playwright-chrome-profile \
			"http://localhost:5173"; \
	else \
		google-chrome \
			--remote-debugging-port=9222 \
			--user-data-dir=/tmp/playwright-chrome-profile \
			"http://localhost:5173"; \
	fi

e2e-capture:
	@echo "Capturing auth state from Chrome..."
	npm --prefix frontend run e2e:capture

e2e-auth:
	@echo "Opening Playwright browser for manual Google sign-in..."
	@echo "(Note: Google may block this - use 'make e2e-chrome' + 'make e2e-capture' instead)"
	npm --prefix frontend run e2e:auth

e2e-ui:
	npm --prefix frontend run e2e:ui

e2e-headed:
	npm --prefix frontend run e2e:headed

e2e-debug:
	npm --prefix frontend run e2e:debug
