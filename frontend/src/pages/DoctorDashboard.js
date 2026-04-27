import React, { useState, useEffect, useContext } from 'react';
import { appointmentService, doctorService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedAppointment, setExpandedAppointment] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appointmentsRes, scheduleRes] = await Promise.all([
        appointmentService.getAll(),
        doctorService.getSchedule(user._id)
      ]);
      setAppointments(appointmentsRes.data);
      setSchedule(scheduleRes.data);
    } catch (err) {
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await appointmentService.update(appointmentId, { status });
      loadData();
      showNotification(`Appointment ${status} successfully`);
    } catch (err) {
      showNotification('Failed to update appointment', 'error');
    }
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const isToday = (date) => {
    const appointmentDate = new Date(date).toISOString().split('T')[0];
    return appointmentDate === getTodayString();
  };

  const filteredAppointments = appointments.filter(apt => {
    if (activeTab === 'today') return isToday(apt.date);
    if (activeTab === 'pending') return apt.status === 'pending';
    if (activeTab === 'confirmed') return apt.status === 'confirmed';
    if (activeTab === 'completed') return apt.status === 'complete';
    return true;
  });

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const completedAppointments = appointments.filter(a => a.status === 'complete');
  const todayAppointments = appointments.filter(a => isToday(a.date));

  const toggleExpand = (appointmentId) => {
    setExpandedAppointment(expandedAppointment === appointmentId ? null : appointmentId);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {notification && (
        <div className={`toast toast-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="dashboard-header">
        <div>
          <h1 className="section-title">Doctor Dashboard</h1>
          <p className="section-subtitle">Welcome, Dr. {user?.firstName} {user?.lastName}</p>
          <p className="doctor-specialization">{user?.specialization || 'General Medicine'}</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{todayAppointments.length}</span>
            <span className="stat-label">Today</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{pendingAppointments.length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{confirmedAppointments.length}</span>
            <span className="stat-label">Confirmed</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{completedAppointments.length}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="section-title-sm">My Schedule</h2>
        <div className="card schedule-card">
          {schedule?.schedule && schedule.schedule.length > 0 ? (
            <div className="schedule-grid">
              {schedule.schedule.map((slot, index) => (
                <div key={index} className="schedule-item">
                  <span className="schedule-day">{slot.day}</span>
                  <span className="schedule-time">{slot.startTime} - {slot.endTime}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-schedule-text">No schedule set. Contact admin to set your schedule.</p>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header-tabs">
          <h2 className="section-title-sm">Appointments</h2>
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button 
              className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
              onClick={() => setActiveTab('today')}
            >
              Today
            </button>
            <button 
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending
            </button>
            <button 
              className={`tab-btn ${activeTab === 'confirmed' ? 'active' : ''}`}
              onClick={() => setActiveTab('confirmed')}
            >
              Confirmed
            </button>
            <button 
              className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        {filteredAppointments.length > 0 ? (
          <div className="appointment-list">
            {filteredAppointments.map(apt => (
              <div key={apt._id} className="card appointment-card">
                <div 
                  className="appointment-main clickable"
                  onClick={() => toggleExpand(apt._id)}
                >
                  <div className="patient-avatar">
                    {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                  </div>
                  <div className="appointment-info">
                    <div className="appointment-header-row">
                      <h3>{apt.patient?.firstName} {apt.patient?.lastName}</h3>
                      <span className={`badge badge-${apt.status}`}>
                        {apt.status}
                      </span>
                      {isToday(apt.date) && (
                        <span className="today-badge">Today</span>
                      )}
                    </div>
                    <div className="appointment-datetime">
                      <span>
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                        {new Date(apt.date).toLocaleDateString()}
                      </span>
                      <span>
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                        {apt.time}
                      </span>
                    </div>
                  </div>
                  <svg 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    className={`expand-icon ${expandedAppointment === apt._id ? 'expanded' : ''}`}
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>

                {expandedAppointment === apt._id && (
                  <div className="patient-details">
                    <h4>Patient Details</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Full Name</span>
                        <span className="detail-value">{apt.patient?.firstName} {apt.patient?.lastName}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{apt.patient?.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Appointment Date</span>
                        <span className="detail-value">{new Date(apt.date).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Appointment Time</span>
                        <span className="detail-value">{apt.time}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status</span>
                        <span className="detail-value">
                          <span className={`badge badge-${apt.status}`}>{apt.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {apt.status !== 'cancelled' && apt.status !== 'complete' && (
                  <div className="appointment-actions">
                    {apt.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={() => handleUpdateStatus(apt._id, 'confirmed')}
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Confirm
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpdateStatus(apt._id, 'complete')}
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Complete
                        </button>
                      </>
                    )}
                    {apt.status === 'confirmed' && (
                      <>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpdateStatus(apt._id, 'complete')}
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Mark Complete
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleUpdateStatus(apt._id, 'cancelled')}
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 015.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p>No appointments found</p>
            <span>
              {activeTab === 'today' && 'No appointments scheduled for today'}
              {activeTab === 'pending' && 'No pending appointments'}
              {activeTab === 'confirmed' && 'No confirmed appointments'}
              {activeTab === 'completed' && 'No completed appointments'}
              {activeTab === 'all' && 'No appointments yet'}
            </span>
          </div>
        )}
      </div>

      <style>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .header-stats {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .stat-card {
          background: #fff;
          padding: 12px 20px;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          text-align: center;
          min-width: 80px;
        }

        .stat-number {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: #2563eb;
        }

        .stat-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .doctor-specialization {
          color: #2563eb;
          font-size: 14px;
          font-weight: 500;
        }

        .dashboard-section {
          margin-bottom: 40px;
        }

        .section-header-tabs {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .section-title-sm {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
        }

        .tab-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tab-btn {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          background: #fff;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-btn:hover {
          border-color: #2563eb;
          color: #2563eb;
        }

        .tab-btn.active {
          background: #2563eb;
          border-color: #2563eb;
          color: white;
        }

        .schedule-card {
          padding: 20px;
        }

        .schedule-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .schedule-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f1f5f9;
          padding: 10px 16px;
          border-radius: 8px;
        }

        .schedule-day {
          font-weight: 600;
          color: #1e293b;
        }

        .schedule-time {
          color: #64748b;
          font-size: 14px;
        }

        .no-schedule-text {
          color: #94a3b8;
          font-size: 14px;
        }

        .today-badge {
          background: #fef3c7;
          color: #92400e;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          margin-left: 8px;
        }

        .appointment-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .appointment-card {
          padding: 0;
          overflow: hidden;
        }

        .appointment-main {
          display: flex;
          gap: 16px;
          align-items: center;
          padding: 20px;
        }

        .appointment-main.clickable {
          cursor: pointer;
        }

        .patient-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #34d399);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .appointment-info {
          flex: 1;
        }

        .appointment-header-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .appointment-header-row h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }

        .appointment-datetime {
          display: flex;
          gap: 16px;
        }

        .appointment-datetime span {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
        }

        .appointment-datetime svg {
          width: 14px;
          height: 14px;
        }

        .expand-icon {
          width: 20px;
          height: 20px;
          color: #94a3b8;
          transition: transform 0.2s ease;
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .patient-details {
          padding: 20px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          animation: fadeIn 0.2s ease;
        }

        .patient-details h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 12px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 14px;
          color: #1e293b;
          font-weight: 500;
        }

        .appointment-actions {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .appointment-actions .btn {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .appointment-actions svg {
          width: 16px;
          height: 16px;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 48px 24px;
        }

        .empty-state svg {
          width: 48px;
          height: 48px;
          color: #94a3b8;
          margin-bottom: 12px;
        }

        .empty-state p {
          font-size: 16px;
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .empty-state span {
          font-size: 14px;
          color: #64748b;
        }

        .spinner-large {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
          }

          .header-stats {
            width: 100%;
            justify-content: space-between;
          }

          .stat-card {
            flex: 1;
          }

          .section-header-tabs {
            flex-direction: column;
            align-items: flex-start;
          }

          .tab-buttons {
            width: 100%;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 8px;
          }

          .tab-btn {
            white-space: nowrap;
          }

          .appointment-main {
            flex-wrap: wrap;
          }

          .appointment-actions {
            flex-direction: column;
          }

          .appointment-actions .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default DoctorDashboard;