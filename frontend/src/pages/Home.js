import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Home.css';

const services = [
  {
    title: 'Primary Care',
    copy: 'Routine consultations, preventive checkups, and long-term health planning for every age group.'
  },
  {
    title: 'Specialist Clinics',
    copy: 'Coordinated access to cardiology, orthopedics, pediatrics, dermatology, and internal medicine.'
  },
  {
    title: 'Digital Appointments',
    copy: 'Book visits, track schedules, and manage care updates through a connected hospital portal.'
  }
];

const metrics = [
  { value: '24/7', label: 'Emergency support' },
  { value: '35+', label: 'Clinical departments' },
  { value: '120K', label: 'Patients served yearly' }
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
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
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
                <div className="home-service-icon" aria-hidden="true">+</div>
                <h3>{service.title}</h3>
                <p>{service.copy}</p>
              </article>
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
    </div>
  );
};

export default Home;
