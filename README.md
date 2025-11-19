# Casemate – Pakistan Legal Template Generator (MVP)

A Next.js application that generates legal document templates for Pakistan using OpenAI GPT-4o-mini.

## Features

- Generate legal document templates for various document types (Rent Agreement, Employment Contract, Legal Notice, NDA, Partnership Agreement)
- AI-powered content generation using OpenAI
- PDF download functionality
- Clean, minimal UI with Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Import the project in Vercel
3. Add the `OPENAI_API_KEY` environment variable in Vercel's project settings
4. Deploy

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- OpenAI Node SDK
- PDFKit for PDF generation

## Important Disclaimer

This tool generates AI-based legal templates for Pakistan. It is **not legal advice**. Always have a licensed Pakistani lawyer review any document before use.

