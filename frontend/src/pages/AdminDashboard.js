import React, { useState, useEffect, useContext } from 'react';
import { doctorService, appointmentService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    specialization: ''
  });
  const [scheduleModal, setScheduleModal] = useState({ doctorId: '', schedule: [], loading: false });
  const [editModal, setEditModal] = useState({ doctor: null });
  const [deleteModal, setDeleteModal] = useState({ doctor: null });
  const [notification, setNotification] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: '', doctorId: '', date: '' });

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
      setDoctors(doctorsRes.data);
      setAppointments(appointmentsRes.data);
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

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      await doctorService.add(newDoctor);
      setShowAddDoctor(false);
      setNewDoctor({ firstName: '', lastName: '', email: '', password: '', specialization: '' });
      loadData();
      showNotification('Doctor added successfully');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to add doctor', 'error');
    }
  };

  const handleEditDoctor = async (e) => {
    e.preventDefault();
    try {
      await doctorService.update(editModal.doctor._id, {
        firstName: editModal.doctor.firstName,
        lastName: editModal.doctor.lastName,
        specialization: editModal.doctor.specialization
      });
      setEditModal({ doctor: null });
      loadData();
      showNotification('Doctor updated successfully');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update doctor', 'error');
    }
  };

  const handleDeleteDoctor = async () => {
    try {
      await doctorService.delete(deleteModal.doctor._id);
      setDeleteModal({ doctor: null });
      loadData();
      showNotification('Doctor deleted successfully');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to delete doctor', 'error');
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
      await appointmentService.update(appointmentId, { status });
      loadData();
      showNotification(`Appointment marked as ${status}`);
    } catch (err) {
      showNotification('Failed to update appointment', 'error');
    }
  };

  const handleViewSchedule = async (doctorId) => {
    setScheduleModal({ doctorId, schedule: [], loading: true });
    try {
      const response = await doctorService.getSchedule(doctorId);
      setScheduleModal({ 
        doctorId, 
        schedule: response.data.schedule || [], 
        loading: false 
      });
    } catch (err) {
      setScheduleModal({ doctorId, schedule: [], loading: false });
    }
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    try {
      await doctorService.updateSchedule(scheduleModal.doctorId, scheduleModal.schedule);
      setScheduleModal({ doctorId: '', schedule: [], loading: false });
      showNotification('Schedule updated successfully');
    } catch (err) {
      showNotification('Failed to update schedule', 'error');
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const addScheduleSlot = () => {
    setScheduleModal({
      ...scheduleModal,
      schedule: [...scheduleModal.schedule, { day: 'Monday', startTime: '09:00', endTime: '17:00' }]
    });
  };

  const removeScheduleSlot = (index) => {
    const updated = scheduleModal.schedule.filter((_, i) => i !== index);
    setScheduleModal({ ...scheduleModal, schedule: updated });
  };

  const updateScheduleSlot = (index, field, value) => {
    const updated = [...scheduleModal.schedule];
    updated[index][field] = value;
    setScheduleModal({ ...scheduleModal, schedule: updated });
  };

  const filteredDoctors = doctors.filter(doc => {
    const searchLower = searchQuery.toLowerCase();
    return (
      doc.firstName?.toLowerCase().includes(searchLower) ||
      doc.lastName?.toLowerCase().includes(searchLower) ||
      doc.specialization?.toLowerCase().includes(searchLower) ||
      doc.email?.toLowerCase().includes(searchLower)
    );
  });

  const filteredAppointments = appointments.filter(apt => {
    if (filters.status && apt.status !== filters.status) return false;
    if (filters.doctorId && apt.doctor?._id !== filters.doctorId && apt.doctor !== filters.doctorId) return false;
    if (filters.date) {
      const aptDate = new Date(apt.date).toISOString().split('T')[0];
      if (aptDate !== filters.date) return false;
    }
    return true;
  });

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
          <h1 className="section-title">Admin Dashboard</h1>
          <p className="section-subtitle">Welcome back, {user?.firstName}</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{doctors.length}</span>
            <span className="stat-label">Doctors</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{appointments.length}</span>
            <span className="stat-label">Appointments</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title-sm">Manage Doctors</h2>
          <button 
            className={`btn ${showAddDoctor ? 'btn-secondary' : 'btn-success'}`}
            onClick={() => setShowAddDoctor(!showAddDoctor)}
          >
            {showAddDoctor ? 'Cancel' : '+ Add Doctor'}
          </button>
        </div>

        <div className="search-bar">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search doctors by name, specialization, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {showAddDoctor && (
          <form onSubmit={handleAddDoctor} className="card form-card">
            <h3 className="form-title">Add New Doctor</h3>
            <div className="form-row">
              <div className="input-group">
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="Dr. First name"
                  value={newDoctor.firstName}
                  onChange={(e) => setNewDoctor({ ...newDoctor, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="Dr. Last name"
                  value={newDoctor.lastName}
                  onChange={(e) => setNewDoctor({ ...newDoctor, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={newDoctor.email}
                  onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newDoctor.password}
                  onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="input-group">
              <label>Specialization</label>
              <input
                type="text"
                placeholder="e.g., Cardiology, General Medicine"
                value={newDoctor.specialization}
                onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Add Doctor
            </button>
          </form>
        )}

        <div className="grid grid-3">
          {filteredDoctors.map(doctor => (
            <div key={doctor._id} className="card doctor-card">
              <div className="doctor-avatar">
                {doctor.firstName?.[0]}{doctor.lastName?.[0]}
              </div>
              <h3 className="doctor-name">Dr. {doctor.firstName} {doctor.lastName}</h3>
              <p className="doctor-specialization">{doctor.specialization || 'General Medicine'}</p>
              <p className="doctor-email">{doctor.email}</p>
              <div className="doctor-actions">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditModal({ doctor: { ...doctor } })}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setDeleteModal({ doctor })}
                >
                  Delete
                </button>
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: '8px', width: '100%' }}
                onClick={() => handleViewSchedule(doctor._id)}
              >
                Set Schedule
              </button>
            </div>
          ))}
          {filteredDoctors.length === 0 && (
            <div className="empty-state">
              <p>{searchQuery ? 'No doctors match your search' : 'No doctors added yet'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="section-title-sm">Appointments</h2>
        
        <div className="filter-bar">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="complete">Complete</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Doctor</label>
            <select
              value={filters.doctorId}
              onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}
            >
              <option value="">All Doctors</option>
              {doctors.map(doc => (
                <option key={doc._id} value={doc._id}>Dr. {doc.firstName} {doc.lastName}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
          <button 
            className="btn btn-outline"
            onClick={() => setFilters({ status: '', doctorId: '', date: '' })}
          >
            Clear Filters
          </button>
        </div>

        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map(apt => (
                <tr key={apt._id}>
                  <td>{apt.patient?.firstName} {apt.patient?.lastName}</td>
                  <td>Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</td>
                  <td>{new Date(apt.date).toLocaleDateString()} at {apt.time}</td>
                  <td>
                    <span className={`badge badge-${apt.status}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td>
                    {apt.status !== 'cancelled' && apt.status !== 'complete' && (
                      <div className="table-actions">
                        {apt.status === 'pending' && (
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => handleUpdateAppointmentStatus(apt._id, 'confirmed')}
                          >
                            Confirm
                          </button>
                        )}
                        {(apt.status === 'pending' || apt.status === 'confirmed') && (
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => handleUpdateAppointmentStatus(apt._id, 'complete')}
                          >
                            Complete
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={() => handleUpdateAppointmentStatus(apt._id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">No appointments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {scheduleModal.doctorId && (
        <div className="modal-overlay" onClick={() => setScheduleModal({ doctorId: '', schedule: [], loading: false })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Set Doctor Schedule</h3>
            {scheduleModal.loading ? (
              <div className="loading-container"><div className="spinner"></div></div>
            ) : (
              <>
                <div className="schedule-list">
                  {scheduleModal.schedule.map((slot, index) => (
                    <div key={index} className="schedule-row">
                      <select
                        value={slot.day}
                        onChange={(e) => updateScheduleSlot(index, 'day', e.target.value)}
                      >
                        {days.map(day => <option key={day} value={day}>{day}</option>)}
                      </select>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateScheduleSlot(index, 'startTime', e.target.value)}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateScheduleSlot(index, 'endTime', e.target.value)}
                      />
                      <button
                        className="btn-icon"
                        onClick={() => removeScheduleSlot(index)}
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  ))}
                  {scheduleModal.schedule.length === 0 && (
                    <p className="no-schedule-text">No schedule set. Add time slots below.</p>
                  )}
                </div>
                <button className="btn btn-outline" onClick={addScheduleSlot}>
                  + Add Time Slot
                </button>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setScheduleModal({ doctorId: '', schedule: [], loading: false })}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleUpdateSchedule}>
                    Save Schedule
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {editModal.doctor && (
        <div className="modal-overlay" onClick={() => setEditModal({ doctor: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Edit Doctor</h3>
            <form onSubmit={handleEditDoctor}>
              <div className="input-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={editModal.doctor.firstName}
                  onChange={(e) => setEditModal({ 
                    doctor: { ...editModal.doctor, firstName: e.target.value } 
                  })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={editModal.doctor.lastName}
                  onChange={(e) => setEditModal({ 
                    doctor: { ...editModal.doctor, lastName: e.target.value } 
                  })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Specialization</label>
                <input
                  type="text"
                  value={editModal.doctor.specialization || ''}
                  onChange={(e) => setEditModal({ 
                    doctor: { ...editModal.doctor, specialization: e.target.value } 
                  })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal({ doctor: null })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal.doctor && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ doctor: null })}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Delete Doctor</h3>
            <p className="confirm-text">
              Are you sure you want to delete <strong>Dr. {deleteModal.doctor.firstName} {deleteModal.doctor.lastName}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteModal({ doctor: null })}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteDoctor}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-title-sm {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }

        .search-bar svg {
          width: 20px;
          height: 20px;
          color: #94a3b8;
        }

        .search-bar input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #1e293b;
        }

        .search-bar input::placeholder {
          color: #94a3b8;
        }

        .filter-bar {
          display: flex;
          gap: 16px;
          align-items: flex-end;
          flex-wrap: wrap;
          margin-bottom: 20px;
          background: #fff;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
        }

        .filter-group select,
        .filter-group input {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          min-width: 150px;
        }

        .form-card {
          margin-bottom: 24px;
        }

        .form-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #1e293b;
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
          margin-bottom: 4px;
        }

        .doctor-email {
          color: #94a3b8;
          font-size: 12px;
          margin-bottom: 16px;
        }

        .doctor-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 13px;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .data-table th {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .data-table tr:last-child td {
          border-bottom: none;
        }

        .text-center {
          text-align: center;
        }

        .table-actions {
          display: flex;
          gap: 6px;
        }

        .btn-xs {
          padding: 4px 8px;
          font-size: 11px;
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

        .modal-sm {
          max-width: 400px;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #1e293b;
        }

        .schedule-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .schedule-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .schedule-row select,
        .schedule-row input {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
        }

        .schedule-row span {
          color: #64748b;
        }

        .no-schedule-text {
          color: #94a3b8;
          font-size: 14px;
          text-align: center;
          padding: 12px;
        }

        .btn-icon {
          background: none;
          border: none;
          padding: 4px;
          color: #64748b;
          cursor: pointer;
        }

        .btn-icon:hover {
          color: #ef4444;
        }

        .btn-icon svg {
          width: 20px;
          height: 20px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .modal-actions .btn {
          flex: 1;
        }

        .confirm-text {
          color: #64748b;
          line-height: 1.6;
        }

        .spinner-large {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 48px 24px;
          color: #64748b;
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

          .filter-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-group {
            width: 100%;
          }

          .filter-group select,
          .filter-group input {
            width: 100%;
          }

          .data-table {
            display: block;
            overflow-x: auto;
          }

          .doctor-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;