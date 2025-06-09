# Kambaz React Web App

This is a modern React application built with TypeScript and Vite, featuring a clean and efficient development setup.

## 🚀 Live Demo

The application is deployed and available at: [https://musical-crisp-79946e.netlify.app/](https://musical-crisp-79946e.netlify.app/)

## 🛠️ Tech Stack

- React 18.3
- TypeScript
- Vite 6.0
- React Router 7.1
- ESLint with TypeScript support

## 🏗️ Project Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## 🔧 Development

The project uses Vite for fast development with HMR (Hot Module Replacement) and includes ESLint for code quality.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 📝 ESLint Configuration

For production applications, we recommend enabling type-aware lint rules:

```js
export default tseslint.config({
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

### React ESLint Configuration

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  settings: { react: { version: '18.3' } },
  plugins: {
    react,
  },
  rules: {
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
