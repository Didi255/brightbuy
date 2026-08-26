const service = require('./auth.service');

exports.register = async (req, res, next) => {
  try {
    const result = await service.register(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const result = await service.login(req.body);
    res.json(result);
  } catch (err) { next(err); }
};
