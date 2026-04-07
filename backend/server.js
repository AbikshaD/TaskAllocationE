const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      'https://frontend-one-wheat-31.vercel.app',
      'https://frontend-dk274xuee-abikshads-projects.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/host', require('./routes/host'));
app.use('/api/students', require('./routes/students'));
app.use('/api/marks', require('./routes/marks'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/subjects', require('./routes/subjects'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Server is running', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
