const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const DoctorSchedule = require('../models/DoctorSchedule');
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
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' }).select('-password');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const schedule = await DoctorSchedule.findOne({ doctor: req.params.id });
    res.json({ doctor, schedule });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, authorize('admin'), [
  body('firstName').trim().notEmpty().isLength({ max: 50 }),
  body('lastName').trim().notEmpty().isLength({ max: 50 }),
  body('email').trim().isEmail(),
  body('password').isLength({ min: 6, max: 20 }),
  body('specialization').optional().trim().isLength({ max: 100 })
], validate, async (req, res) => {
  try {
    const { firstName, lastName, email, password, specialization } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const doctor = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'doctor',
      specialization: specialization || ''
    });

    await doctor.save();

    const schedule = new DoctorSchedule({
      doctor: doctor._id,
      schedule: []
    });
    await schedule.save();

    res.status(201).json({
      _id: doctor._id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      specialization: doctor.specialization
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/schedule', auth, authorize('admin'), async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    let schedule = await DoctorSchedule.findOne({ doctor: req.params.id });
    if (!schedule) {
      schedule = new DoctorSchedule({ doctor: req.params.id, schedule: req.body.schedule });
    } else {
      schedule.schedule = req.body.schedule;
    }

    await schedule.save();
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, authorize('admin'), [
  body('firstName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('lastName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('specialization').optional().trim().isLength({ max: 100 })
], validate, async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const { firstName, lastName, specialization } = req.body;

    if (firstName) doctor.firstName = firstName;
    if (lastName) doctor.lastName = lastName;
    if (specialization !== undefined) doctor.specialization = specialization;

    await doctor.save();

    res.json({
      _id: doctor._id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      specialization: doctor.specialization
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    await DoctorSchedule.findOneAndDelete({ doctor: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Doctor deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/schedule', auth, async (req, res) => {
  try {
    const schedule = await DoctorSchedule.findOne({ doctor: req.params.id });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;