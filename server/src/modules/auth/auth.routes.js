/**
 * REFERENCE MODULE — every slice follows this four-file shape.
 *
 *   routes      URL -> controller, plus middleware. No logic.
 *   controller  HTTP in / HTTP out. Parses input, sets status codes. No SQL.
 *   service     business rules. No SQL, no req/res.
 *   repo        SQL only. Nothing else in the codebase touches the database.
 *
 * Why: in a database course the marks are in the SQL. Keeping every query in a
 * repo file makes the SQL easy to find, review, and talk about at the viva.
 */
const router = require('express').Router();
const controller = require('./auth.controller');

router.post('/register', controller.register);
router.post('/login', controller.login);

module.exports = router;
