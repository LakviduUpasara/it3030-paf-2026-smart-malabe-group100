import { Link } from "react-router-dom";
import Card from "../components/Card";

function NotFoundPage() {
  return (
    <Card title="Page Not Found" subtitle="The page you requested does not exist.">
      <p className="supporting-text">
        Check the URL or return to the main application dashboard.
      </p>
      <Link className="text-link" to="/">
        Go to home
      </Link>
    </Card>
  );
}

export default NotFoundPage;
