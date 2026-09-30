const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

const cookieOptions = {
    httpOnly: true,
    path: "/",
    sameSite: process.env.COOKIE_SAME_SITE || "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
}

function signToken(user) {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured")
    return jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1d" })
}

function setAuthCookie(res, token) {
    const options = { httpOnly: cookieOptions.httpOnly, sameSite: cookieOptions.sameSite, secure: cookieOptions.secure }
    // Clear the old cookie scoped to /api/auth before replacing it with a site-wide cookie.
    res.clearCookie("token", { ...options, path: "/api/auth" })
    res.cookie("token", token, cookieOptions)
}

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {

    const { username, email, password } = req.body || {}

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Please provide username, email and password"
        })
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or: [ { username }, { email } ]
    })

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "Account already exists with this email address or username"
        })
    }

    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters long." })

    const hash = await bcrypt.hash(password, 10)

    const user = await userModel.create({
        username,
        email,
        password: hash
    })

    const token = signToken(user)

    setAuthCookie(res, token)


    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {

    const { email, password } = req.body || {}

    if (!email || !password) return res.status(400).json({ message: "Please provide email and password." })
    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const token = signToken(user)

    setAuthCookie(res, token)
    res.status(200).json({
        message: "User loggedIn successfully.",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    const token = req.cookies.token

    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    const clearOptions = { httpOnly: true, sameSite: cookieOptions.sameSite, secure: cookieOptions.secure }
    res.clearCookie("token", { ...clearOptions, path: "/" })
    // Remove cookies issued by the previous default /api/auth path as well.
    res.clearCookie("token", { ...clearOptions, path: "/api/auth" })

    res.status(200).json({
        message: "User logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id)
    if (!user) {
        res.clearCookie("token", { httpOnly: true, sameSite: cookieOptions.sameSite, secure: cookieOptions.secure, path: "/" })
        return res.status(401).json({ message: "Account no longer exists." })
    }

    // Refresh legacy auth cookies with the root path so interview API routes receive them.
    setAuthCookie(res, signToken(user))

    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}



module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}
