const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const DoctorSchedule = require('../models/DoctorSchedule');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ACTIVE_STATUSES = ['pending', 'confirmed'];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const normalizeDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
};

const isFutureDateTime = (date, time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const dateTime = new Date(date);
  dateTime.setUTCHours(hours, minutes, 0, 0);
  return dateTime.getTime() > Date.now();
};

const userCanAccessAppointment = (user, appointment) => {
  if (user.role === 'admin') return true;
  if (user.role === 'doctor') return appointment.doctor.toString() === user._id.toString();
  if (user.role === 'patient') return appointment.patient.toString() === user._id.toString();
  return false;
};

const validateDoctorSlot = async ({ doctorId, date, time, excludeAppointmentId = null }) => {
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
  if (!doctor) {
    return { error: 'Doctor is unavailable' };
  }

  if (!isFutureDateTime(date, time)) {
    return { error: 'Appointment must be scheduled for a future time' };
  }

  const schedule = await DoctorSchedule.findOne({ doctor: doctorId });
  if (!schedule || !schedule.schedule?.length) {
    return { error: 'Doctor has no schedule configured' };
  }

  const dayName = DAYS[date.getUTCDay()];
  const dayWindows = schedule.schedule.filter((slot) => slot.day === dayName);
  if (!dayWindows.length) {
    return { error: `Doctor is not available on ${dayName}` };
  }

  const requestedMinutes = toMinutes(time);
  if (requestedMinutes % 15 !== 0) {
    return { error: 'Appointment time must be in 15-minute intervals' };
  }

  const withinSchedule = dayWindows.some((slot) => {
    const start = toMinutes(slot.startTime);
    const end = toMinutes(slot.endTime);
    return requestedMinutes >= start && requestedMinutes < end;
  });

  if (!withinSchedule) {
    return { error: 'Selected time is outside doctor working hours' };
  }

  const collisionQuery = {
    doctor: doctorId,
    date,
    time,
    status: { $ne: 'cancelled' }
  };

  if (excludeAppointmentId) {
    collisionQuery._id = { $ne: excludeAppointmentId };
  }

  const existingAppointment = await Appointment.findOne(collisionQuery);
  if (existingAppointment) {
    return { error: 'This slot is already booked' };
  }

  return { error: null };
};

const canTransitionStatus = (role, currentStatus, nextStatus) => {
  const transitions = {
    patient: {
      pending: ['cancelled'],
      confirmed: ['cancelled']
    },
    doctor: {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['complete', 'cancelled']
    },
    admin: {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['complete', 'cancelled']
    }
  };

  return Boolean(transitions[role]?.[currentStatus]?.includes(nextStatus));
};

router.get('/', auth, async (req, res) => {
  try {
    let appointments;
    if (req.user.role === 'admin') {
      appointments = await Appointment.find()
        .populate('patient', 'firstName lastName email')
        .populate('doctor', 'firstName lastName specialization isActive');
    } else if (req.user.role === 'doctor') {
      appointments = await Appointment.find({ doctor: req.user._id })
        .populate('patient', 'firstName lastName email')
        .populate('doctor', 'firstName lastName specialization isActive');
    } else {
      appointments = await Appointment.find({ patient: req.user._id })
        .populate('patient', 'firstName lastName email')
        .populate('doctor', 'firstName lastName specialization isActive');
    }
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, authorize('patient'), [
  body('doctorId').isMongoId(),
  body('date').isISO8601(),
  body('time').matches(TIME_PATTERN)
], validate, async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      return res.status(400).json({ message: 'Invalid appointment date' });
    }

    const slotValidation = await validateDoctorSlot({
      doctorId,
      date: normalizedDate,
      time
    });
    if (slotValidation.error) {
      return res.status(400).json({ message: slotValidation.error });
    }

    const appointment = new Appointment({
      patient: req.user._id,
      doctor: doctorId,
      date: normalizedDate,
      time
    });

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName specialization isActive');

    res.status(201).json(populatedAppointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/status', auth, [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'complete'])
], validate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (!userCanAccessAppointment(req.user, appointment)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    if (!canTransitionStatus(req.user.role, appointment.status, status)) {
      return res.status(400).json({
        message: `Cannot change status from ${appointment.status} to ${status} as ${req.user.role}`
      });
    }

    appointment.status = status;
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/reschedule', auth, [
  body('date').isISO8601(),
  body('time').matches(TIME_PATTERN)
], validate, async (req, res) => {
  try {
    if (!['patient', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only patient or admin can reschedule appointments' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (!userCanAccessAppointment(req.user, appointment)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (!ACTIVE_STATUSES.includes(appointment.status)) {
      return res.status(400).json({ message: 'Only active appointments can be rescheduled' });
    }

    const normalizedDate = normalizeDate(req.body.date);
    if (!normalizedDate) {
      return res.status(400).json({ message: 'Invalid appointment date' });
    }

    const slotValidation = await validateDoctorSlot({
      doctorId: appointment.doctor,
      date: normalizedDate,
      time: req.body.time,
      excludeAppointmentId: appointment._id
    });
    if (slotValidation.error) {
      return res.status(400).json({ message: slotValidation.error });
    }

    appointment.date = normalizedDate;
    appointment.time = req.body.time;
    appointment.status = 'pending';
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName specialization isActive');

    res.json(populatedAppointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (!userCanAccessAppointment(req.user, appointment)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (!canTransitionStatus(req.user.role, appointment.status, 'cancelled')) {
      return res.status(400).json({ message: 'This appointment cannot be cancelled' });
    }

    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
