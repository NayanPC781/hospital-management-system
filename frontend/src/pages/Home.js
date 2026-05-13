import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Home.css';

const HeartIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 42C24 42 6 30 6 18C6 12 11 8 16 8C19 8 22 10 24 13C26 10 29 8 32 8C37 8 42 12 42 18C42 30 24 42 24 42Z" fill="currentColor" opacity="0.15"/>
    <path d="M24 42C24 42 6 30 6 18C6 12 11 8 16 8C19 8 22 10 24 13C26 10 29 8 32 8C37 8 42 12 42 18C42 30 24 42 24 42Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BrainIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 6C18 6 14 10 14 16C14 18 15 20 16 21C13 22 11 25 11 28C11 31 13 34 16 35C15 36 14 38 14 40C14 42 16 44 18 44C21 44 23 42 24 40C25 42 27 44 30 44C32 44 34 42 34 40C34 38 33 36 32 35C35 34 37 31 37 28C37 25 35 22 32 21C33 20 34 18 34 16C34 10 30 6 24 6Z" fill="currentColor" opacity="0.15"/>
    <path d="M24 6C18 6 14 10 14 16C14 18 15 20 16 21M24 6C30 6 34 10 34 16C34 18 33 20 32 21M24 6V44M16 21C13 22 11 25 11 28C11 31 13 34 16 35M16 21H32M32 21C35 22 37 25 37 28C37 31 35 34 32 35M16 35C15 36 14 38 14 40C14 42 16 44 18 44C21 44 23 42 24 40M16 35H32M32 35C33 36 34 38 34 40C34 42 32 44 30 44C27 44 25 42 24 40" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

const BoneIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 26C18 22 20 14 18 10C16 6 12 6 10 8C8 10 6 14 8 18C10 22 12 24 14 26Z" fill="currentColor" opacity="0.15"/>
    <path d="M34 22C30 26 28 34 30 38C32 42 36 42 38 40C40 38 42 34 40 30C38 26 36 24 34 22Z" fill="currentColor" opacity="0.15"/>
    <circle cx="14" cy="10" r="4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="34" cy="38" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 12L32 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 14L8 16C6 18 6 22 8 24C10 26 14 28 16 30L20 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M38 34L40 32C42 30 42 26 40 24C38 22 34 20 32 18L28 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SkinIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="14" width="32" height="24" rx="6" fill="currentColor" opacity="0.15"/>
    <rect x="8" y="14" width="32" height="24" rx="6" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="26" r="2" fill="currentColor" opacity="0.3"/>
    <circle cx="24" cy="22" r="1.5" fill="currentColor" opacity="0.3"/>
    <circle cx="30" cy="28" r="1.5" fill="currentColor" opacity="0.3"/>
    <path d="M14 38V42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M34 38V42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const EarIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 6C16 6 10 12 10 20V28C10 32 12 36 15 38C17 40 18 42 18 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24 6C28 6 32 8 34 12C36 16 36 20 34 24C32 28 28 30 26 32C24 34 24 36 24 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="24" cy="18" r="4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="24" cy="40" r="2" fill="currentColor"/>
  </svg>
);

const StethoscopeIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 10V22C16 28 20 34 26 34C32 34 36 28 36 22V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="16" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="36" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M36 22C36 28 32 34 26 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M26 34V38C26 42 22 44 18 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="18" cy="44" r="2" fill="currentColor"/>
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="36" height="32" rx="4" fill="currentColor" opacity="0.15"/>
    <rect x="6" y="10" width="36" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M6 18H42" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 6V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M32 6V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="18" cy="26" r="2" fill="currentColor"/>
    <circle cx="26" cy="26" r="2" fill="currentColor" opacity="0.5"/>
    <circle cx="34" cy="26" r="2" fill="currentColor" opacity="0.5"/>
    <circle cx="18" cy="34" r="2" fill="currentColor" opacity="0.5"/>
    <circle cx="26" cy="34" r="2" fill="currentColor" opacity="0.5"/>
  </svg>
);

const BuildingIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="10" width="18" height="32" rx="2" fill="currentColor" opacity="0.1"/>
    <rect x="8" y="10" width="18" height="32" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="30" y="20" width="12" height="22" rx="2" fill="currentColor" opacity="0.1"/>
    <rect x="30" y="20" width="12" height="22" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M14 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 24H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 30H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M36 28H38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M36 34H38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const EmergencyIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.15"/>
    <rect x="14" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M22 10H26" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M24 8V12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M8 20H40V40C40 42 38 44 36 44H12C10 44 8 42 8 40V20Z" fill="currentColor" opacity="0.05"/>
    <path d="M8 20H40V40C40 42 38 44 36 44H12C10 44 8 42 8 40V20Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 28H40" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 44C24 44 38 30 38 18C38 10 32 4 24 4C16 4 10 10 10 18C10 30 24 44 24 44Z" fill="currentColor" opacity="0.15"/>
    <path d="M24 44C24 44 38 30 38 18C38 10 32 4 24 4C16 4 10 10 10 18C10 30 24 44 24 44Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="24" cy="18" r="6" stroke="currentColor" strokeWidth="2"/>
    <circle cx="24" cy="18" r="2" fill="currentColor"/>
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 34C40 36 38 42 34 42C30 42 22 38 16 32C10 26 6 18 6 14C6 10 12 8 14 8C15 8 16 8 17 9C18 10 22 16 22 17C22 18 21 19 20 20C19 21 19 21 20 22C21 23 25 27 26 28C27 29 27 29 28 28C29 27 30 26 31 26C32 26 38 30 39 31C40 32 40 33 40 34Z" fill="currentColor" opacity="0.15"/>
    <path d="M40 34C40 36 38 42 34 42C30 42 22 38 16 32C10 26 6 18 6 14C6 10 12 8 14 8C15 8 16 8 17 9C18 10 22 16 22 17C22 18 21 19 20 20C19 21 19 21 20 22C21 23 25 27 26 28C27 29 27 29 28 28C29 27 30 26 31 26C32 26 38 30 39 31C40 32 40 33 40 34Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="10" width="40" height="30" rx="4" fill="currentColor" opacity="0.1"/>
    <rect x="4" y="10" width="40" height="30" rx="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 14L24 28L44 14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="18" fill="currentColor" opacity="0.1"/>
    <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2"/>
    <path d="M24 12V24L30 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="24" cy="24" r="2" fill="currentColor"/>
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="18" cy="14" rx="6" ry="8" fill="currentColor" opacity="0.1"/>
    <ellipse cx="18" cy="14" rx="6" ry="8" stroke="currentColor" strokeWidth="2"/>
    <ellipse cx="34" cy="16" rx="5" ry="6" fill="currentColor" opacity="0.1"/>
    <ellipse cx="34" cy="16" rx="5" ry="6" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 42C4 34 10 28 18 28C26 28 32 34 32 42" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M24 38C24 32 28 28 34 28C40 28 44 32 44 38" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 4.00002C22 4.00002 21.3 6.10002 20 7.40002C21.6 17.4 10.6 24.7 2.00001 19C5.20001 19.2 8.00001 17.5 9.50001 15.5C6.50001 15.2 4.50001 13.5 4.00001 10.5C5.00001 10.8 6.00001 10.9 6.50001 10.5C3.50001 9.50002 2.70001 5.50002 4.50001 3.50002C7.00001 6.50002 10.5 8.50002 15 8.70002C14.5 6.00002 16 3.50002 18.5 3.00002C20 2.70002 21.5 3.50002 22 4.00002Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 9H2V21H6V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="4" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
  </svg>
);

const services = [
  {
    icon: StethoscopeIcon,
    title: 'Primary Care',
    copy: 'Routine consultations, preventive checkups, and long-term health planning for every age group.'
  },
  {
    icon: BuildingIcon,
    title: 'Specialist Clinics',
    copy: 'Coordinated access to cardiology, orthopedics, pediatrics, dermatology, and internal medicine.'
  },
  {
    icon: CalendarIcon,
    title: 'Digital Appointments',
    copy: 'Book visits, track schedules, and manage care updates through a connected hospital portal.'
  }
];

const specialities = [
  {
    icon: HeartIcon,
    title: 'Cardiology',
    description: 'Expert heart care including diagnostics, treatment, and prevention of cardiovascular diseases.'
  },
  {
    icon: BrainIcon,
    title: 'Neurology',
    description: 'Comprehensive care for brain, spinal cord, and nervous system disorders.'
  },
  {
    icon: BoneIcon,
    title: 'Orthopedic Surgery',
    description: 'Advanced surgical and non-surgical treatments for bone, joint, and musculoskeletal conditions.'
  },
  {
    icon: SkinIcon,
    title: 'Dermatology',
    description: 'Medical and cosmetic care for skin, hair, and nail conditions with modern treatments.'
  },
  {
    icon: EarIcon,
    title: 'ENT',
    description: 'Specialized care for ear, nose, and throat conditions including hearing and sinus issues.'
  }
];

const metrics = [
  { icon: EmergencyIcon, value: '24/7', label: 'Emergency support' },
  { icon: BuildingIcon, value: '35+', label: 'Clinical departments' },
  { icon: UsersIcon, value: '120K', label: 'Patients served yearly' }
];

const Home = () => {
  return (
    <div className="home-page">
      <Navbar />

      <main>
        <section className="home-hero">
          <div className="home-hero-inner">
            <div className="home-hero-copy">
              <span className="home-kicker">Modern hospital management</span>
              <h1>Professional care with simpler access for patients and teams.</h1>
              <p>
                A calm digital front door for appointments, doctors, patient records,
                and hospital operations, built around fast service and reliable care.
              </p>
              <div className="home-hero-actions">
                <Link to="/register" className="home-btn home-btn-primary">Create Account</Link>
                <Link to="/login" className="home-btn home-btn-secondary">Sign In</Link>
              </div>
            </div>

            <div className="home-hero-visual" aria-label="Hospital care overview">
              <div className="home-visual-header">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="home-visual-body">
                <div className="home-care-card home-care-card-main">
                  <div>
                    <small>Today</small>
                    <strong>Patient flow</strong>
                  </div>
                  <span>86%</span>
                </div>
                <div className="home-visual-grid">
                  <div>
                    <small>Doctors</small>
                    <strong>42 online</strong>
                  </div>
                  <div>
                    <small>Appointments</small>
                    <strong>128 booked</strong>
                  </div>
                  <div>
                    <small>Rooms</small>
                    <strong>18 ready</strong>
                  </div>
                  <div>
                    <small>Reports</small>
                    <strong>Live sync</strong>
                  </div>
                </div>
                <div className="home-pulse-row">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-metrics" aria-label="Hospital highlights">
          {metrics.map((metric) => (
            <div className="home-metric" key={metric.label}>
              <div className="home-metric-icon"><metric.icon /></div>
              <div className="home-metric-body">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="home-section">
          <div className="home-section-heading">
            <span className="home-kicker">Care services</span>
            <h2>Everything patients expect from a modern hospital.</h2>
          </div>
          <div className="home-service-grid">
            {services.map((service) => (
              <article className="home-service" key={service.title}>
                <div className="home-service-icon" aria-hidden="true">
                  <service.icon />
                </div>
                <h3>{service.title}</h3>
                <p>{service.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-specialities">
          <div className="home-section-heading">
            <span className="home-kicker">Our Specialities</span>
            <h2>Expert care across every major medical field.</h2>
            <p className="home-section-subtitle">
              Our team of experienced specialists provides world-class treatment
              across a wide range of medical disciplines.
            </p>
          </div>
          <div className="home-specialities-grid">
            {specialities.map((spec) => (
              <div className="home-speciality-card" key={spec.title}>
                <div className="home-speciality-icon"><spec.icon /></div>
                <h3>{spec.title}</h3>
                <p>{spec.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="home-cta">
          <div>
            <span className="home-kicker">Get started</span>
            <h2>Manage appointments and care records from one secure place.</h2>
          </div>
          <Link to="/register" className="home-btn home-btn-primary">Sign Up</Link>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-brand">
            <div className="home-footer-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.89 3-5.71c0-2.1-1.34-3.68-3.03-4.18c-.58-.17-1.18-.28-1.81-.38l-.61-.11c-.65-.09-1.31-.09-1.97-.09c-.65 0-1.31 0-1.96.09l-.6.11c-.63.1-1.23.21-1.82.38C6.34 4.61 5 6.19 5 8.29c0 1.82 1.51 4.25 3 5.71" />
                <path d="M12 22c4.97 0 9-3.31 9-7c0-2.69-1.86-4.89-4.45-5.71c-.59-.19-1.2-.3-1.83-.38l-.61-.11c-.66-.1-1.32-.1-1.98-.1s-1.32 0-1.98.1l-.61.11c-.63.1-1.24.2-1.83.38C6.86 10.11 5 12.31 5 15c0 3.69 4.03 7 9 7z" />
              </svg>
              <span>Hospital Management</span>
            </div>
            <p>
              Providing compassionate healthcare with modern technology.
              Your health is our priority.
            </p>
            <div className="home-footer-social">
              <a href="/" aria-label="Facebook" onClick={(e) => e.preventDefault()}><FacebookIcon /></a>
              <a href="/" aria-label="Twitter" onClick={(e) => e.preventDefault()}><TwitterIcon /></a>
              <a href="/" aria-label="LinkedIn" onClick={(e) => e.preventDefault()}><LinkedinIcon /></a>
              <a href="/" aria-label="Instagram" onClick={(e) => e.preventDefault()}><InstagramIcon /></a>
            </div>
          </div>
          <div className="home-footer-links">
            <div className="home-footer-col">
              <h4>Quick Links</h4>
              <a href="/">Home</a>
              <a href="/login">Sign In</a>
              <a href="/register">Register</a>
              <a href="/dashboard">Dashboard</a>
            </div>
            <div className="home-footer-col">
              <h4>Specialities</h4>
              <span>Cardiology</span>
              <span>Neurology</span>
              <span>Orthopedic Surgery</span>
              <span>Dermatology</span>
              <span>ENT</span>
            </div>
            <div className="home-footer-col">
              <h4>Contact</h4>
              <div className="home-footer-contact-item">
                <MapPinIcon />
                <span>123 Healthcare Ave, Medical District</span>
              </div>
              <div className="home-footer-contact-item">
                <PhoneIcon />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="home-footer-contact-item">
                <MailIcon />
                <span>contact@hospitalmgmt.com</span>
              </div>
              <div className="home-footer-contact-item">
                <ClockIcon />
                <span>24/7 Emergency Services</span>
              </div>
            </div>
          </div>
        </div>
        <div className="home-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Hospital Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
