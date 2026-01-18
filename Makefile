.PHONY: help install dev build preview clean test test-watch test-coverage check format lint typecheck

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
