import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

function PublicLandingPage() {
  const location = useLocation();

  useEffect(() => {
    const sectionId = location.state?.scrollToSection;

    if (!sectionId) {
      return;
    }

    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.state]);

  return (
    <div className="landing-page">
      <section className="landing-hero" id="home">
        <div className="landing-hero-copy">
          <span className="landing-kicker">Smart Campus Operations Hub</span>
          <h1 className="landing-title">
            <span className="landing-title-line landing-title-line-primary">
              One Platform to Manage
            </span>
            <span className="landing-title-line landing-title-line-primary">
              Campus Services
            </span>
            <span className="landing-title-line landing-title-line-secondary">
              Bookings and Support.
            </span>
          </h1>
          <p className="landing-support-copy">
            Smart Campus Operations Hub centralizes campus services so users can manage
            requests, bookings, and support tasks from one secure place.
          </p>

          <div className="landing-actions">
            <Link className="landing-cta-button" to="/login">
              Login
            </Link>
            <Link className="landing-secondary-button" to="/signup">
              Sign Up
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-section" id="about">
        <div className="landing-section-copy">
          <span className="section-kicker">About Us</span>
          <h2>Designed for smarter campus operations.</h2>
          <p>
            Smart Campus Operations Hub centralizes bookings, maintenance workflows,
            and service notifications so users and administrators can work from a
            single, secure interface.
          </p>
        </div>

        <div className="landing-feature-grid">
          <article className="landing-feature-card">
            <h3>Unified Requests</h3>
            <p>Eliminate fragmented forms and manage requests inside one workflow.</p>
          </article>
          <article className="landing-feature-card">
            <h3>Role-Based Access</h3>
            <p>Separate experiences for users, administrators, and support teams.</p>
          </article>
          <article className="landing-feature-card">
            <h3>Operational Visibility</h3>
            <p>Keep resource usage, incidents, and updates visible across the campus.</p>
          </article>
        </div>
      </section>

      <section className="landing-section landing-section-contact" id="contact">
        <div className="landing-section-copy">
          <span className="section-kicker">Contact Us</span>
          <h2>Need help or access support?</h2>
          <p>
            Contact the Smart Campus support team for onboarding, technical issues,
            or assistance with bookings and tickets.
          </p>
        </div>

        <div className="landing-contact-grid">
          <article className="landing-contact-card">
            <strong>Email</strong>
            <p>support@smartcampus.edu</p>
          </article>
          <article className="landing-contact-card">
            <strong>Phone</strong>
            <p>+94 11 234 5678</p>
          </article>
          <article className="landing-contact-card">
            <strong>Office</strong>
            <p>Campus IT Services Center, Operations Wing</p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default PublicLandingPage;
