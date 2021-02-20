"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const express_1 = require("express");
const schema_1 = require("../schema");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("../dotenv"));
const string_encode_decode_1 = require("string-encode-decode");
const User_1 = __importDefault(require("../models/User"));
const router = express_1.Router();
function getToken(user, res) {
    console.log(user);
    jsonwebtoken_1.default.sign(user, dotenv_1.default.SECRET_TOKEN, {
        expiresIn: parseInt(dotenv_1.default.JWT_TIME)
    }, (err, token) => {
        if (err) {
            const error = new Error('Something went wrong :(');
            res.status(500).json({ error: error.message });
        }
        res.json({ token });
    });
}
router.post('/create', async (req, res) => {
    const user = req.body;
    const valid = schema_1.signupSchema.validate(user); // Check if username and password is valid
    if (valid.error) {
        const error = new Error(valid.error.details[0].message);
        res.status(415).json({ error: error.message });
        return;
    }
    const duplicateUser = await User_1.default.findOne({ username: user.username }); // Check duplicate user
    if (duplicateUser) {
        const error = new Error('Duplicate username');
        res.status(409).json({ error: error.message });
        return;
    }
    const hashedPassword = await bcrypt_1.default.hash(user.password, 15);
    user.password = hashedPassword;
    const newUser = new User_1.default(user);
    newUser.save();
    user.ha_password = string_encode_decode_1.encode(user.ha_password);
    delete user.password;
    delete user.email;
    getToken(user, res);
});
router.post('/login', async (req, res) => {
    const user = req.body;
    const valid = schema_1.loginSchema.validate(user);
    if (valid.error) {
        const error = new Error(valid.error.details[0].message);
        res.status(415).json({ error: error.message });
        return;
    }
    const userExists = await User_1.default.findOne({ username: user.username });
    if (!userExists) {
        const error = new Error('No username');
        res.status(404).json({ error: error.message });
        return;
    }
    const passwordSame = await bcrypt_1.default.compare(user.password, userExists.password);
    user.ha_password = string_encode_decode_1.encode(user.ha_password);
    if (passwordSame) {
        getToken(user, res);
    }
    else {
        res.json({ error: 'Password is incorrect' });
    }
});
exports.default = router;
