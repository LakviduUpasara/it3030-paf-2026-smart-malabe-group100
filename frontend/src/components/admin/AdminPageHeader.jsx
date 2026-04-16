function AdminPageHeader({ title, description, actions }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-heading">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-text/72">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export default AdminPageHeader;
