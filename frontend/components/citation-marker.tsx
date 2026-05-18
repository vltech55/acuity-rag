"use client";

import * as Popover from "@radix-ui/react-popover";
import type { CitationOut } from "@/lib/api";

type Props = {
  marker: string;
  citation: CitationOut | undefined;
};

export function CitationMarker({ marker, citation }: Props) {
  if (!citation) {
    return (
      <span className="citation-marker bg-red-500/20 text-red-300" title="Unresolved citation">
        [{marker}]
      </span>
    );
  }
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="citation-marker">[{marker}]</button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          className="z-50 max-w-md rounded-md border border-neutral-700 bg-neutral-900 p-3 text-sm shadow-xl"
        >
          <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">
            arXiv:{citation.arxiv_id}
          </div>
          <div className="font-medium mb-1 text-neutral-100">{citation.paper_title}</div>
          {citation.section ? (
            <div className="text-xs text-neutral-400 mb-2 italic">
              section: {citation.section}
            </div>
          ) : null}
          <div className="text-neutral-300 text-sm leading-relaxed line-clamp-6">
            {citation.content}
          </div>
          <a
            href={`https://arxiv.org/abs/${citation.arxiv_id}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs text-sky-400 hover:underline"
          >
            Open on arXiv →
          </a>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
