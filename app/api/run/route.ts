import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { createPipeline } from "@/lib/pipeline";
import { PipelineRunRequest, pipelineRequestSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const coerced = coerceBody(json);
    const parsed = pipelineRequestSchema.safeParse(coerced);
    if (!parsed.success) {
      return Response.json(
        { message: "Invalid payload", issues: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const generator = createPipeline()(parsed.data);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { value, done } = await generator.next();
          if (done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }
          if (value) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(value)}\n\n`)
            );
          }
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                id: randomUUID(),
                status: "error",
                title: "Fatal",
                detail:
                  error instanceof Error ? error.message : "Unknown failure",
                timestamp: new Date().toISOString()
              })}\n\n`
            )
          );
          controller.close();
        }
      },
      async cancel() {
        if (generator.return) {
          await generator.return(undefined);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to start automation pipeline"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const defaults = deriveFromEnv();
  const generator = createPipeline()(defaults);
  const events = [];
  try {
    for await (const event of generator) {
      events.push(event);
    }
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Pipeline failed during cron execution",
        events
      },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, events });
}

function deriveFromEnv(): PipelineRunRequest {
  const env = process.env;
  const tags =
    env.PIPELINE_UPLOAD_TAGS?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) ?? [];
  return pipelineRequestSchema.parse({
    openaiKey: env.OPENAI_API_KEY,
    elevenLabsKey: env.ELEVENLABS_API_KEY,
    pexelsKey: env.PEXELS_API_KEY,
    youtubeClientId: env.YOUTUBE_CLIENT_ID,
    youtubeClientSecret: env.YOUTUBE_CLIENT_SECRET,
    youtubeRefreshToken: env.YOUTUBE_REFRESH_TOKEN,
    voiceId: env.PIPELINE_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM",
    videoTopic: env.PIPELINE_DEFAULT_TOPIC ?? "Daily AI news recap",
    targetDurationSeconds: coerceNumber(env.PIPELINE_TARGET_DURATION, 120),
    uploadTitleTemplate:
      env.PIPELINE_UPLOAD_TITLE_TEMPLATE ?? "Daily AI Briefing - {{date}}",
    uploadDescriptionTemplate:
      env.PIPELINE_UPLOAD_DESCRIPTION_TEMPLATE ??
      "Automated summary for {{date}}.",
    uploadTags: tags,
    visibility:
      (env.PIPELINE_UPLOAD_VISIBILITY as PipelineRunRequest["visibility"]) ??
      "unlisted",
    allowCopyrightAudio: env.PIPELINE_ALLOW_COPY_AUDIO === "true",
    preset: (env.PIPELINE_PRESET as PipelineRunRequest["preset"]) ?? "news",
    webhookUrl: env.PIPELINE_WEBHOOK_URL ?? "",
    runContext: env.PIPELINE_RUN_CONTEXT ?? "",
    extraInstructions: env.PIPELINE_EXTRA_INSTRUCTIONS ?? ""
  });
}

function coerceBody(body: any): PipelineRunRequest {
  const tags = Array.isArray(body?.uploadTags)
    ? body.uploadTags
    : typeof body?.uploadTags === "string"
    ? body.uploadTags.split(/[,\n]+/).map((tag: string) => tag.trim())
    : [];

  return {
    openaiKey: tr(body?.openaiKey),
    elevenLabsKey: tr(body?.elevenLabsKey),
    pexelsKey: tr(body?.pexelsKey),
    youtubeClientId: tr(body?.youtubeClientId),
    youtubeClientSecret: tr(body?.youtubeClientSecret),
    youtubeRefreshToken: tr(body?.youtubeRefreshToken),
    voiceId: tr(body?.voiceId) ?? "21m00Tcm4TlvDq8ikWAM",
    videoTopic: tr(body?.videoTopic) ?? "Daily AI news round-up",
    targetDurationSeconds: coerceNumber(body?.targetDurationSeconds, 120),
    uploadTitleTemplate:
      tr(body?.uploadTitleTemplate) ?? "Daily AI Highlights - {{date}}",
    uploadDescriptionTemplate:
      tr(body?.uploadDescriptionTemplate) ??
      "Automated AI news for {{date}}.",
    uploadTags: tags,
    visibility:
      tr(body?.visibility) === "private" ||
      tr(body?.visibility) === "public" ||
      tr(body?.visibility) === "unlisted"
        ? tr(body?.visibility)
        : "unlisted",
    allowCopyrightAudio: Boolean(body?.allowCopyrightAudio),
    preset:
      tr(body?.preset) === "facts" || tr(body?.preset) === "longform"
        ? tr(body?.preset)
        : "news",
    webhookUrl: tr(body?.webhookUrl) ?? "",
    runContext: tr(body?.runContext) ?? "",
    extraInstructions: tr(body?.extraInstructions) ?? ""
  } as PipelineRunRequest;
}

function tr(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function coerceNumber(input: unknown, fallback: number): number {
  const value =
    typeof input === "number"
      ? input
      : typeof input === "string"
      ? Number(input)
      : Number.NaN;
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
