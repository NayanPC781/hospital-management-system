import React, { useEffect, useMemo, useState, useContext, useCallback, useContext as useAuthContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useDragConstraints, useDrag } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { doctorService, appointmentService } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import FilterBar from '../components/ui/FilterBar';
import Skeleton, { SkeletonStat, SkeletonCard } from '../components/ui/Skeleton';
import BottomNavigation from '../components/layout/BottomNavigation';
import '../components/layout/BottomNavigation.css';
import './PatientMobile.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PatientDashboard = () => {
  const { user } = useAuthContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [doctors, setDoctors] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [booking, setBooking] = useState({ date: '', time: '' });
  const [doctorSearch, setDoctorSearch] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [rescheduleModal, setRescheduleModal] = useState({ appointment: null, date: '', time: '' });
  const [notification, setNotification] = useState(null);
  const [offline, setOffline] = useState(!navigator.onLine);

  const activeTab = searchParams.get('tab') === 'book' ? 'book' 
    : searchParams.get('tab') === 'history' ? 'history'
    : searchParams.get('tab') === 'profile' ? 'profile'
    : 'home';

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [doctorsRes, appointmentsRes] = await Promise.all([
        doctorService.getAllWithSchedules(),
        appointmentService.getAll()
      ]);
      const doctorsData = doctorsRes.data;
      setDoctors(doctorsData);
      setAppointments(appointmentsRes.data);
      setDoctorSchedules(
        doctorsData.reduce((acc, doctor) => {
          acc[doctor._id] = { schedule: doctor.schedule || [] };
          return acc;
        }, {})
      );
      setOffline(false);
    } catch (err) {
      if (!navigator.onLine) setOffline(true);
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('online', () => loadData());
    window.addEventListener('offline', () => setOffline(true));
    return () => {
      window.removeEventListener('online', () => loadData());
      window.removeEventListener('offline', () => setOffline(true));
    };
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const myAppointments = useMemo(
    () => appointments.filter((a) => a.patient?._id === user?._id || a.patient === user?._id),
    [appointments, user?._id]
  );

  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = useMemo(
    () => myAppointments
      .filter((apt) => {
        const aptDate = new Date(apt.date).toISOString().split('T')[0];
        return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'complete';
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [myAppointments, today]
  );
  const pastAppointments = useMemo(
    () => myAppointments
      .filter((apt) => {
        const aptDate = new Date(apt.date).toISOString().split('T')[0];
        return aptDate < today || apt.status === 'cancelled' || apt.status === 'complete';
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [myAppointments, today]
  );
  const nextAppointment = upcomingAppointments[0];
  const pendingCount = upcomingAppointments.filter((a) => a.status === 'pending').length;

  const specializations = useMemo(
    () => Array.from(new Set(doctors.map((d) => d.specialization || 'General Medicine'))),
    [doctors]
  );

  const filteredDoctors = useMemo(
    () => doctors.filter((doctor) => {
      const fullName = `Dr. ${doctor.firstName} ${doctor.lastName}`.toLowerCase();
      const specialization = (doctor.specialization || 'General Medicine').toLowerCase();
      const matchSearch = !doctorSearch || fullName.includes(doctorSearch.toLowerCase()) || specialization.includes(doctorSearch.toLowerCase());
      const matchSpecialization = !specializationFilter || specialization === specializationFilter.toLowerCase();
      return matchSearch && matchSpecialization;
    }),
    [doctors, doctorSearch, specializationFilter]
  );

  const getSmartTimeSlots = (scheduleData, selectedDate) => {
    if (!selectedDate || !scheduleData?.schedule) return [];
    const selectedDay = DAYS[new Date(selectedDate).getDay()];
    const daySchedules = scheduleData.schedule
      .filter((slot) => slot.day === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    if (!daySchedules.length) return [];

    const slotSet = new Set();
    daySchedules.forEach((daySchedule) => {
      const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
      const [endHour, endMin] = daySchedule.endTime.split(':').map(Number);
      let currentTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      while (currentTime < endTime) {
        const hours = Math.floor(currentTime / 60);
        const mins = currentTime % 60;
        slotSet.add(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
        currentTime += 15;
      }
    });
    return Array.from(slotSet).sort();
  };

  const getBookedSlots = (doctorId, selectedDate, excludeAppointmentId = null) => {
    if (!selectedDate || !doctorId) return [];
    const dateStr = new Date(selectedDate).toISOString().split('T')[0];
    return appointments
      .filter((apt) => {
        const aptDoctorId = apt.doctor?._id || apt.doctor;
        const aptDate = new Date(apt.date).toISOString().split('T')[0];
        return String(aptDoctorId) === String(doctorId)
          && apt._id !== excludeAppointmentId
          && aptDate === dateStr
          && apt.status !== 'cancelled';
      })
      .map((apt) => apt.time);
  };

  const selectedSchedule = selectedDoctor ? doctorSchedules[selectedDoctor] : null;
  const availableSlots = getSmartTimeSlots(selectedSchedule, booking.date);
  const bookedSlots = getBookedSlots(selectedDoctor, booking.date);

  const rescheduleDoctorId = rescheduleModal.appointment ? (rescheduleModal.appointment.doctor?._id || rescheduleModal.appointment.doctor) : null;
  const rescheduleSchedule = rescheduleDoctorId ? doctorSchedules[rescheduleDoctorId] : null;
  const rescheduleSlots = getSmartTimeSlots(rescheduleSchedule, rescheduleModal.date);
  const rescheduleBookedSlots = getBookedSlots(rescheduleDoctorId, rescheduleModal.date, rescheduleModal.appointment?._id);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(30);
    try {
      await appointmentService.book({ doctorId: selectedDoctor, date: booking.date, time: booking.time });
      showNotification('Appointment booked!');
      setSelectedDoctor(null);
      setBooking({ date: '', time: '' });
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to book', 'error');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Cancel this appointment?')) return;
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    try {
      await appointmentService.cancel(appointmentId);
      showNotification('Appointment cancelled');
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to cancel', 'error');
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await appointmentService.reschedule(rescheduleModal.appointment._id, {
        date: rescheduleModal.date,
        time: rescheduleModal.time
      });
      showNotification('Rescheduled successfully');
      setRescheduleModal({ appointment: null, date: '', time: '' });
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to reschedule', 'error');
    }
  };

  const handleSwipeDelete = (appointmentId) => {
    handleCancelAppointment(appointmentId);
  };

  const navigateTo = (tab) => {
    setSearchParams({ tab });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  if (loading) {
    return (
      <div className="patient-mobile">
        <div className="patient-mobile-content">
          <div className="patient-mobile-header">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <Skeleton width="60%" height="28px" />
              <Skeleton width="40%" height="16px" />
            </motion.div>
          </div>
          <div className="patient-mobile-stats">
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </div>
          <div className="patient-mobile-cards">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="patient-mobile">
      {offline && (
        <div className="offline-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 7.72a7 7 0 0 1-9.88 0" />
            <path d="M22 16.8A10 10 0 0 1 7.2 2.8" />
          </svg>
          You're offline - showing cached data
        </div>
      )}

      <AnimatePresence mode="wait">
        {notification && (
          <motion.div
            className={`toast toast-${notification.type}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{ bottom: 'calc(var(--bottom-nav-height) + 16px)' }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="patient-mobile-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <motion.div 
            className="patient-mobile-home"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="patient-mobile-header">
              <h1>Welcome back!</h1>
              <p>{user?.firstName} - Book and manage your appointments</p>
            </div>

            <motion.div 
              className="patient-mobile-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StatCard label="Upcoming" value={upcomingAppointments.length} tone="primary" />
              <StatCard label="Past" value={pastAppointments.length} />
              <StatCard label="Pending" value={pendingCount} tone="warning" />
            </motion.div>

            <motion.div 
              className="patient-mobile-next-apt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3>Next Appointment</h3>
              {nextAppointment ? (
                <div className="next-apt-card">
                  <div className="next-apt-info">
                    <span className="next-apt-date">
                      {new Date(nextAppointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="next-apt-time">{nextAppointment.time}</span>
                    <span className="next-apt-doctor">
                      with {nextAppointment.doctor ? `Dr. ${nextAppointment.doctor.firstName}` : 'Doctor'}
                    </span>
                  </div>
                  <StatusBadge status={nextAppointment.status} />
                </div>
              ) : (
                <p className="no-apt">No upcoming appointments</p>
              )}
            </motion.div>

            <motion.button
              className="fab"
              onClick={() => navigateTo('book')}
              whileTap={{ scale: 0.95 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Book Appointment
            </motion.button>
          </motion.div>
        )}

        {/* BOOK TAB */}
        {activeTab === 'book' && (
          <motion.div 
            className="patient-mobile-book"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PageHeader title="Find a Doctor" subtitle="Select a doctor and pick a time slot" />

            <FilterBar className="mobile-filter">
              <input
                type="text"
                placeholder="Search doctor..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
              />
              <select value={specializationFilter} onChange={(e) => setSpecializationFilter(e.target.value)}>
                <option value="">All</option>
                {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FilterBar>

            <div className="doctor-list">
              {filteredDoctors.map((doctor, index) => (
                <motion.div
                  key={doctor._id}
                  className="doctor-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => { setSelectedDoctor(doctor._id); setBooking({ date: '', time: '' }); if (navigator.vibrate) navigator.vibrate(10); }}
                >
                  <div className="doctor-avatar">
                    {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                  </div>
                  <div className="doctor-info">
                    <h4>Dr. {doctor.firstName} {doctor.lastName}</h4>
                    <p>{doctor.specialization || 'General Medicine'}</p>
                  </div>
                  <span className="doctor-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </motion.div>
              ))}
              {filteredDoctors.length === 0 && (
                <EmptyState title="No doctors found" subtitle="Try changing your filters" />
              )}
            </div>
          </motion.div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <motion.div 
            className="patient-mobile-history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PageHeader title="My Appointments" subtitle="Track and manage your visits" />

            <div className="history-tabs">
              <button 
                className={`history-tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => {}}
              >
                Upcoming ({upcomingAppointments.length})
              </button>
              <button 
                className={`history-tab ${activeTab === 'history' ? '' : ''}`}
                onClick={() => {}}
              >
                Past ({pastAppointments.length})
              </button>
            </div>

            <div className="appointment-list">
              {upcomingAppointments.map((apt, index) => (
                <motion.div
                  key={apt._id}
                  className="appointment-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <div className="apt-main" onClick={() => {}}>
                    <div className="apt-date-badge">
                      <span className="apt-day">{new Date(apt.date).getDate()}</span>
                      <span className="apt-month">{new Date(apt.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    </div>
                    <div className="apt-details">
                      <span className="apt-time">{apt.time}</span>
                      <span className="apt-doctor">
                        {apt.doctor ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}` : 'Doctor'}
                      </span>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <div className="apt-actions">
                      <button 
                        className="btn-outline-sm"
                        onClick={(e) => { e.stopPropagation(); setRescheduleModal({ appointment: apt, date: '', time: '' }); }}
                      >
                        Reschedule
                      </button>
                      <button 
                        className="btn-danger-sm"
                        onClick={(e) => { e.stopPropagation(); handleCancelAppointment(apt._id); }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
              {upcomingAppointments.length === 0 && (
                <EmptyState title="No appointments" subtitle="Book your first appointment" />
              )}
            </div>
          </motion.div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <motion.div 
            className="patient-mobile-profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="profile-header">
              <div className="profile-avatar">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <h2>{user?.firstName} {user?.lastName}</h2>
              <p>{user?.email}</p>
            </div>

            <div className="profile-menu">
              <button className="profile-menu-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Personal Information
              </button>
              <button className="profile-menu-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                </svg>
                Notifications
              </button>
              <button className="profile-menu-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </button>
              <button className="profile-menu-item logout" onClick={() => navigate('/login')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Booking Modal - Bottom Sheet */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div
            className="bottom-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDoctor(null)}
          >
            <motion.div
              className="bottom-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bottom-sheet-handle" />
              <h3>Book Appointment</h3>
              <form onSubmit={handleBookAppointment} className="booking-form">
                <div className="input-group">
                  <label>Select date</label>
                  <input 
                    type="date" 
                    value={booking.date} 
                    min={today} 
                    onChange={(e) => setBooking({ date: e.target.value, time: '' })} 
                    required 
                    className="mobile-date-input"
                  />
                </div>
                {booking.date && (
                  <div className="input-group">
                    <label>Available times</label>
                    <div className="time-slots-grid">
                      {availableSlots.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            className={`time-slot ${booking.time === slot ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                            onClick={() => { if (!isBooked) setBooking((prev) => ({ ...prev, time: slot })); if (navigator.vibrate) navigator.vibrate(10); }}
                            disabled={isBooked}
                          >
                            {isBooked ? 'Booked' : slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="bottom-sheet-actions">
                  <button type="button" className="btn-outline" onClick={() => setSelectedDoctor(null)}>Close</button>
                  <button type="submit" className="btn-primary" disabled={!booking.date || !booking.time}>Confirm Booking</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {rescheduleModal.appointment && (
          <motion.div
            className="bottom-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRescheduleModal({ appointment: null, date: '', time: '' })}
          >
            <motion.div
              className="bottom-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bottom-sheet-handle" />
              <h3>Reschedule</h3>
              <form onSubmit={handleReschedule} className="booking-form">
                <div className="input-group">
                  <label>New date</label>
                  <input 
                    type="date" 
                    value={rescheduleModal.date} 
                    min={today} 
                    onChange={(e) => setRescheduleModal((prev) => ({ ...prev, date: e.target.value, time: '' }))} 
                    required 
                    className="mobile-date-input"
                  />
                </div>
                {rescheduleModal.date && (
                  <div className="input-group">
                    <label>New time</label>
                    <div className="time-slots-grid">
                      {rescheduleSlots.map((slot) => {
                        const isBooked = rescheduleBookedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            className={`time-slot ${rescheduleModal.time === slot ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                            onClick={() => !isBooked && setRescheduleModal((prev) => ({ ...prev, time: slot }))}
                            disabled={isBooked}
                          >
                            {isBooked ? 'Booked' : slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="bottom-sheet-actions">
                  <button type="button" className="btn-outline" onClick={() => setRescheduleModal({ appointment: null, date: '', time: '' })}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={!rescheduleModal.date || !rescheduleModal.time}>Confirm</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavigation pendingCount={pendingCount} />
    </div>
  );
};

export default PatientDashboard;