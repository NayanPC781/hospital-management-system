import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doctorService, appointmentService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { convertTo12Hour } from '../utils/timeFormat';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import FilterBar from '../components/ui/FilterBar';
import DataTable from '../components/ui/DataTable';
import DetailDrawer from '../components/ui/DetailDrawer';
import EmptyState from '../components/ui/EmptyState';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [appointmentFilters, setAppointmentFilters] = useState({ status: '', doctorId: '', date: '' });
  const [patientDetail, setPatientDetail] = useState(null);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    specialization: ''
  });
  const [scheduleModal, setScheduleModal] = useState({ doctorId: '', schedule: [], loading: false });
  const [editDoctorModal, setEditDoctorModal] = useState({ doctor: null, firstName: '', lastName: '', specialization: '' });
  const activeTab = searchParams.get('tab') || 'operations';

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [doctorsRes, appointmentsRes] = await Promise.all([
        doctorService.getAll(),
        appointmentService.getAll()
      ]);
      setDoctors(doctorsRes.data);
      setAppointments(appointmentsRes.data);
    } catch (err) {
      showNotification('Failed to load admin console', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = useMemo(() => ({
    doctors: doctors.length,
    patients: new Set(appointments.map((apt) => apt.patient?._id || apt.patient).filter(Boolean)).size,
    pending: appointments.filter((apt) => apt.status === 'pending').length,
    total: appointments.length
  }), [doctors, appointments]);

  const filteredDoctors = useMemo(
    () => doctors.filter((doctor) => {
      const query = doctorSearch.toLowerCase();
      if (!query) return true;
      return (
        doctor.firstName?.toLowerCase().includes(query)
        || doctor.lastName?.toLowerCase().includes(query)
        || doctor.specialization?.toLowerCase().includes(query)
        || doctor.email?.toLowerCase().includes(query)
      );
    }),
    [doctors, doctorSearch]
  );

  const filteredAppointments = useMemo(
    () => appointments.filter((apt) => {
      if (appointmentFilters.status && apt.status !== appointmentFilters.status) return false;
      if (appointmentFilters.doctorId && (apt.doctor?._id || apt.doctor) !== appointmentFilters.doctorId) return false;
      if (appointmentFilters.date && new Date(apt.date).toISOString().split('T')[0] !== appointmentFilters.date) return false;
      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA - dateB !== 0) return dateA - dateB;
      return a.time.localeCompare(b.time);
    }),
    [appointments, appointmentFilters]
  );

  const patients = useMemo(() => {
    const map = new Map();
    appointments.forEach((apt) => {
      const id = apt.patient?._id || apt.patient;
      if (!id) return;
      if (!map.has(id)) {
        map.set(id, {
          _id: id,
          firstName: apt.patient?.firstName || 'Unknown',
          lastName: apt.patient?.lastName || 'Patient',
          email: apt.patient?.email || 'No email',
          appointments: []
        });
      }
      map.get(id).appointments.push(apt);
    });
    return Array.from(map.values()).sort((a, b) => (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName));
  }, [appointments]);

  const filteredPatients = useMemo(
    () => patients.filter((patient) => {
      const q = patientSearch.toLowerCase();
      if (!q) return true;
      return (`${patient.firstName} ${patient.lastName}`.toLowerCase().includes(q) || patient.email.toLowerCase().includes(q));
    }),
    [patients, patientSearch]
  );

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      await doctorService.add(newDoctor);
      setShowAddDoctor(false);
      setNewDoctor({ firstName: '', lastName: '', email: '', password: '', specialization: '' });
      loadData();
      showNotification('Doctor added');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to add doctor', 'error');
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Deactivate this doctor?')) return;
    try {
      await doctorService.delete(doctorId);
      showNotification('Doctor deactivated');
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to deactivate doctor', 'error');
    }
  };

  const handleEditDoctor = (doctor) => {
    setEditDoctorModal({
      doctor,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialization: doctor.specialization || ''
    });
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    try {
      await doctorService.update(editDoctorModal.doctor._id, {
        firstName: editDoctorModal.firstName,
        lastName: editDoctorModal.lastName,
        specialization: editDoctorModal.specialization
      });
      showNotification('Doctor updated');
      setEditDoctorModal({ doctor: null, firstName: '', lastName: '', specialization: '' });
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update doctor', 'error');
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
      await appointmentService.updateStatus(appointmentId, status);
      showNotification(`Appointment set to ${status}`);
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update appointment', 'error');
    }
  };

  const handleViewSchedule = async (doctorId) => {
    setScheduleModal({ doctorId, schedule: [], loading: true });
    try {
      const response = await doctorService.getSchedule(doctorId);
      setScheduleModal({ doctorId, schedule: response.data.schedule || [], loading: false });
    } catch (err) {
      setScheduleModal({ doctorId, schedule: [], loading: false });
    }
  };

  const handleUpdateSchedule = async () => {
    try {
      await doctorService.updateSchedule(scheduleModal.doctorId, scheduleModal.schedule);
      showNotification('Schedule updated');
      setScheduleModal({ doctorId: '', schedule: [], loading: false });
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update schedule', 'error');
    }
  };

  const addScheduleSlot = () => setScheduleModal((prev) => ({
    ...prev,
    schedule: [...prev.schedule, { day: 'Monday', startTime: '09:00', endTime: '17:00' }]
  }));

  const updateSlot = (index, field, value) => setScheduleModal((prev) => {
    const next = [...prev.schedule];
    next[index][field] = value;
    return { ...prev, schedule: next };
  });

  const removeSlot = (index) => setScheduleModal((prev) => ({
    ...prev,
    schedule: prev.schedule.filter((_, i) => i !== index)
  }));

  if (loading) return <div className="loading-container"><div className="spinner-large" /></div>;

  return (
    <div className="page-container">
      {notification && <div className={`toast toast-${notification.type}`}>{notification.message}</div>}
      <PageHeader
        title={`Welcome, ${user?.firstName}`}
        subtitle="Manage doctors, appointments, and patient operations."
        actions={(
          <div className="ui-inline-tabs">
            <button type="button" className={`btn btn-outline ${activeTab === 'operations' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'operations' })}>Operations</button>
            <button type="button" className={`btn btn-outline ${activeTab === 'doctors' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'doctors' })}>Doctors</button>
            <button type="button" className={`btn btn-outline ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'patients' })}>Patients</button>
          </div>
        )}
      />

      <div className="grid grid-4 ui-stats-row">
        <StatCard label="Doctors" value={metrics.doctors} tone="primary" />
        <StatCard label="Patients" value={metrics.patients} />
        <StatCard label="Pending Appointments" value={metrics.pending} tone="warning" />
        <StatCard label="Total Appointments" value={metrics.total} tone="success" />
      </div>

      {activeTab === 'doctors' && (
        <>
          <PageHeader
            title="Doctor Management"
            subtitle="Search, create, deactivate, and manage schedules."
            actions={(
              <button type="button" className="btn btn-success" onClick={() => setShowAddDoctor((prev) => !prev)}>
                {showAddDoctor ? 'Close Form' : 'Add Doctor'}
              </button>
            )}
          />
          <FilterBar>
            <input type="text" placeholder="Search doctors..." value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)} />
          </FilterBar>

          {showAddDoctor && (
            <form className="card" onSubmit={handleAddDoctor}>
              <div className="form-row">
                <div className="input-group">
                  <label>First Name</label>
                  <input type="text" value={newDoctor.firstName} onChange={(e) => setNewDoctor({ ...newDoctor, firstName: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input type="text" value={newDoctor.lastName} onChange={(e) => setNewDoctor({ ...newDoctor, lastName: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label>Email</label>
                  <input type="email" value={newDoctor.email} onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <input type="password" value={newDoctor.password} onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })} minLength={6} required />
                </div>
              </div>
              <div className="input-group">
                <label>Specialization</label>
                <input type="text" value={newDoctor.specialization} onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary">Create Doctor</button>
            </form>
          )}

          <div className="grid grid-3">
            {filteredDoctors.map((doctor) => (
              <div key={doctor._id} className="card ui-doctor-card">
                <h4>Dr. {doctor.firstName} {doctor.lastName}</h4>
                <p>{doctor.specialization || 'General Medicine'}</p>
                <small>{doctor.email}</small>
                <div className="ui-appointment-actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleEditDoctor(doctor)}>Edit</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleViewSchedule(doctor._id)}>Schedule</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteDoctor(doctor._id)}>Deactivate</button>
                </div>
              </div>
            ))}
            {!filteredDoctors.length && <EmptyState title="No doctors match current filter" />}
          </div>
        </>
      )}

      {(activeTab === 'operations') && (
        <>
          <PageHeader title="Appointment Operations" subtitle="Filter and execute safe status actions." />
          <FilterBar>
            <select value={appointmentFilters.status} onChange={(e) => setAppointmentFilters({ ...appointmentFilters, status: e.target.value })}>
              <option value="">All status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="complete">Complete</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={appointmentFilters.doctorId} onChange={(e) => setAppointmentFilters({ ...appointmentFilters, doctorId: e.target.value })}>
              <option value="">All doctors</option>
              {doctors.map((doc) => <option key={doc._id} value={doc._id}>Dr. {doc.firstName} {doc.lastName}</option>)}
            </select>
            <input type="date" value={appointmentFilters.date} onChange={(e) => setAppointmentFilters({ ...appointmentFilters, date: e.target.value })} />
            <button type="button" className="btn btn-outline" onClick={() => setAppointmentFilters({ status: '', doctorId: '', date: '' })}>Reset</button>
          </FilterBar>

          <DataTable headers={['Patient', 'Doctor', 'Date & Time', 'Status', 'Actions']}>
            {filteredAppointments.map((apt) => (
              <tr key={apt._id}>
                <td>{apt.patient?.firstName} {apt.patient?.lastName}</td>
                <td>{apt.doctor ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}` : 'Doctor unavailable'}</td>
                <td>{new Date(apt.date).toLocaleDateString()} at {convertTo12Hour(apt.time)}</td>
                <td><StatusBadge status={apt.status} /></td>
                <td>
                  <div className="table-actions">
                    {apt.status === 'pending' && (
                      <button type="button" className="btn btn-success btn-xs" onClick={() => handleUpdateAppointmentStatus(apt._id, 'confirmed')}>Confirm</button>
                    )}
                    {apt.status === 'confirmed' && (
                      <button type="button" className="btn btn-primary btn-xs" onClick={() => handleUpdateAppointmentStatus(apt._id, 'complete')}>Complete</button>
                    )}
                    {(apt.status === 'pending' || apt.status === 'confirmed') && (
                      <button type="button" className="btn btn-danger btn-xs" onClick={() => handleUpdateAppointmentStatus(apt._id, 'cancelled')}>Cancel</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!filteredAppointments.length && (
              <tr>
                <td colSpan="5" className="text-center">No appointments found.</td>
              </tr>
            )}
          </DataTable>
        </>
      )}

      {activeTab === 'patients' && (
        <>
          <PageHeader title="Patient Directory" subtitle="Search patients and inspect appointment history." />
          <FilterBar>
            <input type="text" placeholder="Search patient by name or email" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
          </FilterBar>
          <DataTable headers={['Patient', 'Email', 'Appointments', 'Pending', 'Actions']}>
            {filteredPatients.map((patient) => {
              const pending = patient.appointments.filter((a) => a.status === 'pending').length;
              return (
                <tr key={patient._id}>
                  <td>{patient.firstName} {patient.lastName}</td>
                  <td>{patient.email}</td>
                  <td>{patient.appointments.length}</td>
                  <td>{pending}</td>
                  <td>
                    <button type="button" className="btn btn-outline btn-xs" onClick={() => setPatientDetail(patient)}>View Details</button>
                  </td>
                </tr>
              );
            })}
            {!filteredPatients.length && (
              <tr>
                <td colSpan="5" className="text-center">No patient records in current results.</td>
              </tr>
            )}
          </DataTable>
        </>
      )}

      <DetailDrawer open={Boolean(patientDetail)} title="Patient Profile" onClose={() => setPatientDetail(null)}>
        {patientDetail && (
          <div className="ui-detail-grid">
            <p><strong>Name:</strong> {patientDetail.firstName} {patientDetail.lastName}</p>
            <p><strong>Email:</strong> {patientDetail.email}</p>
            <p><strong>Total Appointments:</strong> {patientDetail.appointments.length}</p>
            <p><strong>Completed:</strong> {patientDetail.appointments.filter((a) => a.status === 'complete').length}</p>
            <p><strong>Cancelled:</strong> {patientDetail.appointments.filter((a) => a.status === 'cancelled').length}</p>
            <hr />
            <h4>Appointment History</h4>
            <ul className="ui-detail-list">
              {patientDetail.appointments
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((a) => (
                  <li key={a._id}>
                    {new Date(a.date).toLocaleDateString()} {convertTo12Hour(a.time)} - {a.doctor ? `Dr. ${a.doctor.firstName} ${a.doctor.lastName}` : 'Doctor unavailable'} - {a.status}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </DetailDrawer>

      {scheduleModal.doctorId && (
        <div className="modal-overlay" onClick={() => setScheduleModal({ doctorId: '', schedule: [], loading: false })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Manage Doctor Schedule</h3>
            {scheduleModal.loading ? <div className="loading-container"><div className="spinner" /></div> : (
              <>
                {scheduleModal.schedule.map((slot, index) => (
                  <div className="schedule-row" key={`${slot.day}-${index}`}>
                    <select value={slot.day} onChange={(e) => updateSlot(index, 'day', e.target.value)}>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => <option key={day} value={day}>{day}</option>)}
                    </select>
                    <input type="time" value={slot.startTime} onChange={(e) => updateSlot(index, 'startTime', e.target.value)} />
                    <input type="time" value={slot.endTime} onChange={(e) => updateSlot(index, 'endTime', e.target.value)} />
                    <button type="button" className="btn btn-danger btn-xs" onClick={() => removeSlot(index)}>Remove</button>
                  </div>
                ))}
                <div className="ui-modal-actions">
                  <button type="button" className="btn btn-outline" onClick={addScheduleSlot}>Add Slot</button>
                  <button type="button" className="btn btn-primary" onClick={handleUpdateSchedule}>Save</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {editDoctorModal.doctor && (
        <div className="modal-overlay" onClick={() => setEditDoctorModal({ doctor: null, firstName: '', lastName: '', specialization: '' })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Doctor</h3>
            <form onSubmit={handleUpdateDoctor}>
              <div className="form-row">
                <div className="input-group">
                  <label>First Name</label>
                  <input type="text" value={editDoctorModal.firstName} onChange={(e) => setEditDoctorModal({ ...editDoctorModal, firstName: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input type="text" value={editDoctorModal.lastName} onChange={(e) => setEditDoctorModal({ ...editDoctorModal, lastName: e.target.value })} required />
                </div>
              </div>
              <div className="input-group">
                <label>Specialization</label>
                <input type="text" value={editDoctorModal.specialization} onChange={(e) => setEditDoctorModal({ ...editDoctorModal, specialization: e.target.value })} />
              </div>
              <div className="ui-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditDoctorModal({ doctor: null, firstName: '', lastName: '', specialization: '' })}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
