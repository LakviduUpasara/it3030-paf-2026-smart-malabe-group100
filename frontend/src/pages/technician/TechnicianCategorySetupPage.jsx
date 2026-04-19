import Card from "../../components/Card";

/**
 * Technician-side category reference. Categories themselves are managed by admins
 * via /admin/tickets?section=categories, so this page is read-only guidance.
 */
function TechnicianCategorySetupPage() {
  return (
    <Card
      title="Category setup"
      subtitle="Ticket categories are managed by administrators"
    >
      <div className="space-y-3 text-sm text-text/75">
        <p>
          Ticket categories (e.g. <strong>Projector</strong>, <strong>Network</strong>,{" "}
          <strong>Furniture</strong>) are defined in the Admin console so all technicians
          share one taxonomy.
        </p>
        <p>
          If a new category is needed, please reach out to a platform administrator — they
          can add it under <strong>Admin → Tickets → Category setup</strong>.
        </p>
      </div>
    </Card>
  );
}

export default TechnicianCategorySetupPage;
