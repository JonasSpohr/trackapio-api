const express = require('express');
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const asyncHandler = require('express-async-handler');

const User = require('../models/User.js');
const Employee = require('../models/Employee.js');

router.post('/email', asyncHandler(async (req, res) => {
    let pwdCrypt = SHA256(req.body.pwd);
    let user = await User.findOne({ email: { $regex: new RegExp(req.body.email, "i") }, pwd: pwdCrypt.toString(), active: true });

    if (user == null) {
        res.status(401);
        return res.send({ success: false, errorMessage: "Unauthorized user" });
    }

    user.lastLoginDate = new Date();
    user.authToken = SHA256('last_login' + new Date() + user.email);

    await user.save();

    let employee = await Employee.findOne({ user : user._id });

    let UsuarioRetorno = {
        _id: user._id,
        name: user.name,
        authToken: user.authToken,
        companyId : employee.company,
        employeeId : employee._id,
        type : employee.type
    }

    return res.send({ success: true, result: UsuarioRetorno });    
}));

module.exports = router;