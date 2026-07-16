# Simple Interest Calculator

A React-based interest calculator with support for:
- Tiered interest rates with custom thresholds
- Simple and compound interest calculations
- Indian numbering system (Lakh/Crore) formatting
- Multiple time periods (days, months, quarters, years)
- Compound frequency options (monthly, quarterly, semi-annually, annually)
- Calculation history with localStorage persistence
- Dark theme UI

## Tech Stack

- **React 19** with Hooks
- **Vite** for build tooling
- **CSS Custom Properties** for theming

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

### One-click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/simple-interest-calculator)

### Manual Deploy

1. Push the repository to GitHub/GitLab/Bitbucket
2. Import the project in [Vercel](https://vercel.com/new)
3. Vercel will auto-detect the Vite framework and configure:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Click **Deploy**

The `vercel.json` file in the project root handles SPA routing automatically.
