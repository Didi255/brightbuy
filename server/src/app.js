const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// --- module routers ---------------------------------------------------
// Each member mounts their own slice here. Keep this list alphabetical.
app.use('/api/health', require('./modules/health/health.routes'));
app.use('/api/auth',   require('./modules/auth/auth.routes'));
// app.use('/api',        require('./modules/catalogue/catalogue.routes'));  // M2
// app.use('/api/cart',   require('./modules/cart/cart.routes'));            // M3
// app.use('/api',        require('./modules/orders/orders.routes'));        // M4
// app.use('/api',        require('./modules/payments/payments.routes'));    // M5
// app.use('/api/reports',require('./modules/reports/reports.routes'));      // M5

app.use(notFound);
app.use(errorHandler);

module.exports = app;
