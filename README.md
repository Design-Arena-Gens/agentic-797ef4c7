# Agentic Daily YouTube Automation

Autonomous Next.js dashboard that generates a complete daily YouTube upload using AI systems for scripting, narration, stock footage, editing, and publishing. Runs locally for manual control and exposes a `/api/run` endpoint suitable for Vercel Cron to execute unattended jobs.

## Capabilities

- Script generation via OpenAI Chat Completions with preset-aware prompting
- Voiceover synthesis through ElevenLabs streaming API
- Pexels stock-video sourcing with automatic quality selection
- ffmpeg-based timeline merge of narration and footage inside the API route
- YouTube upload using OAuth2 refresh tokens, templated metadata, and tag support
- Optional webhook callback with run artifacts
- Persistent UI configuration stored in `localStorage`
- Vercel Blob uploads for generated audio/video assets

## Local Development

1. Install dependencies
   ```bash
   npm install
   ```
2. Duplicate `.env.example` (create it if missing) as `.env.local` and fill in the required keys (see below).
3. Run the development server
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) and trigger a pipeline run. The status feed streams events as steps complete.

## Required Environment Variables

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Script generation |
| `ELEVENLABS_API_KEY` | Voiceover synthesis |
| `PEXELS_API_KEY` | Stock footage sourcing |
| `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` | OAuth2 upload client |
| `YOUTUBE_REFRESH_TOKEN` | Refresh token authorising uploads |
| `BLOB_READ_WRITE_TOKEN` | Required for `@vercel/blob` when running locally |

Optional overrides:

| Variable | Description |
| --- | --- |
| `PIPELINE_DEFAULT_TOPIC` | Default topic when none supplied |
| `PIPELINE_TARGET_DURATION` | Target render length in seconds |
| `PIPELINE_UPLOAD_TITLE_TEMPLATE` | Title template with tokens like `{{date}}` |
| `PIPELINE_UPLOAD_DESCRIPTION_TEMPLATE` | Description template |
| `PIPELINE_UPLOAD_TAGS` | Comma-separated tags |
| `PIPELINE_UPLOAD_VISIBILITY` | `public`, `unlisted`, or `private` |
| `PIPELINE_VOICE_ID` | ElevenLabs voice ID |
| `PIPELINE_EXTRA_INSTRUCTIONS` | Additional prompting |
| `PIPELINE_PRESET` | `news`, `facts`, or `longform` |
| `PIPELINE_WEBHOOK_URL` | Webhook notified after successful runs |

## Deployment & Automation

The supplied `vercel.json` schedules a daily cron at 09:00 UTC that hits `/api/run`. Populate the environment variables inside Vercel and add a `BLOB_READ_WRITE_TOKEN` with Blob read/write permissions. The GET handler executes the pipeline using env-based defaults and returns structured logs.

To deploy manually:

```bash
npm run build
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-797ef4c7
```

After deployment, verify:

```bash
curl https://agentic-797ef4c7.vercel.app
```

## YouTube Credentials Primer

1. Create a Google Cloud project with YouTube Data API v3 enabled.
2. Generate an OAuth client (Desktop) and capture the client ID/secret.
3. Use the OAuth Playground to exchange authorization for a refresh token scoped to YouTube uploads (`https://www.googleapis.com/auth/youtube.upload`).
4. Store the refresh token alongside the client credentials in project env vars.

## Notes

- ffmpeg runs via the static binary packaged by `ffmpeg-static`. Vercel functions use the Node.js runtime to enable binary execution.
- Video/audio assets are uploaded to Vercel Blob for quick sharing and post-processing.
- The UI leverages `react-hook-form` + `zod` validation and persists config client-side so daily operators can tweak runs rapidly.
- The pipeline surfaces granular progress events over Server-Sent Events for immediate UX feedback and downstream monitoring.
