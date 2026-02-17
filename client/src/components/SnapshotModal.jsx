// client/src/components/SnapshotModal.jsx
import React, { useEffect, useMemo } from "react";

/**
 * SnapshotModal:
 * - Same size + styling as seeder modal
 * - No seeder logic
 * - Shows 6 PNG thumbnails: 3 on top row, 3 on bottom row
 *
 * Put images here:
 *   client/public/snapshots/s1.png ... s6.png
 * Then they load with:
 *   /snapshots/s1.png
 */

export default function SnapshotModal({ open, onClose }) {
  const images = useMemo(
    () => [
      { src: "/snapshots/s1.png", alt: "Snapshot 1" },
      { src: "/snapshots/s2.png", alt: "Snapshot 2" },
      { src: "/snapshots/s3.png", alt: "Snapshot 3" },
      { src: "/snapshots/s4.png", alt: "Snapshot 4" },
      { src: "/snapshots/s5.png", alt: "Snapshot 5" },
      { src: "/snapshots/s6.png", alt: "Snapshot 6" },
    ],
    []
  );

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={styles.backdrop}>
      <div
        style={styles.modal}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>Snapshots</h2>
          <button onClick={onClose} style={styles.xBtn} aria-label="Close">
            ✕
          </button>
        </div>

        <p style={styles.subtext}>
          Quick visual snapshots. (Place images in <code>client/public/snapshots/</code>)
        </p>

        <div style={styles.imageGrid}>
          {images.map((img) => (
            <div key={img.src} style={styles.thumbCard}>
              <img src={img.src} alt={img.alt} style={styles.thumbImg} />
              <div style={styles.thumbCaption}>{img.alt}</div>
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btnSecondary}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999,
  },
  modal: {
    width: "min(720px, 100%)",
    background: "#0f1115",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    color: "white",
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  xBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 18,
    cursor: "pointer",
  },
  subtext: { marginTop: 10, marginBottom: 16, opacity: 0.85 },

  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },
  thumbCard: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    overflow: "hidden",
    background: "rgba(255,255,255,0.04)",
  },
  thumbImg: {
    width: "100%",
    height: 140,
    objectFit: "cover",
    display: "block",
  },
  thumbCaption: {
    padding: "8px 10px",
    fontSize: 13,
    opacity: 0.9,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },

  footer: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  btnSecondary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },
};
