const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

router.get('/', auth, async (req, res) => {
  try {
    let appointments;
    if (req.user.role === 'admin') {
      appointments = await Appointment.find()
        .populate('patient', 'firstName lastName email')
        .populate('doctor', 'firstName lastName specialization');
    } else if (req.user.role === 'doctor') {
      appointments = await Appointment.find({ doctor: req.user._id })
        .populate('patient', 'firstName lastName email')
        .populate('doctor', 'firstName lastName specialization');
    } else {
      appointments = await Appointment.find({ patient: req.user._id })
        .populate('patient', 'firstName lastName email')
        .populate('doctor', 'firstName lastName specialization');
    }
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, authorize('patient'), [
  body('doctorId').isMongoId(),
  body('date').isISO8601(),
  body('time').matches(/^([01]?\d|2[0-3]):([0-5]\d)$/)
], validate, async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;

    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: new Date(date),
      time,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'This slot is already booked' });
    }

    const appointment = new Appointment({
      patient: req.user._id,
      doctor: doctorId,
      date: new Date(date),
      time
    });

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName specialization');

    res.status(201).json(populatedAppointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.body.status) {
      appointment.status = req.body.status;
    }

    await appointment.save();
    res.json(appointment);
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

    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;