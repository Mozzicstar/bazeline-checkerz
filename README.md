# bazeline-checkerz
i pray it works, and you will like it

# Baseline Checker

A VS Code extension that checks your CSS and HTML for non-baseline web features and suggests compatible fallbacks.

## Features

- **Real-time detection** of non-baseline CSS features
- **Inline warnings** with squiggly underlines
- **Hover tooltips** showing browser compatibility and fallbacks
- **Instant suggestions** with copy-to-clipboard functionality

## Supported Features (MVP)

- `:has()` CSS pseudo-class
- `backdrop-filter` CSS property

## Installation

1. Clone this repository
2. Run `npm install`
3. Press F5 to open Extension Development Host
4. Open a CSS or HTML file

## Usage

### Automatic Checking
The extension automatically scans CSS and HTML files as you type.

### Manual Commands
- **Baseline: Check Current File** - Manually scan the current file
- **Baseline: Suggest Fallback** - Get fallback code for a detected issue (place cursor on warning)

### Hover for Details
Hover over any warning to see:
- Feature name and baseline year
- Browser compatibility info
- Ready-to-use fallback code

## Example

```css
/* This will trigger a warning */
.card:has(.title) {
  background: red;
}

/* This will also trigger a warning */
.modal {
  backdrop-filter: blur(10px);
}
```

## Building VSIX

```bash
npm install -g @vscode/vsce
vsce package
```

## Project Structure

```
src/
├── extension.ts    # Main activation & commands
├── scanner.ts      # Feature detection logic
└── fallbacks.ts    # Fallback database
```

## Settings

- `baselineChecker.enableOnOpen` - Enable automatic scanning (default: true)

## License

MIT
