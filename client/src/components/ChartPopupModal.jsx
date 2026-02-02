import React from "react";
import "./ChartPopupModal.css";

export default function ChartPopupModal({
  open,
  title = "",
  onClose,
  left,
  right,
  maxWidth = 1200,
  maxHeight = 780,
}) {
  if (!open) return null;

  const close = () => {
    if (typeof onClose === "function") onClose();
  };

  return (
    <div className="chartModalOverlay" role="presentation" onClick={close}>
      <div
        className="chartModalDialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: `min(${maxWidth}px, 95vw)`,
          height: `min(${maxHeight}px, 90vh)`,
        }}
      >
        <div className="chartModalTitle">{title}</div>

        <div className="chartModalTopActions">
          <button type="button" className="chartModalCloseBtn" onClick={close}>
            Close
          </button>
        </div>

        <div className="chartModalContent">
          <div className="chartModalLeft">
            <div className="chartModalLeftInner">{left}</div>
          </div>

          {right ? <div className="chartModalRight">{right}</div> : null}
        </div>
      </div>
    </div>
  );
}
