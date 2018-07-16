const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const SHA256 = require("crypto-js/sha256");
const moment = require('moment');

const User = require('../models/User.js');
const Company = require('../models/Company.js');
const Employee = require('../models/Employee.js');
const Route = require('../models/Route.js');
const Package = require('../models/Package.js');
const Status = require('../models/Status.js');
const Client = require('../models/Client.js');

const totalvoice = require('totalvoice-node');
const totalVoiceClient = new totalvoice("4b0ab141619c1f66edb946e42afc8ddb");

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
            await Route.findByIdAndRemove(newRoute._id);
            return res.send({ success: false, errorMessage: err });
        }

        //after we validate all the packages, we need to save then in the database
        createPackages(newRoute._id, req.body.packages, async (err, pkgIds) => {
            if (err) {
                rollbackPackages(pkgIds, async () => {
                    await Route.findByIdAndRemove(newRoute._id);
                    return res.send({ success: false, errorMessage: err.message });
                });
            } else {
                newRoute.packages = pkgIds;
                await newRoute.save();
                sendSMStoClient(pkgIds, () => {
                    return res.send({ success: true, result: newRoute });
                });                
            }
        });
    });
}));

async function sendSMStoClient(packages, callback) {
    moment.locale('pt-BR');

    for (let i = 0; i < packages.length; i++) {
        let pkg = await Package.findById(packages[i]).populate('client');

        if (pkg != null) {
            try{
                let ptbrDate = moment(pkg.estimatedDate).format('L');
                let clientName = pkg.client.name.toString().split(' ')[0];
                let productName = pkg.name.toString().substring(0, 15);
                
                let msgText = `${clientName}, o produto ${productName} será entregue ${ptbrDate}. Responda SIM para confimar ou NAO para o recebimento. STOP para parar de receber mensagens`;
                let msg = await totalVoiceClient.sms.enviar(pkg.client.phone, msgText, true);

                pkg.smsSID = msg.dados.id;
                await pkg.save();
            }catch(ex){
                console.log(`Error to send sms to client ${pkg.client.name}, phone: ${pkg.client.phone} error: ${ex.message}`);
            }            
        }
    }

    callback();
}

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
        return callback(ex.message, false);
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
                socialNumber: originalPackage.client.socialNumber
            });

            if (clientPackage == null) {
                clientNewUser = await User.findOne({ email: originalPackage.client.email });

                if (clientNewUser == null) {
                    clientNewUser = new User();
                    clientNewUser.name = originalPackage.client.name;
                    clientNewUser.active = true;
                    clientNewUser.email = originalPackage.client.email;
                    await clientNewUser.save();
                }

                clientPackage = new Client(originalPackage.client);
                clientPackage.user = clientNewUser._id;
                await clientPackage.save();
            }

            let beginStatus = new Status();
            beginStatus.status = 'CREATED';
            beginStatus.date = new Date();
            beginStatus.description = 'Registro criado.';

            await beginStatus.save();

            newPkg.client = clientPackage._id;
            newPkg.route = routeId;
            newPkg.active = true;
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

    callback();
}

module.exports = router;