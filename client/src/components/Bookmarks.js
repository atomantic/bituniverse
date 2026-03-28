import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "bituniverse_bookmarks";

// View level labels and icons
const VIEW_META = {
  galaxy: { icon: "\u2726", label: "Galaxy" },
  solarSystem: { icon: "\u2600", label: "Star System" },
  planet: { icon: "\u25CF", label: "Planet" },
  map: { icon: "\u25CB", label: "Globe" },
  sector: { icon: "\u25A1", label: "Continent" },
  region: { icon: "\u25A0", label: "Region" },
  area: { icon: "\u25B3", label: "Area" },
  ground: { icon: "\u2593", label: "Ground" },
  grain: { icon: "\u00B7", label: "Grain" },
  molecule: { icon: "\u2B22", label: "Molecule" },
  atom: { icon: "\u2299", label: "Atom" },
  quark: { icon: "\u2742", label: "Quark" },
};

const VIEW_DEPTH = {
  galaxy: 0, solarSystem: 1, planet: 2, map: 3, sector: 4,
  region: 5, area: 6, ground: 7, grain: 8, molecule: 9, atom: 10, quark: 11,
};

function loadBookmarks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

function saveBookmarks(bookmarks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

function formatDate(ts) {
  const d = new Date(ts);
  const month = d.toLocaleString("default", { month: "short" });
  const day = d.getDate();
  const time = d.toLocaleTimeString("default", { hour: "2-digit", minute: "2-digit" });
  return `${month} ${day}, ${time}`;
}

function BookmarkEntry({ bookmark, isCurrent, onNavigate, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(bookmark.name || bookmark.label);
  const inputRef = useRef(null);
  const meta = VIEW_META[bookmark.view] || { icon: "?", label: bookmark.view };
  const depth = VIEW_DEPTH[bookmark.view] ?? 0;

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const handleSubmitRename = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== (bookmark.name || bookmark.label)) {
      onRename(bookmark.id, trimmed);
    }
    setEditing(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        pl: 0.5 + depth * 0.3,
        py: 0.4,
        cursor: isCurrent ? "default" : "pointer",
        borderLeft: isCurrent
          ? "2px solid var(--theme-secondary)"
          : "2px solid transparent",
        background: isCurrent ? "rgba(77, 244, 255, 0.06)" : "transparent",
        transition: "all 0.15s ease",
        minHeight: 40,
        "&:hover": isCurrent ? {} : {
          background: "rgba(77, 244, 255, 0.04)",
          borderLeftColor: "rgba(77, 244, 255, 0.3)",
        },
        "&:hover .bookmark-actions": { opacity: 1 },
      }}
      onClick={() => !editing && onNavigate(bookmark)}
    >
      <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.65rem", opacity: isCurrent ? 1 : 0.5, width: 14, textAlign: "center" }}>
        {meta.icon}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSubmitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitRename();
              if (e.key === "Escape") setEditing(false);
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(77, 244, 255, 0.08)",
              border: "1px solid rgba(77, 244, 255, 0.3)",
              borderRadius: 3,
              color: "var(--theme-text)",
              fontSize: "0.55rem",
              fontFamily: "inherit",
              padding: "2px 6px",
              width: "100%",
              outline: "none",
            }}
          />
        ) : (
          <>
            <Typography sx={{
              color: "var(--theme-text)",
              fontSize: "0.55rem",
              opacity: isCurrent ? 0.9 : 0.7,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: bookmark.name ? 500 : 400,
            }}>
              {bookmark.name || bookmark.label}
            </Typography>
            {bookmark.name && (
              <Typography sx={{
                color: "var(--theme-accent)",
                fontSize: "0.45rem",
                opacity: 0.35,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {bookmark.label}
              </Typography>
            )}
          </>
        )}
      </Box>
      <Box
        className="bookmark-actions"
        sx={{ display: "flex", gap: 0.5, opacity: 0, transition: "opacity 0.15s", pr: 0.5 }}
      >
        <Typography
          onClick={(e) => { e.stopPropagation(); setEditValue(bookmark.name || bookmark.label); setEditing(true); }}
          sx={{ color: "var(--theme-accent)", fontSize: "0.5rem", opacity: 0.5, cursor: "pointer", "&:hover": { opacity: 1 } }}
          title="Rename"
        >
          &#x270E;
        </Typography>
        <Typography
          onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id); }}
          sx={{ color: "var(--theme-accent)", fontSize: "0.5rem", opacity: 0.5, cursor: "pointer", "&:hover": { opacity: 1, color: "#ff5757" } }}
          title="Remove"
        >
          &#x2715;
        </Typography>
      </Box>
      <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.42rem", opacity: 0.3, whiteSpace: "nowrap", pr: 0.5 }}>
        {formatDate(bookmark.timestamp)}
      </Typography>
    </Box>
  );
}

export default function Bookmarks({ active, onClose, currentPath, currentView, currentLabel }) {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks());

  // Sync to localStorage on change
  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  // Close on Escape
  useEffect(() => {
    if (!active) return;
    const handleKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [active, onClose]);

  const isCurrentBookmarked = bookmarks.some((b) => b.path === currentPath);

  const handleAdd = useCallback(() => {
    if (isCurrentBookmarked) return;
    const entry = {
      id: Date.now(),
      path: currentPath,
      view: currentView,
      label: currentLabel,
      name: null,
      timestamp: Date.now(),
    };
    setBookmarks((prev) => [...prev, entry]);
  }, [currentPath, currentView, currentLabel, isCurrentBookmarked]);

  const handleDelete = useCallback((id) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleRename = useCallback((id, newName) => {
    setBookmarks((prev) => prev.map((b) => b.id === id ? { ...b, name: newName } : b));
  }, []);

  const handleNavigate = useCallback((bookmark) => {
    if (bookmark.path !== currentPath) {
      navigate(bookmark.path);
    }
  }, [navigate, currentPath]);

  if (!active) return null;

  return (
    <Box
      onClick={onClose}
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: 400,
          maxWidth: "90vw",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          background: "rgba(10, 6, 30, 0.95)",
          border: "1px solid rgba(77, 244, 255, 0.2)",
          borderRadius: "6px",
          boxShadow: "0 0 40px rgba(77, 244, 255, 0.08)",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2.5, pt: 2, pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Bookmarks
            </Typography>
            <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.5rem", opacity: 0.4 }}>
              {bookmarks.length} saved
            </Typography>
          </Box>
          <Typography
            onClick={onClose}
            sx={{ color: "var(--theme-accent)", fontSize: "0.6rem", opacity: 0.5, cursor: "pointer", "&:hover": { opacity: 0.8 } }}
          >
            ESC
          </Typography>
        </Box>

        {/* Description */}
        <Typography sx={{ color: "var(--theme-text)", fontSize: "0.55rem", opacity: 0.5, px: 2.5, pb: 1, lineHeight: 1.5 }}>
          Save locations to revisit across sessions. Hover entries to rename or remove.
        </Typography>

        {/* Add current location button */}
        <Box sx={{ px: 2.5, pb: 1.5 }}>
          <Box
            onClick={isCurrentBookmarked ? undefined : handleAdd}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              py: 0.6,
              borderRadius: "4px",
              border: isCurrentBookmarked
                ? "1px solid rgba(77, 244, 255, 0.1)"
                : "1px dashed rgba(77, 244, 255, 0.25)",
              cursor: isCurrentBookmarked ? "default" : "pointer",
              opacity: isCurrentBookmarked ? 0.4 : 0.7,
              transition: "all 0.15s ease",
              minHeight: 40,
              ...(!isCurrentBookmarked && {
                "&:hover": {
                  opacity: 1,
                  borderColor: "rgba(77, 244, 255, 0.5)",
                  background: "rgba(77, 244, 255, 0.04)",
                },
              }),
            }}
          >
            <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.6rem" }}>
              {isCurrentBookmarked ? "\u2713" : "+"}
            </Typography>
            <Typography sx={{ color: "var(--theme-text)", fontSize: "0.55rem" }}>
              {isCurrentBookmarked ? "Current location bookmarked" : "Bookmark this location"}
            </Typography>
          </Box>
        </Box>

        {/* Bookmarks list */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 1,
            pb: 1.5,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { background: "rgba(77, 244, 255, 0.15)", borderRadius: 2 },
          }}
        >
          {bookmarks.length === 0 ? (
            <Typography sx={{ color: "var(--theme-text)", fontSize: "0.55rem", opacity: 0.4, textAlign: "center", py: 3 }}>
              No bookmarks yet. Save interesting locations to revisit later.
            </Typography>
          ) : (
            [...bookmarks].reverse().map((bookmark) => {
              const isCurrent = bookmark.path === currentPath;
              return (
                <BookmarkEntry
                  key={bookmark.id}
                  bookmark={bookmark}
                  isCurrent={isCurrent}
                  onNavigate={handleNavigate}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
}
