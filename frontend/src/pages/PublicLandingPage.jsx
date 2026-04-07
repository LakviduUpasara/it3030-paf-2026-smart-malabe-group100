import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../components/Button";

function PublicLandingPage({ onOpenLoginModal }) {
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
          <span className="auth-hero-kicker">Smart Campus Operations Hub</span>
          <h1 className="landing-title">One platform for campus services, bookings, and support.</h1>
          <p className="landing-description">
            Manage facilities, asset reservations, maintenance tickets, and operational
            notifications from one streamlined system built for students and staff.
          </p>

          <div className="landing-actions">
            <Button className="landing-cta-button" onClick={onOpenLoginModal} variant="primary">
              Login
            </Button>
            <Link className="landing-secondary-link" to="/signup">
              Sign Up
            </Link>
          </div>
        </div>

        <div className="landing-highlight-grid">
          <article className="landing-highlight-card">
            <strong>Facilities & Assets</strong>
            <p>Browse campus resources, check availability, and manage asset visibility.</p>
          </article>
          <article className="landing-highlight-card">
            <strong>Bookings & Approvals</strong>
            <p>Submit booking requests, track approval status, and manage schedules.</p>
          </article>
          <article className="landing-highlight-card">
            <strong>Incident Support</strong>
            <p>Raise maintenance tickets quickly and follow operational updates in real time.</p>
          </article>
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
