// auth/controller.js
// This file contains authentication-related functions responsible for managing user sessions using JWT.

// 1. login

// The login function handles user authentication. It verifies the user's credentials (ID/email and password),
// and if valid, generates an access token and a refresh token. The refresh token is stored in the database 
// for future validation. Based on the client type (web or mobile), it either sends the refresh token via a 
// secure HTTP-only cookie (for web) or includes it in the JSON response (for mobile), while always returning 
// the access token for API access.

// 2. refreshToken

// The refresh function is used to maintain user sessions without requiring them to log in again. It takes a 
// refresh token (from cookies for web or request body for mobile), verifies its validity, and checks it against 
// the stored token in the database. If valid, it generates new access and refresh tokens, updates the stored 
// refresh token (token rotation), and returns the new tokens to the client.

// 3. logout

// The logout function invalidates the user's session by clearing the stored refresh token in the database and 
// removing the refresh token cookie for web clients. This ensures that any existing tokens cannot be used to 
// access protected resources, effectively logging the user out of all sessions.

const { isValidUser } = require('./service')
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require("bcrypt");
const { generateAccessToken, generateRefreshToken } = require('./service');


async function login(req, res) {
    try {
        const { id, password } = req.body;

        if (!id || !password) {
            return res.status(400).json({ message: 'ID and password are required' });
        }

        let user;

        if (id.includes('@')) {
            user = await User.findOne({ auth_id: id });
        } else {
            if (!isValidUser(id)) {
                return res.status(400).json({ message: 'Invalid ID' });
            }
            user = await User.findOne({ auth_id: id });
        }

        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMobile = req.headers['x-client-type'] === 'mobile';

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        res.setHeader("Authorization", `Bearer ${accessToken}`);

        if (isMobile) {
            return res.status(200).json({
                role: user.role,
                accessToken: accessToken,
                refreshToken: refreshToken,
                auth_id: user.auth_id 
            });
        } else {
            res.cookie("refreshToken", refreshToken, {
            httpOnly: false,
            secure: true,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            role: user.role,
            accessToken:accessToken,
            auth_id: user.auth_id
        });
}

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function refreshToken(req, res) {
    try {
        const isMobile = req.headers['x-client-type'] === 'mobile';

        let refreshToken;

        if (isMobile) {
            refreshToken = req.body.refreshToken;
        } else {
            refreshToken = req.cookies.refreshToken;
        }

        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decoded.sub);

        if (!user) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        if (user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        user.refreshToken = newRefreshToken;
        await user.save();

        if (isMobile) {
            return res.status(200).json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            });
        } else {
            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.status(200).json({
                accessToken: newAccessToken
            });
        }

    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: 'Invalid refresh token' });
    }
}

async function logout(req, res) {
    try {
        const isMobile = req.headers['x-client-type'] === 'mobile';

        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.refreshToken = null;
        await user.save();

        if (!isMobile) {
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: true,
                sameSite: "strict"
            });
        }

        return res.status(200).json({ message: "Logged out successfully" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function validatePassword(password) {
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return pattern.test(password);
}

module.exports = {
    login,
    refreshToken,
    validatePassword,
    logout
}
