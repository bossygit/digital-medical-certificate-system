// Middleware to check user roles after authentication

// Checks if the authenticated user has the 'doctor' role
exports.isDoctor = (req, res, next) => {
    if (req.user && req.user.role === 'doctor') {
        next(); // User has the required role, proceed
    } else {
        res.status(403).json({ message: 'Forbidden: Access restricted to Doctors.' });
    }
};

// Checks if the authenticated user has the 'dgtt_admin' role
exports.isDgttAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'dgtt_admin') {
        next(); // User has the required role, proceed
    } else {
        res.status(403).json({ message: 'Forbidden: Access restricted to DGTT Administrators.' });
    }
};

// Checks if the authenticated user has either 'dgtt_staff' or 'dgtt_admin' role
exports.isDgttStaffOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'dgtt_staff' || req.user.role === 'dgtt_admin')) {
        next(); // User has one of the required roles, proceed
    } else {
        res.status(403).json({ message: 'Forbidden: Access restricted to DGTT Staff or Administrators.' });
    }
};

// Generic function to check for multiple allowed roles
// Example usage: checkRole(['doctor', 'dgtt_admin'])
exports.checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }
        if (roles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({ message: `Forbidden: Access restricted to roles: ${roles.join(', ')}.` });
        }
    };
}; 