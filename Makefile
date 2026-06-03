.PHONY: setup install build open clean test dev

# Install npm dependencies
install:
	npm install

# Copy vendor assets into renderer/vendor/
setup:
	npm run setup

# Build the macOS .app bundle into dist/mac/
build: setup
	npm run dist

# Open the built app
open:
	open "dist/mac-arm64/TeamAICoder.app"

# Build then open
run: build open

# Remove build artifacts
clean:
	rm -rf dist

# Run tests
test:
	npm test

# Start in dev mode (hot reload)
dev:
	npm run dev
