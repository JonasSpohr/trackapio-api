const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const SHA256 = require("crypto-js/sha256");

const User = require('../models/User.js');
const Company = require('../models/Company.js');
const Employee = require('../models/Employee.js');
const Route = require('../models/Route.js');
const Package = require('../models/Package.js');
const Status = require('../models/Status.js');
const Client = require('../models/Client.js');

router.post('/', asyncHandler(async (req, res) => { 
    let companySchedule = await Company.findById(req.body.companyId);
    if (companySchedule == null) {
        return res.send({ success: false, errorMessage: "Empresa parceira informada não encontrada." });
    }

    let userLogged = await User.findById(req.body.userId);
    if (userLogged == null) {
        return res.send({ success: false, errorMessage: "Usuario logado informado não encontrado." });
    }

    let employee = await Employee.findOne({ socialNumber: req.body.employee.socialNumber });
    if (employee == null) {
        let newEmployeeUser = new User();
        newEmployeeUser.email = req.body.employee.email;
        newEmployeeUser.phone = req.body.employee.phone;
        newEmployeeUser.pwd = SHA256('12345678').toString();
        newEmployeeUser.authToken = SHA256('12345678').toString();
        newEmployeeUser.active = true;
        await newEmployeeUser.save();

        employee = new Employee(req.body.employee);
        employee.company = companySchedule._id;
        employee.active = true;
        employee.user = newEmployeeUser._id;
        await employee.save();
    }

    let newRoute = new Route();
    newRoute.active = true;
    newRoute.company = companySchedule._id;
    newRoute.employee = employee._id;
    newRoute.dateSchedule = req.body.dateSchedule;
    newRoute.packages = [];
    await newRoute.save();

    //for each package in the route, we need to validate if all required information were filled.
    validateRoutePackages(req.body, async (err, isOk) => {
        if (!isOk) {
            return res.send({ success: false, errorMessage: err });
        }

        //after we validate all the packages, we need to save then in the database
        createPackages(newRoute._id, req.body.packages, async (err, pkgIds) => {
            if (err) {
                rollbackPackages(pkgIds, () => {
                    return res.send({ success: false, errorMessage: err.message });
                });
            } else {
                newRoute.packages = result;
                await newRoute.save();
                return res.send({ success: true, result: newRoute });
            }
        });
    });
}));

function validateRoutePackages(route, callback) {
    try {
        for (let i = 0; i < route.packages.length; i++) {
            let pkg = route.packages[i];

            //#region Client Validations
            if (!pkg.client) {
                return callback('Existem pacotes na rota sem cliente informado.', false);
            }

            if (!pkg.client.name || pkg.client.name == '') {
                return callback('Existem clientes sem nome informado.', false);
            }

            if (!pkg.client.phone || pkg.client.phone == '') {
                return callback('Existem clientes sem telefone informado.', false);
            }

            if (!pkg.client.socialNumber || pkg.client.socialNumber == '') {
                return callback('Existem clientes sem CPF/CNPJ informado.', false);
            }

            if (!pkg.client.socialNumber || pkg.client.socialNumber == '') {
                return callback('Existem clientes sem CPF/CNPJ informado.', false);
            }
            //#endregion Client Validations

            //#region Client Address Validations
            if (!pkg.client.address) {
                return callback('Existem pacotes na rota sem endereço informado.', false);
            }

            if (!pkg.client.address.street || pkg.client.address.street == '') {
                return callback('Existem pacotes na rota sem logradouro informado no endereço.', false);
            }

            if (!pkg.client.address.number || pkg.client.address.number == '') {
                return callback('Existem pacotes na rota sem número informado no endereço.', false);
            }

            if (!pkg.client.address.zipCode || pkg.client.address.zipCode == '') {
                return callback('Existem pacotes na rota sem CEP informado no endereço.', false);
            }

            if (!pkg.client.address.city || pkg.client.address.city == '') {
                return callback('Existem pacotes na rota sem cidade informada no endereço.', false);
            }

            if (!pkg.client.address.state || pkg.client.address.state == '') {
                return callback('Existem pacotes na rota sem estado informado no endereço.', false);
            }
            //#endregion Client Address Validations

        }
    } catch (ex) {
        callback(ex.message, false);
    }

    return callback(null, true);
}

async function createPackages(routeId, packages, callback) {
    let pkgIds = [];
    try {
        for (let i = 0; i < packages.length; i++) {
            let originalPackage = packages[i];
            let newPkg = new Package(packages[i]);

            let clientPackage = await Client.findOne({
                socialNumber: newPkg.client.socialNumber
            });

            if (clientPackage == null) {
                let clientNewUser = new User();
                clientNewUser.active = true;
                clientNewUser.email = originalPackage.email;
                await clientNewUser.save();
            }

            let beginStatus = new Status();
            beginStatus.statusHistory = 'CREATED';
            beginStatus.date = new Date();
            beginStatus.description = 'Registro criado.';

            await beginStatus.save();

            newPkg.client = clientPackage._id;
            newPkg.route = routeId;
            newPkg.statusHistory = [];
            newPkg.statusHistory.push(beginStatus._id);

            await newPkg.save();
            pkgIds.push(newPkg._id);
        }

        return callback(null, pkgIds);
    } catch (ex) {
        return callback({
            message: ex.message
        }, pkgIds);
    }
}

async function rollbackPackages(packagesIds, callback) {
    //remove all packages created
    for (let i = 0; i < packagesIds.length; i++) {
        await Package.findByIdAndRemove(packagesIds[i]);
    }
}

module.exports = router;