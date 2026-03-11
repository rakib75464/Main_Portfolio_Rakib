const express = require('express');
const cors = require('cors');

const { router: authRouter } = require('./routes/auth');
const configRouter = require('./routes/config');
const imagesRouter = require('./routes/images');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRouter);
app.use('/api/config', configRouter);
app.use('/api/images', imagesRouter);

module.exports = app;
