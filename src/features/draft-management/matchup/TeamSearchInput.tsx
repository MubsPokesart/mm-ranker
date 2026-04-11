import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogEntry } from "./teamCatalog";
import { searchCatalog } from "./teamCatalog";
import "./TeamSearchInput.css";

interface TeamSearchInputProps {
  label: string;
  catalog: CatalogEntry[];
  selected: CatalogEntry | null;
  onSelect: (entry: CatalogEntry | null) => void;
}

const REGION_SHORT: Record<string, string> = {
  east: "East",
  south: "South",
  west: "West",
  midwest: "Midwest",
};

export function TeamSearchInput({ label, catalog, selected, onSelect }: TeamSearchInputProps) {
  const [query, setQuery] = useState(selected?.team.name ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selected?.team.name ?? "");
  }, [selected]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const results = useMemo(() => {
    if (selected && query === selected.team.name) return [];
    return searchCatalog(catalog, query);
  }, [catalog, query, selected]);

  function handleChange(value: string) {
    setQuery(value);
    setOpen(true);
    setActiveIndex(0);
    if (selected && value !== selected.team.name) {
      onSelect(null);
    }
  }

  function handleSelect(entry: CatalogEntry) {
    onSelect(entry);
    setQuery(entry.team.name);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[activeIndex];
      if (pick) handleSelect(pick);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="team-search" ref={containerRef}>
      <label className="team-search-label">{label}</label>
      <input
        type="text"
        className="team-search-input"
        value={query}
        placeholder="Search team…"
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <ul className="team-search-results" role="listbox">
          {results.map((entry, index) => (
            <li
              key={entry.team.id}
              role="option"
              aria-selected={index === activeIndex}
              className={`team-search-result ${index === activeIndex ? "team-search-result--active" : ""}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(entry);
              }}
            >
              <span className="team-search-result-name">{entry.team.name}</span>
              <span className="team-search-result-tag">{REGION_SHORT[entry.regionId]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
