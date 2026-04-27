import React, { useState, useEffect, useContext } from 'react';
import { doctorService, appointmentService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const PatientDashboard = () => {
  const { user } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [booking, setBooking] = useState({ date: '', time: '' });
  const [rescheduleModal, setRescheduleModal] = useState({ appointment: null, date: '', time: '' });
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [doctorsRes, appointmentsRes] = await Promise.all([
        doctorService.getAll(),
        appointmentService.getAll()
      ]);
      
      const doctorsData = doctorsRes.data;
      setDoctors(doctorsData);
      setAppointments(appointmentsRes.data);
      
      const schedulesMap = {};
      for (const doctor of doctorsData) {
        try {
          const scheduleRes = await doctorService.getSchedule(doctor._id);
          schedulesMap[doctor._id] = scheduleRes.data;
        } catch (err) {
          schedulesMap[doctor._id] = { schedule: [] };
        }
      }
      setDoctorSchedules(schedulesMap);
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

  const isDoctorAvailableToday = (doctorId) => {
    const docSchedule = doctorSchedules[doctorId];
    if (!docSchedule?.schedule || docSchedule.schedule.length === 0) return false;
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return docSchedule.schedule.some(slot => slot.day === today);
  };

  const getSmartTimeSlots = (selectedDate) => {
    if (!selectedDate || !schedule?.schedule) return [];
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDay = days[new Date(selectedDate).getDay()];
    
    const daySchedule = schedule.schedule.find(slot => slot.day === selectedDay);
    if (!daySchedule) return [];
    
    const slots = [];
    const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
    const [endHour, endMin] = daySchedule.endTime.split(':').map(Number);
    
    let currentTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    while (currentTime < endTime) {
      const hours = Math.floor(currentTime / 60);
      const mins = currentTime % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
      currentTime += 15;
    }
    
    return slots;
  };

  const getBookedSlots = (doctorId, selectedDate) => {
    if (!selectedDate || !doctorId) return [];
    
    const dateStr = new Date(selectedDate).toISOString().split('T')[0];
    
    return appointments
      .filter(apt => {
        const aptDoctorId = apt.doctor?._id || apt.doctor;
        const aptDate = new Date(apt.date).toISOString().split('T')[0];
        return aptDoctorId === doctorId && 
               aptDate === dateStr && 
               apt.status !== 'cancelled';
      })
      .map(apt => apt.time);
  };

  const handleViewSchedule = async (doctorId) => {
    try {
      const response = await doctorService.getSchedule(doctorId);
      setSchedule(response.data);
      setSelectedDoctor(doctorId);
      setBooking({ date: '', time: '' });
    } catch (err) {
      showNotification('No schedule available for this doctor', 'error');
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      await appointmentService.book({
        doctorId: selectedDoctor,
        date: booking.date,
        time: booking.time
      });
      setSelectedDoctor(null);
      setSchedule(null);
      setBooking({ date: '', time: '' });
      loadData();
      showNotification('Appointment booked successfully!');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to book appointment', 'error');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentService.cancel(appointmentId);
      loadData();
      showNotification('Appointment cancelled');
    } catch (err) {
      showNotification('Failed to cancel appointment', 'error');
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await appointmentService.update(rescheduleModal.appointment._id, {
        date: rescheduleModal.date,
        time: rescheduleModal.time,
        status: 'pending'
      });
      setRescheduleModal({ appointment: null, date: '', time: '' });
      loadData();
      showNotification('Appointment rescheduled successfully! Waiting for confirmation.');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to reschedule', 'error');
    }
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d._id === doctorId);
    return doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor';
  };

  const myAppointments = appointments.filter(a => a.patient?._id === user?._id || a.patient === user?._id);
  
  const today = new Date().toISOString().split('T')[0];
  
  const upcomingAppointments = myAppointments.filter(apt => {
    const aptDate = new Date(apt.date).toISOString().split('T')[0];
    return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'complete';
  });
  
  const pastAppointments = myAppointments.filter(apt => {
    const aptDate = new Date(apt.date).toISOString().split('T')[0];
    return aptDate < today || apt.status === 'cancelled' || apt.status === 'complete';
  });

  const displayAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  const availableSlots = getSmartTimeSlots(booking.date);
  const bookedSlots = getBookedSlots(selectedDoctor, booking.date);

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
          <h1 className="section-title">Patient Dashboard</h1>
          <p className="section-subtitle">Welcome back, {user?.firstName}</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{upcomingAppointments.length}</span>
            <span className="stat-label">Upcoming</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{pastAppointments.length}</span>
            <span className="stat-label">Past</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="section-title-sm">Available Doctors</h2>
        <div className="grid grid-3">
          {doctors.map(doctor => {
            const isAvailableToday = isDoctorAvailableToday(doctor._id);
            return (
              <div key={doctor._id} className="card doctor-card">
                <div className="doctor-avatar">
                  {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                </div>
                <h3 className="doctor-name">Dr. {doctor.firstName} {doctor.lastName}</h3>
                <p className="doctor-specialization">{doctor.specialization || 'General Medicine'}</p>
                <div className="availability-badge">
                  {isAvailableToday ? (
                    <span className="available-today">Available Today</span>
                  ) : (
                    <span className="not-available">Not Available Today</span>
                  )}
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleViewSchedule(doctor._id)}
                >
                  Book Appointment
                </button>
              </div>
            );
          })}
          {doctors.length === 0 && (
            <div className="empty-state">
              <p>No doctors available</p>
            </div>
          )}
        </div>
      </div>

      {schedule && (
        <div className="modal-overlay" onClick={() => { setSelectedDoctor(null); setSchedule(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Book Appointment</h3>
            
            {schedule.schedule?.length > 0 ? (
              <>
                <div className="schedule-section">
                  <p className="schedule-label">Doctor's Weekly Schedule</p>
                  <div className="schedule-grid">
                    {schedule.schedule.map((slot, index) => (
                      <div key={index} className="schedule-chip">
                        <span>{slot.day}</span>
                        <small>{slot.startTime} - {slot.endTime}</small>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleBookAppointment} className="booking-form">
                  <div className="input-group">
                    <label>Select Date</label>
                    <input
                      type="date"
                      value={booking.date}
                      onChange={(e) => setBooking({ ...booking, date: e.target.value, time: '' })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  
                  {booking.date && (
                    <div className="input-group">
                      <label>Select Time (15 min intervals)</label>
                      {availableSlots.length > 0 ? (
                        <div className="time-slots-grid">
                          {availableSlots.map(time => {
                            const isBooked = bookedSlots.includes(time);
                            return (
                              <button
                                key={time}
                                type="button"
                                className={`time-slot ${booking.time === time ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                                onClick={() => !isBooked && setBooking({ ...booking, time })}
                                disabled={isBooked}
                              >
                                {isBooked ? 'Booked' : time}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="no-slots">No available slots for this day. Select another date.</p>
                      )}
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={!booking.date || !booking.time}
                  >
                    Confirm Appointment
                  </button>
                </form>
              </>
            ) : (
              <p className="no-schedule">This doctor has not set their schedule yet. Please check back later.</p>
            )}
            
            <button className="btn btn-outline" onClick={() => { setSelectedDoctor(null); setSchedule(null); }}>
              Close
            </button>
          </div>
        </div>
      )}

      {rescheduleModal.appointment && (
        <div className="modal-overlay" onClick={() => setRescheduleModal({ appointment: null, date: '', time: '' })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Reschedule Appointment</h3>
            <p className="reschedule-info">
              Current: {new Date(rescheduleModal.appointment.date).toLocaleDateString()} at {rescheduleModal.appointment.time}
            </p>
            
            <form onSubmit={handleReschedule} className="booking-form">
              <div className="input-group">
                <label>Select New Date</label>
                <input
                  type="date"
                  value={rescheduleModal.date}
                  onChange={(e) => setRescheduleModal({ ...rescheduleModal, date: e.target.value, time: '' })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <p className="schedule-note">Note: After rescheduling, appointment will go back to pending status for doctor's approval.</p>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!rescheduleModal.date}
              >
                Reschedule
              </button>
            </form>
            
            <button className="btn btn-outline" onClick={() => setRescheduleModal({ appointment: null, date: '', time: '' })}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <div className="section-header-tabs">
          <h2 className="section-title-sm">My Appointments</h2>
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming ({upcomingAppointments.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past ({pastAppointments.length})
            </button>
          </div>
        </div>

        <div className="grid grid-2">
          {displayAppointments.map(apt => (
            <div key={apt._id} className="card appointment-card">
              <div className="appointment-header">
                <span className={`badge badge-${apt.status}`}>
                  {apt.status}
                </span>
                <span className="appointment-date">
                  {new Date(apt.date).toLocaleDateString()}
                </span>
              </div>
              <div className="appointment-details">
                <p className="doctor-name">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M19 14c1.49-1.46 3-3.89 3-5.71c0-2.1-1.34-3.68-3.03-4.18-.58-.17-1.18-.28-1.81-.38l-.61-.11c-.65-.09-1.31-.09-1.97-.09-.65 0-1.31 0-1.96.09l-.6.11c-.63.1-1.23.21-1.82.38C6.34 4.61 5 6.19 5 8.29c0 1.82 1.51 4.25 3 5.71" /></svg>
                  {getDoctorName(apt.doctor?._id || apt.doctor)}
                </p>
                <p className="appointment-time">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                  {apt.time}
                </p>
              </div>
              {apt.status !== 'cancelled' && apt.status !== 'complete' && apt.status !== 'confirmed' && (
                <div className="appointment-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setRescheduleModal({ appointment: apt, date: '', time: '' })}
                  >
                    Reschedule
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancelAppointment(apt._id)}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {apt.status === 'confirmed' && (
                <div className="appointment-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setRescheduleModal({ appointment: apt, date: '', time: '' })}
                  >
                    Reschedule
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancelAppointment(apt._id)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
          {displayAppointments.length === 0 && (
            <div className="empty-state card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 015.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p>{activeTab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}</p>
              <span>{activeTab === 'upcoming' ? 'Book an appointment with a doctor above' : 'Your appointment history will appear here'}</span>
            </div>
          )}
        </div>
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
          gap: 16px;
        }

        .stat-card {
          background: #fff;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          text-align: center;
          min-width: 100px;
        }

        .stat-number {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: #2563eb;
        }

        .stat-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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

        .doctor-card {
          text-align: center;
          padding: 24px;
        }

        .doctor-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 600;
          margin: 0 auto 16px;
        }

        .doctor-name {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .doctor-specialization {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .availability-badge {
          margin-bottom: 16px;
        }

        .available-today {
          display: inline-block;
          background: #d1fae5;
          color: #065f46;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .not-available {
          display: inline-block;
          background: #f1f5f9;
          color: #64748b;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 13px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .modal {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #1e293b;
        }

        .schedule-section {
          margin-bottom: 20px;
        }

        .schedule-label {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .schedule-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
        }

        .schedule-chip {
          background: #f1f5f9;
          padding: 8px 12px;
          border-radius: 8px;
          text-align: center;
        }

        .schedule-chip span {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #1e293b;
        }

        .schedule-chip small {
          font-size: 11px;
          color: #64748b;
        }

        .booking-form {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          max-height: 150px;
          overflow-y: auto;
        }

        .time-slot {
          padding: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: #fff;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .time-slot:hover {
          border-color: #2563eb;
          color: #2563eb;
        }

        .time-slot.selected {
          background: #2563eb;
          border-color: #2563eb;
          color: white;
        }

        .time-slot.booked {
          background: #f1f5f9;
          border-color: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
          text-decoration: line-through;
        }

        .time-slot.booked:hover {
          border-color: #e2e8f0;
          color: #94a3b8;
        }

        .no-slots {
          color: #ef4444;
          font-size: 14px;
          text-align: center;
          padding: 12px;
          background: #fee2e2;
          border-radius: 8px;
        }

        .no-schedule {
          color: #64748b;
          text-align: center;
          padding: 20px;
        }

        .schedule-note {
          font-size: 12px;
          color: #f59e0b;
          background: #fef3c7;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .reschedule-info {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 20px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .appointment-card {
          padding: 20px;
        }

        .appointment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .appointment-date {
          font-size: 14px;
          color: #64748b;
        }

        .appointment-details {
          margin-bottom: 16px;
        }

        .appointment-details p {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #1e293b;
        }

        .appointment-details svg {
          width: 18px;
          height: 18px;
          color: #64748b;
        }

        .appointment-actions {
          display: flex;
          gap: 12px;
        }

        .appointment-actions .btn {
          flex: 1;
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

          .time-slots-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .tab-buttons {
            width: 100%;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientDashboard;