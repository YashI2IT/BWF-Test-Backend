const sanitizeObj = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Basic HTML escaping to prevent XSS in input strings
      obj[key] = obj[key].replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObj(obj[key]);
    }
  }
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) sanitizeObj(req.body);
  if (req.query) sanitizeObj(req.query);
  if (req.params) sanitizeObj(req.params);
  next();
};

module.exports = { sanitizeMiddleware };
