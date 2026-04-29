import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doctorService, appointmentService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import FilterBar from '../components/ui/FilterBar';
import './PatientDesktopDashboard.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PatientDesktopDashboard = () => {
  const { user } = React.useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [booking, setBooking] = useState({ date: '', time: '' });
  const bookSectionRef = useRef(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [rescheduleModal, setRescheduleModal] = useState({ appointment: null, date: '', time: '' });
  const [notification, setNotification] = useState(null);

  const activeTab = searchParams.get('tab') === 'history' ? 'history' : 'overview';
  const isBookTab = searchParams.get('tab') === 'book';

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
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
    } catch (err) {
      showNotification('Failed to load patient dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (isBookTab && !loading) {
      bookSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isBookTab, loading]);

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
    try {
      await appointmentService.book({ doctorId: selectedDoctor, date: booking.date, time: booking.time });
      showNotification('Appointment booked successfully');
      setSelectedDoctor(null);
      setBooking({ date: '', time: '' });
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to book appointment', 'error');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await appointmentService.cancel(appointmentId);
      showNotification('Appointment cancelled');
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to cancel appointment', 'error');
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await appointmentService.reschedule(rescheduleModal.appointment._id, {
        date: rescheduleModal.date,
        time: rescheduleModal.time
      });
      showNotification('Reschedule request submitted');
      setRescheduleModal({ appointment: null, date: '', time: '' });
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to reschedule', 'error');
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner-large" /></div>;
  }

  return (
    <div className="page-container patient-desktop">
      {notification && <div className={`toast toast-${notification.type}`}>{notification.message}</div>}

      <PageHeader
        title="Welcome back"
        subtitle="Book, manage, and track your appointments quickly."
        actions={(
          <button type="button" className="btn btn-primary" onClick={() => setSearchParams({ tab: 'book' })}>
            Book Appointment
          </button>
        )}
      />

      <div className="grid grid-3 ui-stats-row">
        <StatCard label="Upcoming" value={upcomingAppointments.length} tone="primary" />
        <StatCard label="Past" value={pastAppointments.length} />
        <StatCard label="Pending Approval" value={upcomingAppointments.filter((a) => a.status === 'pending').length} tone="warning" />
      </div>

      <div className="card ui-next-appointment">
        <h3>Next Appointment</h3>
        {nextAppointment ? (
          <div className="ui-next-appointment-body">
            <div>
              <p>{new Date(nextAppointment.date).toLocaleDateString()} at {nextAppointment.time}</p>
              <small>with {nextAppointment.doctor ? `Dr. ${nextAppointment.doctor.firstName} ${nextAppointment.doctor.lastName}` : 'Doctor unavailable'}</small>
            </div>
            <StatusBadge status={nextAppointment.status} />
          </div>
        ) : <p>No upcoming appointments</p>}
      </div>

      <PageHeader title="Find a Doctor" subtitle="Filter by name or specialization and pick a slot." />
      <section ref={bookSectionRef} className={`patient-book-section ${isBookTab ? 'is-active' : ''}`} aria-label="Book appointment">
        <FilterBar>
          <input
            type="text"
            placeholder="Search doctor or specialization"
            value={doctorSearch}
            onChange={(e) => setDoctorSearch(e.target.value)}
          />
          <select value={specializationFilter} onChange={(e) => setSpecializationFilter(e.target.value)}>
            <option value="">All specializations</option>
            {specializations.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </FilterBar>

        <div className="grid grid-3 patient-doctor-grid">
          {filteredDoctors.map((doctor) => (
            <div key={doctor._id} className="card ui-doctor-card">
              <h4>Dr. {doctor.firstName} {doctor.lastName}</h4>
              <p>{doctor.specialization || 'General Medicine'}</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => { setSelectedDoctor(doctor._id); setBooking({ date: '', time: '' }); }}>
                Select Slots
              </button>
            </div>
          ))}
          {filteredDoctors.length === 0 && <EmptyState title="No matching doctors" subtitle="Try changing filters." />}
        </div>
      </section>

      <PageHeader
        title="My Appointments"
        subtitle="Track status and manage schedule."
        actions={(
          <div className="ui-inline-tabs">
            <button type="button" className={`btn btn-outline ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => {}}>Upcoming</button>
            <button type="button" className={`btn btn-outline ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'history' })}>Past</button>
          </div>
        )}
      />

      <div className="grid grid-2">
        {(activeTab === 'history' ? pastAppointments : upcomingAppointments).map((apt) => (
          <div key={apt._id} className="card">
            <div className="ui-appointment-row">
              <div>
                <p>{new Date(apt.date).toLocaleDateString()} at {apt.time}</p>
                <small>{apt.doctor ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}` : 'Doctor unavailable'}</small>
              </div>
              <StatusBadge status={apt.status} />
            </div>
            {(apt.status === 'pending' || apt.status === 'confirmed') && (
              <div className="ui-appointment-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setRescheduleModal({ appointment: apt, date: '', time: '' })}>Reschedule</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleCancelAppointment(apt._id)}>Cancel</button>
              </div>
            )}
          </div>
        ))}
        {(activeTab === 'history' ? pastAppointments : upcomingAppointments).length === 0 && (
          <EmptyState title={activeTab === 'history' ? 'No past appointments' : 'No upcoming appointments'} />
        )}
      </div>

      {selectedDoctor && (
        <div className="modal-overlay" onClick={() => setSelectedDoctor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Book Appointment</h3>
            <form onSubmit={handleBookAppointment} className="booking-form">
              <div className="input-group">
                <label>Select date</label>
                <input type="date" value={booking.date} min={today} onChange={(e) => setBooking({ date: e.target.value, time: '' })} required />
              </div>
              {booking.date && (
                <div className="input-group">
                  <label>Select time</label>
                  <div className="time-slots-grid">
                    {availableSlots.map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          className={`time-slot ${booking.time === slot ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                          onClick={() => !isBooked && setBooking((prev) => ({ ...prev, time: slot }))}
                          disabled={isBooked}
                        >
                          {isBooked ? 'Booked' : slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="ui-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setSelectedDoctor(null)}>Close</button>
                <button type="submit" className="btn btn-success" disabled={!booking.date || !booking.time}>Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rescheduleModal.appointment && (
        <div className="modal-overlay" onClick={() => setRescheduleModal({ appointment: null, date: '', time: '' })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Reschedule Appointment</h3>
            <form onSubmit={handleReschedule} className="booking-form">
              <div className="input-group">
                <label>Select new date</label>
                <input type="date" value={rescheduleModal.date} min={today} onChange={(e) => setRescheduleModal((prev) => ({ ...prev, date: e.target.value, time: '' }))} required />
              </div>
              {rescheduleModal.date && (
                <div className="input-group">
                  <label>Select new time</label>
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
              <div className="ui-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setRescheduleModal({ appointment: null, date: '', time: '' })}>Close</button>
                <button type="submit" className="btn btn-primary" disabled={!rescheduleModal.date || !rescheduleModal.time}>Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDesktopDashboard;
