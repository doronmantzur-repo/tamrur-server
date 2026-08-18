function authorize(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw { status: 403, message: "Forbidden: insufficient role." };
    }
    next();
  };
}

module.exports = { authorize };
