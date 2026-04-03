# Manikant Engineering Hub

[![CI](https://github.com/Adservx/no/actions/workflows/ci.yml/badge.svg)](https://github.com/Adservx/no/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A comprehensive web platform for Sub-Electrical Engineers featuring a social community, PDF library, and study materials management system.

## ✨ Features

- 🤝 **Social Community** - Share posts, photos, videos, and study materials
- 📚 **PDF Library** - Organized by semester with batch download
- 🎨 **Modern UI** - Instagram-inspired design with dark mode
- 🔒 **Secure** - XSS protection, rate limiting, and authentication
- 📱 **PWA** - Offline capabilities and mobile-friendly

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp config/.env.example .env

# Start development
npm run dev
```

Visit `http://localhost:3000`

## 📋 Requirements

- Node.js v18+
- Supabase account
- Cloudflare R2 (optional)

## 🛠️ Tech Stack

- React 18 + TypeScript
- Vite + Vitest
- Supabase + Cloudflare R2
- PDF.js + jsPDF

## 📁 Structure

```
├── api/          # Serverless functions
├── config/       # All configuration files
├── docs/         # Documentation
├── public/       # Static assets
├── scripts/      # Utility scripts
├── src/          # Source code
│   ├── components/  # React components (organized by feature)
│   ├── pages/       # Page components
│   ├── api/         # API services
│   ├── utils/       # Utilities
│   └── types/       # TypeScript types
└── tests/        # Test files
```

## 🧪 Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run tests
npm run lint         # Check code quality
npm run lint:fix     # Auto-fix issues
```

## 📖 Documentation

- [Setup Guide](./docs/SETUP.md)
- [API Reference](./docs/API.md)
- [Architecture](./docs/ARCHITECTURE.md)

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 👤 Author

**Adservx** - [GitHub](https://github.com/Adservx)

---

Built with ⚡ for Sub-Engineers
