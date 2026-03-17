require('dotenv').config();
const express = require('express');
const app = express();
const corsMiddleware = require('./middleware/cors');

app.use(corsMiddleware);
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/notes', require('./routes/notes'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
