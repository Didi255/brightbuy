const service = require('./account.service');

exports.getMe = async (req, res, next) => {
  try {
    const result = await service.getMe(req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const result = await service.updateMe(req.user, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getAddresses = async (req, res, next) => {
  try {
    const result = await service.getAddresses(req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.createAddress = async (req, res, next) => {
  try {
    const result = await service.createAddress(req.user, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getCities = async (req, res, next) => {
  try {
    const result = await service.getCities();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getAdminCities = async (req, res, next) => {
  try {
    const result = await service.getAdminCities();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.createCity = async (req, res, next) => {
  try {
    const result = await service.createCity(req.body);

    res.locals.auditData = {
      entityId: result.cityId,
      beforeValue: null,
      afterValue: {
        cityName: req.body.cityName.trim(),
        isMainCity: req.body.isMainCity,
      },
    };

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateCity = async (req, res, next) => {
  try {
    const result = await service.updateCity(req.params.id, req.body);

    const { beforeCity, ...updatedCity } = result;

    const beforeValue = {};
    const afterValue = {};

    if (beforeCity.cityName !== updatedCity.cityName) {
      beforeValue.cityName = beforeCity.cityName;
      afterValue.cityName = updatedCity.cityName;
    }

    if (
      Boolean(beforeCity.isMainCity) !==
      Boolean(updatedCity.isMainCity)
    ) {
      beforeValue.isMainCity = Boolean(beforeCity.isMainCity);
      afterValue.isMainCity = Boolean(updatedCity.isMainCity);
    }

    if (Object.keys(afterValue).length > 0) {
      res.locals.auditData = {
        entityId: updatedCity.cityId,
        beforeValue,
        afterValue,
      };
    }

    res.json(updatedCity);
  } catch (err) {
    next(err);
  }
};

exports.getAdminUsers = async (req, res, next) => {
  try {
    const result = await service.getAdminUsers();
    res.json(result);
  } catch (err) {
    next(err);
  }
};


exports.updateAdminUser = async (req, res, next) => {
  try {
    const result = await service.updateAdminUser(
      req.params.id,
      req.body,
      req.user.userId
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};


/**
 * GET /api/admin/audit-log
 *
 * Retrieve the latest administrative audit records.
 * Access is restricted to administrators by the route middleware.
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await service.getAuditLogs();

    return res.json(logs);
  } catch (error) {
    next(error);
  }
};

