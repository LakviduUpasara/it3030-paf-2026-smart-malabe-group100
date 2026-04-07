function Modal({
  isOpen,
  onClose,
  title,
  children,
  panelClassName = "",
  contentClassName = "",
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        aria-modal="true"
        className={`modal-panel ${panelClassName}`.trim()}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        {title ? (
          <div className="modal-header">
            <h3>{title}</h3>
            <button
              aria-label="Close dialog"
              className="modal-close"
              onClick={onClose}
              type="button"
            >
              x
            </button>
          </div>
        ) : null}
        <div className={`modal-content ${contentClassName}`.trim()}>{children}</div>
      </div>
    </div>
  );
}

export default Modal;

