const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const healthRoutes = require('./routes/healthRoutes');
const jobRoutes = require('./routes/jobRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const uploadsDirectory = path.join(__dirname, '../uploads');

const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/uploads/:filename', async (req, res, next) => {
  try {
    const requestedFilename = String(req.params.filename || '').trim();
    const safeFilename = path.basename(requestedFilename);

    if (!safeFilename || safeFilename !== requestedFilename) {
      return res.status(404).json({
        message: 'Resume file not found.',
      });
    }

    const filePath = path.join(uploadsDirectory, safeFilename);

    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        message: 'Resume file not found.',
      });
    }

    return res.sendFile(filePath, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    });
  } catch (error) {
    return next(error);
  }
});

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/scores', scoreRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
