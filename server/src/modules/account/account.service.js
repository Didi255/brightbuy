const repo = require('./account.repo');
const ApiError = require('../../utils/ApiError');

exports.getMe = async (user) => {
  if (user.userType !== 'customer') {
    throw ApiError.forbidden();
  }

  const customer = await repo.findCustomerById(user.userId);

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  return customer;
};

exports.updateMe = async (user, input) => {
  if (user.userType !== 'customer') {
    throw ApiError.forbidden();
  }

  const fields = {};

  if (!input.firstName?.trim()) {
    fields.firstName = 'First name is required';
  }

  if (!input.lastName?.trim()) {
    fields.lastName = 'Last name is required';
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError.badRequest('Validation failed', fields);
  }

  const customer = await repo.findCustomerById(user.userId);

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  await repo.updateCustomerProfile(user.userId, {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone?.trim() || null,
  });

  return repo.findCustomerById(user.userId);
};

exports.getAddresses = async (user) => {
  if (user.userType !== 'customer') {
    throw ApiError.forbidden();
  }

  return repo.findAddressesByCustomerId(user.userId);
};

exports.createAddress = async (user, input) => {
  if (user.userType !== 'customer') {
    throw ApiError.forbidden();
  }

  const fields = {};

  if (!input.cityId) {
    fields.cityId = 'City is required';
  }

  if (!input.houseNum?.trim()) {
    fields.houseNum = 'House number is required';
  }

  if (!input.address1?.trim()) {
    fields.address1 = 'Address line 1 is required';
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError.badRequest('Validation failed', fields);
  }

  // Check whether the supplied city actually exists.
  const city = await repo.findCityById(input.cityId);

  if (!city) {
    throw ApiError.badRequest('Validation failed', {
      cityId: 'Invalid city',
    });
  }

  const addressId = await repo.createAddress(user.userId, {
    cityId: input.cityId,
    houseNum: input.houseNum.trim(),
    address1: input.address1.trim(),
    address2: input.address2?.trim() || null,
    address3: input.address3?.trim() || null,
  });

  return { addressId };
};

exports.getCities = async () => {
  return repo.findAllCities();
};

exports.getAdminCities = async () => {
  return repo.findAllCities();
};

exports.createCity = async (input) => {
  const fields = {};

  if (!input.cityName?.trim()) {
    fields.cityName = 'City name is required';
  }

  if (typeof input.isMainCity !== 'boolean') {
    fields.isMainCity = 'isMainCity must be true or false';
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError.badRequest('Validation failed', fields);
  }

  const cityId = await repo.createCity(
    input.cityName.trim(),
    input.isMainCity
  );

  return { cityId };
};

exports.updateCity = async (cityId, input) => {
  const fields = {};

  const parsedCityId = Number(cityId);

  if (!Number.isInteger(parsedCityId) || parsedCityId <= 0) {
    throw ApiError.badRequest('Validation failed', {
      id: 'Invalid city ID',
    });
  }

  if (!input.cityName?.trim()) {
    fields.cityName = 'City name is required';
  }

  if (typeof input.isMainCity !== 'boolean') {
    fields.isMainCity = 'isMainCity must be true or false';
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError.badRequest('Validation failed', fields);
  }

  // Capture the existing city state before changing it.
  const beforeCity = await repo.findCityById(parsedCityId);

  if (!beforeCity) {
    throw ApiError.notFound('City not found');
  }

  const affectedRows = await repo.updateCity(parsedCityId, {
    cityName: input.cityName.trim(),
    isMainCity: input.isMainCity,
  });

  if (affectedRows === 0) {
    throw ApiError.notFound('City not found');
  }

  return {
    cityId: parsedCityId,
    cityName: input.cityName.trim(),
    isMainCity: input.isMainCity,
    beforeCity,
  };
};

exports.getAdminUsers = async () => {
  return repo.findAllUsers();
};