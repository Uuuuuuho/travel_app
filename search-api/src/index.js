/* Entry point for Custom Web Search API */
const express = require('express');
const morgan = require('morgan');
const searchRoute = require('./routes/search');

const PORT = process.env.PORT || 4000;

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/search', searchRoute);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`🔍 Custom Search API listening on port ${PORT}`)); 