# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Backend Server

A Fastify + TypeScript backend is provided in the `server/` folder.
You can use the `setup.sh` script to configure and build it automatically:

```bash
cd server
./setup.sh
```

The script installs dependencies, creates the `.env` file, runs Prisma
migrations and builds the project. When finished start the server with:

```bash
npm start
```
