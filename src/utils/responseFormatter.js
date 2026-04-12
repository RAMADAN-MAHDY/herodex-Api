export const successResponse = (res, message, data = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (res, message, errors = [], status = 500) => {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
};
