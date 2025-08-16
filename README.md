# RSS Vector Search

A modern RSS reader application built with Next.js, featuring vector search capabilities powered by ChromaDB.

## Features

- RSS feed management and parsing
- MongoDB for metadata storage
- ChromaDB for vector database and semantic search
- Modern UI with Tailwind CSS and shadcn/ui components
- Dark/light theme support
- Embedding generation using @xenova/transformers

## Prerequisites

- Node.js 18+ and Yarn
- MongoDB running locally or accessible via URI
- ChromaDB installed locally or accessible via API

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
# MongoDB
MONGODB_URI=mongodb://localhost:27017/rss_project

# ChromaDB (local installation)
CHROMA_DB_PATH=http://localhost:8000
```

## Getting Started

Install dependencies:

```bash
yarn
```

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/src/app` - Next.js App Router pages
- `/src/app/api` - API routes for RSS processing
- `/src/components` - UI components
- `/src/lib/db` - Database connections and models
- `/src/lib/utils` - Utility functions for RSS parsing and embeddings
- `/src/types` - TypeScript type definitions
