import { renderMarkdown } from "@/lib/markdown";
import type { ContentBlock } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { IconDownload, IconLink } from "./Icons";

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export function ContentBlocks({ blocks, lessonId }: { blocks: ContentBlock[]; lessonId: string }) {
  if (!blocks.length) return null;
  return (
    <div className="content">
      {blocks.map((b) => {
        switch (b.type) {
          case "text":
            return (
              <div key={b.id} className="glass card-sm prose">
                {b.title && <h3>{b.title}</h3>}
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(b.body) }} />
              </div>
            );
          case "toggle":
            return (
              <details key={b.id} className="toggle">
                <summary>{b.title || "Détails"}</summary>
                <div className="toggle-body prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(b.body) }} />
              </details>
            );
          case "prompt":
            return (
              <div key={b.id} className="prompt">
                <div className="prompt-head">
                  <span>{b.title || "Prompt"}</span>
                  <CopyButton text={b.body} label="Copier le prompt" />
                </div>
                <pre>{b.body}</pre>
              </div>
            );
          case "file":
            return (
              <a key={b.id} className="item file-item" href={`/api/fichiers/lecon/${lessonId}/${b.id}`}>
                <span className="ico"><IconDownload /></span>
                <span className="grow">
                  <span className="title">{b.title || b.file_name || "Document"}</span>
                  <span className="sub">{[b.file_name, formatSize(b.file_size)].filter(Boolean).join(" · ")}{b.body ? ` · ${b.body}` : ""}</span>
                </span>
              </a>
            );
          case "link":
            return (
              <a key={b.id} className="item file-item" href={b.url ?? "#"} target="_blank" rel="noopener">
                <span className="ico"><IconLink /></span>
                <span className="grow">
                  <span className="title">{b.title || b.url}</span>
                  {b.body && <span className="sub">{b.body}</span>}
                </span>
              </a>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
