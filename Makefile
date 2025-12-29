.PHONY: help install dev build preview clean test

help:
	@echo "Available commands:"
	@echo "  make install  - Install all dependencies"
	@echo "  make dev      - Start development server"
	@echo "  make build    - Build for production"
	@echo "  make preview  - Preview production build"
	@echo "  make clean    - Clean build artifacts and dependencies"
	@echo "  make test     - Run tests"

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

test:
	@echo "No tests configured yet"
