const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const DoctorSchedule = require('../models/DoctorSchedule');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

const validateScheduleEntries = (entries) => {
  if (!Array.isArray(entries)) {
    return 'Schedule must be an array';
  }

  const slotsByDay = {};
  for (const slot of entries) {
    if (!slot || typeof slot !== 'object') {
      return 'Each schedule entry must be an object';
    }
    if (!slot.day || !slot.startTime || !slot.endTime) {
      return 'Each schedule entry must include day, startTime, and endTime';
    }
    if (!DAYS.includes(slot.day)) {
      return 'Schedule day is invalid';
    }
    if (!TIME_PATTERN.test(slot.startTime) || !TIME_PATTERN.test(slot.endTime)) {
      return 'Schedule times must use HH:mm format';
    }

    const start = toMinutes(slot.startTime);
    const end = toMinutes(slot.endTime);
    if (start >= end) {
      return 'Schedule start time must be before end time';
    }
    if (start % 15 !== 0 || end % 15 !== 0) {
      return 'Schedule times must align to 15-minute intervals';
    }

    if (!slotsByDay[slot.day]) {
      slotsByDay[slot.day] = [];
    }
    slotsByDay[slot.day].push({ start, end });
  }

  for (const day of Object.keys(slotsByDay)) {
    const slots = slotsByDay[day].sort((a, b) => a.start - b.start);
    for (let i = 1; i < slots.length; i += 1) {
      if (slots[i].start < slots[i - 1].end) {
        return `Schedule has overlapping time windows on ${day}`;
      }
    }
  }

  return null;
};

router.get('/', auth, async (req, res) => {
  try {
    const includeInactive = req.user.role === 'admin' && req.query.includeInactive === 'true';
    const query = { role: 'doctor' };
    if (!includeInactive) {
      query.isActive = true;
    }

    const doctors = await User.find(query).select('-password');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/with-schedules', auth, async (req, res) => {
  try {
    const includeInactive = req.user.role === 'admin' && req.query.includeInactive === 'true';
    const query = { role: 'doctor' };
    if (!includeInactive) {
      query.isActive = true;
    }

    const doctors = await User.find(query).select('-password');
    const doctorIds = doctors.map((doctor) => doctor._id);
    const schedules = await DoctorSchedule.find({ doctor: { $in: doctorIds } });

    const scheduleMap = new Map(schedules.map((item) => [item.doctor.toString(), item]));
    const payload = doctors.map((doctor) => ({
      ...doctor.toObject(),
      schedule: scheduleMap.get(doctor._id.toString())?.schedule || []
    }));

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' }).select('-password');
    if (!doctor || (doctor.isActive === false && req.user.role !== 'admin')) {
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
      specialization: specialization || '',
      isActive: true
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
      specialization: doctor.specialization,
      isActive: doctor.isActive
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/schedule', auth, authorize('admin'), async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor', isActive: true });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const scheduleValidationError = validateScheduleEntries(req.body.schedule);
    if (scheduleValidationError) {
      return res.status(400).json({ message: scheduleValidationError });
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
      specialization: doctor.specialization,
      isActive: doctor.isActive
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

    doctor.isActive = false;
    await doctor.save();

    res.json({ message: 'Doctor deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/schedule', auth, async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' }).select('_id isActive');
    if (!doctor || (doctor.isActive === false && req.user.role !== 'admin')) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

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
