import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { appointmentService, doctorService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import DetailDrawer from '../components/ui/DetailDrawer';

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const activeTab = searchParams.get('tab') || 'today';

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [appointmentsRes, scheduleRes] = await Promise.all([
        appointmentService.getAll(),
        doctorService.getSchedule(user._id)
      ]);
      setAppointments(appointmentsRes.data);
      setSchedule(scheduleRes.data);
    } catch (err) {
      showNotification('Failed to load doctor workspace', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppointments = useMemo(() => appointments.filter((apt) => {
    const aptDate = new Date(apt.date).toISOString().split('T')[0];
    if (activeTab === 'today') return aptDate === todayStr;
    if (activeTab === 'pending') return apt.status === 'pending';
    if (activeTab === 'completed') return apt.status === 'complete';
    return true;
  }).sort((a, b) => {
    const daySort = new Date(a.date) - new Date(b.date);
    if (daySort !== 0) return daySort;
    return a.time.localeCompare(b.time);
  }), [appointments, activeTab, todayStr]);

  const metrics = useMemo(() => ({
    today: appointments.filter((a) => new Date(a.date).toISOString().split('T')[0] === todayStr).length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'complete').length
  }), [appointments, todayStr]);

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await appointmentService.updateStatus(appointmentId, status);
      showNotification(`Appointment ${status}`);
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner-large" /></div>;

  return (
    <div className="page-container">
      {notification && <div className={`toast toast-${notification.type}`}>{notification.message}</div>}
      <PageHeader
        title={`Dr. ${user?.firstName} ${user?.lastName}`}
        subtitle={user?.specialization || 'General Medicine'}
        actions={(
          <div className="ui-inline-tabs">
            <button type="button" className={`btn btn-outline ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'today' })}>Today</button>
            <button type="button" className={`btn btn-outline ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'pending' })}>Pending</button>
            <button type="button" className={`btn btn-outline ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'completed' })}>Completed</button>
          </div>
        )}
      />

      <div className="grid grid-4 ui-stats-row">
        <StatCard label="Today" value={metrics.today} tone="primary" />
        <StatCard label="Pending" value={metrics.pending} tone="warning" />
        <StatCard label="Confirmed" value={metrics.confirmed} tone="success" />
        <StatCard label="Completed" value={metrics.completed} />
      </div>

      <div className="card">
        <h3>My Schedule</h3>
        {schedule?.schedule?.length ? (
          <div className="ui-chip-row">
            {schedule.schedule.map((slot, i) => (
              <span key={`${slot.day}-${i}`} className="ui-chip">{slot.day}: {slot.startTime} - {slot.endTime}</span>
            ))}
          </div>
        ) : <p>No schedule set by admin yet.</p>}
      </div>

      <PageHeader title="Agenda" subtitle="Click a patient row for full details." />
      <div className="ui-agenda-list">
        {filteredAppointments.map((apt) => (
          <div key={apt._id} className="card ui-agenda-row">
            <button type="button" className="ui-agenda-main" onClick={() => setSelectedAppointment(apt)}>
              <div>
                <h4>{apt.patient?.firstName} {apt.patient?.lastName}</h4>
                <p>{new Date(apt.date).toLocaleDateString()} at {apt.time}</p>
              </div>
              <StatusBadge status={apt.status} />
            </button>
            {(apt.status === 'pending' || apt.status === 'confirmed') && (
              <div className="ui-appointment-actions">
                {apt.status === 'pending' && (
                  <button type="button" className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(apt._id, 'confirmed')}>Confirm</button>
                )}
                {apt.status === 'pending' && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleUpdateStatus(apt._id, 'cancelled')}>Cancel</button>
                )}
                {apt.status === 'confirmed' && (
                  <>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(apt._id, 'complete')}>Complete</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleUpdateStatus(apt._id, 'cancelled')}>Cancel</button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
        {!filteredAppointments.length && <EmptyState title="No appointments in this view" />}
      </div>

      <DetailDrawer
        open={Boolean(selectedAppointment)}
        title="Patient Details"
        onClose={() => setSelectedAppointment(null)}
      >
        {selectedAppointment && (
          <div className="ui-detail-grid">
            <p><strong>Name:</strong> {selectedAppointment.patient?.firstName} {selectedAppointment.patient?.lastName}</p>
            <p><strong>Email:</strong> {selectedAppointment.patient?.email}</p>
            <p><strong>Date:</strong> {new Date(selectedAppointment.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {selectedAppointment.time}</p>
            <p><strong>Status:</strong> {selectedAppointment.status}</p>
            <hr />
            <h4>Recent Visits</h4>
            <ul className="ui-detail-list">
              {appointments
                .filter((a) => (a.patient?._id || a.patient) === (selectedAppointment.patient?._id || selectedAppointment.patient))
                .slice(0, 5)
                .map((a) => (
                  <li key={a._id}>{new Date(a.date).toLocaleDateString()} - {a.time} - {a.status}</li>
                ))}
            </ul>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

export default DoctorDashboard;
