import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const heroSlides = [
  {
    headingLines: ["One Platform to Manage", "Campus Services", "Bookings and Support."],
    description:
      "Manage campus services, reservations, and support requests through one secure and streamlined platform.",
  },
  {
    headingLines: ["Simplify Campus", "Services, Bookings", "and Requests."],
    description:
      "Coordinate reservations, service access, and request workflows through one connected campus experience.",
  },
  {
    headingLines: ["Smart Campus", "Operations in", "One Place."],
    description:
      "Keep bookings, maintenance updates, and campus support operations organized inside a single platform.",
  },
];

const HERO_HEADING_ROTATION_MS = 4200;
const HERO_HEADING_TRANSITION_MS = 700;
const heroSizingSlide = heroSlides.reduce((tallestSlide, currentSlide) => {
  const tallestScore =
    tallestSlide.headingLines.join("").length + tallestSlide.description.length;
  const currentScore =
    currentSlide.headingLines.join("").length + currentSlide.description.length;

  return currentScore > tallestScore ? currentSlide : tallestSlide;
}, heroSlides[0]);

function PublicLandingPage() {
  const location = useLocation();
  const [activeHeadingIndex, setActiveHeadingIndex] = useState(0);
  const [previousHeadingIndex, setPreviousHeadingIndex] = useState(null);

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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveHeadingIndex((currentIndex) => {
        setPreviousHeadingIndex(currentIndex);
        return (currentIndex + 1) % heroSlides.length;
      });
    }, HERO_HEADING_ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (previousHeadingIndex === null) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setPreviousHeadingIndex(null);
    }, HERO_HEADING_TRANSITION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [previousHeadingIndex]);

  return (
    <div className="landing-page">
      <section className="landing-hero" id="home">
        <div className="landing-hero-copy">
          <span className="landing-kicker">Smart Campus Operations Hub</span>
          <h1 className="landing-title-stage" aria-live="polite">
            <span aria-hidden="true" className="landing-title-sizer">
              <span className="landing-title-stack">
                <span className="landing-title-line landing-title-line-primary">
                  {heroSizingSlide.headingLines[0]}
                </span>
                <span className="landing-title-line landing-title-line-primary">
                  {heroSizingSlide.headingLines[1]}
                </span>
                <span className="landing-title-line landing-title-line-secondary">
                  {heroSizingSlide.headingLines[2]}
                </span>
              </span>
              <span className="landing-slide-description">
                {heroSizingSlide.description}
              </span>
            </span>

            {heroSlides.map((slide, index) => {
              const slideState =
                index === activeHeadingIndex
                  ? "is-active"
                  : index === previousHeadingIndex
                    ? "is-previous"
                    : "";

              return (
                <span
                  key={slide.headingLines.join("-")}
                  aria-hidden={index !== activeHeadingIndex}
                  className={`landing-title-slide ${slideState}`.trim()}
                >
                  <span className="landing-title-stack">
                    <span className="landing-title-line landing-title-line-primary">
                      {slide.headingLines[0]}
                    </span>
                    <span className="landing-title-line landing-title-line-primary">
                      {slide.headingLines[1]}
                    </span>
                    <span className="landing-title-line landing-title-line-secondary">
                      {slide.headingLines[2]}
                    </span>
                  </span>
                  <span className="landing-slide-description">{slide.description}</span>
                </span>
              );
            })}
          </h1>

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
