function AdminStatTile({
  label,
  value,
  detail,
  icon: Icon,
  className = "",
  labelClassName = "",
  valueClassName = "",
  detailClassName = "",
  iconShellClassName = "",
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-shadow ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-semibold uppercase tracking-[0.12em] text-text/60 ${labelClassName}`.trim()}
          >
            {label}
          </p>
          <p
            className={`mt-2 text-3xl font-semibold tracking-tight text-heading ${valueClassName}`.trim()}
          >
            {value}
          </p>
          {detail ? (
            <p className={`mt-1 text-sm text-text/70 ${detailClassName}`.trim()}>{detail}</p>
          ) : null}
        </div>
        {Icon ? (
          <span
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ${iconShellClassName}`.trim()}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          </span>
        ) : null}
      </div>
    </article>
  );
}

export default AdminStatTile;
