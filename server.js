require('dotenv').config();
const express = require('express');
const app = express();
const corsMiddleware = require('./middleware/cors');
const requestLogger = require('./middleware/logger');
const { loginLimiter } = require('./middleware/rateLimit');

// Security middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

// HTTPS redirect (disabled for development)
// app.use((req, res, next) => {
//   if (req.header('x-forwarded-proto') !== 'https') {
//     res.redirect(`https://${req.header('host')}${req.url}`);
//   } else {
//     next();
//   }
// });

// Routes
const authRouter = require('./routes/auth');
app.use('/auth/login', loginLimiter);
app.use('/auth', authRouter);
app.use('/users', require('./routes/users'));
app.use('/notes', require('./routes/notes'));
app.use('/admin', require('./routes/admin'));
app.use('/export', require('./routes/export'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
