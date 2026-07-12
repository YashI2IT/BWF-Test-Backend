const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers["authorization"];

        if (!authHeader) {
            return res.status(401).json({ message: "Access token required" });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Invalid token format" });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        req.user = {
            id: decoded.sub,
            role: decoded.role,
            auth_id: decoded.auth_id
        };

        next();

    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: "Access denied" });
        }

        const userRole = String(req.user.role).trim().toLowerCase();
        const normalizedAllowedRoles = allowedRoles.map((role) =>
            String(role).trim().toLowerCase()
        );

        if (!normalizedAllowedRoles.includes(userRole)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        next();
    };
}


function authorizeSelfOrAdmin(req, res, next) {
    const { auth_id } = req.params;

    if (req.user.role === "admin") {
        return next();
    }

    if (req.user.auth_id !== auth_id) {
        return res.status(403).json({ message: "You can only access your own profile" });
    }

    next();
}

module.exports = {
    authenticateToken,
    authorizeRoles,
    authorizeSelfOrAdmin
};
