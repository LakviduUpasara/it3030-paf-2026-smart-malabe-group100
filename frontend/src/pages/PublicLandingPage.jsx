import { useEffect } from "react";
import {
  BarChart3,
  BellRing,
  Building2,
  CalendarDays,
  Eye,
  FileText,
  Headset,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import heroFigure from "../assets/11.png";

const landingHighlights = [
  {
    title: "Resource Booking",
    description: "Book and manage campus resources in real-time.",
    Icon: CalendarDays,
    tone: "blue",
  },
  {
    title: "Incident Support",
    description: "Report and track issues for faster resolutions.",
    Icon: Headset,
    tone: "green",
  },
  {
    title: "Smart Notifications",
    description: "Stay updated with real-time alerts and announcements.",
    Icon: BellRing,
    tone: "purple",
  },
  {
    title: "Data Insights",
    description: "Make smarter decisions with powerful analytics.",
    Icon: BarChart3,
    tone: "amber",
  },
];

function PublicLandingPage() {
  const location = useLocation();

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const sectionId = location.state?.scrollToSection;

    if (!sectionId) {
      return;
    }

    scrollToSection(sectionId);
  }, [location.state]);

  return (
    <div className="landing-page">
      <section className="landing-hero" id="home">
        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <span className="landing-kicker">All-in-One Campus Management</span>

            <h1 className="landing-title-stage landing-title-stage-static">
              <span className="landing-title-stack landing-title-stack-static">
                <span className="landing-title-line landing-title-line-primary">
                  Simplify Campus
                </span>
                <span className="landing-title-line landing-title-line-primary landing-title-line-combo">
                  <span>Operations.</span>
                  <span className="landing-title-line-accent">Enhance</span>
                </span>
                <span className="landing-title-line landing-title-line-primary">
                  Student Experience.
                </span>
              </span>
            </h1>

            <p className="landing-slide-description">
              Manage bookings, resources, incidents, and communications seamlessly
              with
              <span className="landing-slide-description-accent">
                {" "}
                Smart Campus Operations Hub.
              </span>
            </p>

            <div className="landing-actions">
              <Link className="landing-cta-button" to="/signup">
                <span>Get Started</span>
                <span
                  className="landing-action-icon-shell landing-action-icon-shell-solid"
                  aria-hidden="true"
                >
                  <span className="landing-action-glyph landing-action-glyph-arrow" />
                </span>
              </Link>

              <button
                className="landing-secondary-button"
                onClick={() => scrollToSection("about")}
                type="button"
              >
                <span>Learn More</span>
                <span
                  className="landing-action-icon-shell landing-action-icon-shell-outline"
                  aria-hidden="true"
                >
                  <span className="landing-action-glyph landing-action-glyph-play" />
                </span>
              </button>
            </div>
          </div>

          <div className="landing-hero-visual" aria-hidden="true">
            <div className="landing-hero-media">
              <img src={heroFigure} alt="" />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-feature-strip" aria-label="Platform highlights">
        {landingHighlights.map(({ title, description, Icon, tone }) => (
          <article className="landing-feature-card-dashboard" key={title}>
            <span
              className={`landing-feature-card-icon landing-feature-card-icon--${tone}`}
              aria-hidden="true"
            >
              <Icon />
            </span>

            <div className="landing-feature-card-copy">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </article>
        ))}
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
            <span className="landing-card-accent" aria-hidden="true">
              <FileText />
            </span>
            <h3>Unified Requests</h3>
            <p>Eliminate fragmented forms and manage requests inside one workflow.</p>
          </article>

          <article className="landing-feature-card">
            <span className="landing-card-accent" aria-hidden="true">
              <ShieldCheck />
            </span>
            <h3>Role-Based Access</h3>
            <p>Separate experiences for users, administrators, and support teams.</p>
          </article>

          <article className="landing-feature-card">
            <span className="landing-card-accent" aria-hidden="true">
              <Eye />
            </span>
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
            <span className="landing-card-accent" aria-hidden="true">
              <Mail />
            </span>
            <strong>Email</strong>
            <p>support@smartcampus.edu</p>
          </article>

          <article className="landing-contact-card">
            <span className="landing-card-accent" aria-hidden="true">
              <Phone />
            </span>
            <strong>Phone</strong>
            <p>+94 11 234 5678</p>
          </article>

          <article className="landing-contact-card">
            <span className="landing-card-accent" aria-hidden="true">
              <Building2 />
            </span>
            <strong>Office</strong>
            <p>Campus IT Services Center, Operations Wing</p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default PublicLandingPage;
