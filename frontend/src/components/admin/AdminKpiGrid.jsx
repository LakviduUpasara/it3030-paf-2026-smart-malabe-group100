function AdminKpiGrid({ children }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">{children}</div>
  );
}

export default AdminKpiGrid;
