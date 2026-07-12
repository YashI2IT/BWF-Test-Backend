const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

function isValidUser (id) {
    const pattern = /^[A-Za-z0-9-]+$/;
    return pattern.test(id);
}

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user._id,
            role: user.role,
            auth_id: user.auth_id
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "60m",
            jwtid: uuidv4()
        }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user._id,
            role: user.role,
            auth_id: user.auth_id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: "7d",
            jwtid: uuidv4()
        }
    );
}

module.exports = {
    isValidUser,
    generateAccessToken,
    generateRefreshToken
}