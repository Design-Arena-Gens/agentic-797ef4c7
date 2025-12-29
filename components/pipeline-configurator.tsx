import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import {
  PipelineRunRequest,
  pipelineRequestSchema,
  presetConfigurations
} from "@/lib/schema";
import styles from "./pipeline-configurator.module.css";

interface Props {
  value: PipelineRunRequest;
  onChange: (value: PipelineRunRequest) => void;
  onRun: (value: PipelineRunRequest) => void | Promise<void>;
  running: boolean;
}

const tagDelimiter = /[,\n]+/;

export function PipelineConfigurator({
  value,
  onChange,
  onRun,
  running
}: Props) {
  const {
    register,
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm<PipelineRunRequest>({
    resolver: zodResolver(pipelineRequestSchema),
    defaultValues: value
  });

  const formValue = watch();

  useEffect(() => {
    if (!isDirty) {
      reset(value);
    }
  }, [value, reset, isDirty]);

  useEffect(() => {
    onChange(formValue);
  }, [formValue, onChange]);

  const handlePreset = (preset: PipelineRunRequest["preset"]) => {
    const presetConfig = presetConfigurations[preset] ?? {};
    const uploadTags =
      presetConfig.uploadTags ?? formValue.uploadTags ?? value.uploadTags;
    reset({
      ...formValue,
      ...presetConfig,
      preset,
      uploadTags
    });
  };

  const handleTagInput = (input: string) => {
    const parsed = input
      .split(tagDelimiter)
      .map((tag) => tag.trim())
      .filter(Boolean);
    setValue("uploadTags", parsed, { shouldDirty: true });
  };

  return (
    <div className={styles.wrapper}>
      <header>
        <div>
          <h1>Daily YouTube Automation</h1>
          <p>
            Configure tokens, voice, tone, and publishing rules. Hit run to
            orchestrate an end-to-end AI video production and upload.
          </p>
        </div>
        <div className={styles.presetBar}>
          <span>Preset</span>
          <div className={styles.presetButtons}>
            {(
              ["news", "facts", "longform"] as PipelineRunRequest["preset"][]
            ).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePreset(preset)}
                className={classNames(styles.presetButton, {
                  [styles.activePreset]: formValue.preset === preset
                })}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </header>

      <form
        className={styles.form}
        onSubmit={handleSubmit((data) => onRun(data))}
      >
        <section>
          <h2>Model Credentials</h2>
          <div className={styles.grid}>
            <Field
              label="OpenAI API Key"
              placeholder="sk-..."
              error={errors.openaiKey?.message}
            >
              <input
                type="password"
                autoComplete="off"
                {...register("openaiKey")}
              />
            </Field>
            <Field
              label="ElevenLabs API Key"
              placeholder="eleven..."
              error={errors.elevenLabsKey?.message}
            >
              <input
                type="password"
                autoComplete="off"
                {...register("elevenLabsKey")}
              />
            </Field>
            <Field
              label="Pexels API Key"
              placeholder="5634..."
              error={errors.pexelsKey?.message}
            >
              <input
                type="password"
                autoComplete="off"
                {...register("pexelsKey")}
              />
            </Field>
          </div>
        </section>

        <section>
          <h2>YouTube Publishing</h2>
          <div className={styles.grid}>
            <Field
              label="YouTube OAuth Client ID"
              placeholder="xxxxxxxx.apps.googleusercontent.com"
              error={errors.youtubeClientId?.message}
            >
              <input {...register("youtubeClientId")} />
            </Field>
            <Field
              label="YouTube Client Secret"
              placeholder="GOCSPX-..."
              error={errors.youtubeClientSecret?.message}
            >
              <input type="password" {...register("youtubeClientSecret")} />
            </Field>
            <Field
              label="YouTube Refresh Token"
              placeholder="1//0..."
              error={errors.youtubeRefreshToken?.message}
            >
              <textarea rows={1} {...register("youtubeRefreshToken")} />
            </Field>
            <Field label="Visibility">
              <select {...register("visibility")}>
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </Field>
          </div>
        </section>

        <section>
          <h2>Creative Direction</h2>
          <div className={styles.grid}>
            <Field
              label="Video Topic"
              error={errors.videoTopic?.message}
              hint="Use variables like {{date}} to auto-insert the current day."
            >
              <input {...register("videoTopic")} />
            </Field>
            <Field
              label="Target Duration (seconds)"
              error={errors.targetDurationSeconds?.message}
            >
              <input
                type="number"
                min={30}
                max={1200}
                {...register("targetDurationSeconds", {
                  valueAsNumber: true
                })}
              />
            </Field>
            <Field label="Voice ID" error={errors.voiceId?.message}>
              <input {...register("voiceId")} />
            </Field>
            <Field
              label="Extra Instructions"
              error={errors.extraInstructions?.message}
            >
              <textarea rows={4} {...register("extraInstructions")} />
            </Field>
            <Field label="Run Context" error={errors.runContext?.message}>
              <textarea rows={3} {...register("runContext")} />
            </Field>
            <Field label="Webhook URL" error={errors.webhookUrl?.message}>
              <input {...register("webhookUrl")} placeholder="https://..." />
            </Field>
          </div>
        </section>

        <section>
          <h2>Upload Metadata</h2>
          <div className={styles.grid}>
            <Field
              label="Title Template"
              error={errors.uploadTitleTemplate?.message}
            >
              <input {...register("uploadTitleTemplate")} />
            </Field>
            <Field
              label="Description Template"
              error={errors.uploadDescriptionTemplate?.message}
            >
              <textarea rows={6} {...register("uploadDescriptionTemplate")} />
            </Field>
            <Field label="Tags" error={errors.uploadTags?.message}>
              <textarea
                rows={3}
                value={(formValue.uploadTags ?? []).join(", ")}
                onChange={(event) => handleTagInput(event.target.value)}
                placeholder="ai, automation, tech"
              />
            </Field>
            <Field
              label="Allow Copyright Audio"
              error={errors.allowCopyrightAudio?.message}
            >
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  {...register("allowCopyrightAudio")}
                />
                <span>Allow referencing copyrighted music in prompts</span>
              </label>
            </Field>
          </div>
        </section>

        <footer className={styles.footer}>
          <button type="submit" disabled={running}>
            {running ? "Running..." : "Run Pipeline"}
          </button>
        </footer>
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  placeholder?: string;
}

function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className={styles.field}>
      <div className={styles.fieldHeader}>
        <span>{label}</span>
        {hint ? <small>{hint}</small> : null}
      </div>
      {children}
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
}

