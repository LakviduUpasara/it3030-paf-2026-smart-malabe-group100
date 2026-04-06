import InfoCard from "../components/InfoCard";

function HomePage() {
  return (
    <section>
      <div className="card">
        <h2>Welcome</h2>
        <p className="muted">
          This starter frontend is ready to grow into the Smart Campus Operations Hub.
        </p>
      </div>

      <div className="status-list">
        <InfoCard
          title="Backend Integration"
          description="Use the services layer to connect React pages to Spring Boot APIs."
        />
        <InfoCard
          title="Role-Based Routing"
          description="Protected routes and auth context are prepared for login-based access."
        />
        <InfoCard
          title="Scalable UI"
          description="Build reusable components in the components folder and page screens in pages."
        />
      </div>
    </section>
  );
}

export default HomePage;

