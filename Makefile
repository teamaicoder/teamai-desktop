.PHONY: deps setup build install default-markdown icon open run clean test dev

APP := dist/mac-arm64/TeamAICoder.app

# Install npm dependencies
deps:
	npm install

# Copy vendor assets into renderer/vendor/
setup:
	npm run setup

# Build the macOS .app bundle into dist/mac/
build: setup
	npm run dist

# Build and copy the app into /Applications (signed when a Developer ID certificate is in the keychain)
install: build
	rm -rf /Applications/TeamAICoder.app
	ditto "$(APP)" /Applications/TeamAICoder.app
	@echo "Installed /Applications/TeamAICoder.app"

# Make TeamAICoder the default app for Markdown files (run after install)
default-markdown:
	/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f /Applications/TeamAICoder.app
	swift scripts/set-default-markdown.swift

# Rebuild the app icon (build/icon.icns, build/icon.png) from build/icon.svg
icon:
	./scripts/make-icon.sh

# Open the built app
open:
	open "$(APP)"

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
