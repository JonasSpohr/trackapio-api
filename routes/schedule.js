const express = require('express');
var path = require('path')
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

<<<<<<< HEAD
var fs = require('fs'), PDFParser = require("pdf2json");

router.post('/pdfimport', asyncHandler(async (req, res) => {
    let pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", errData => console.error(errData) );
    pdfParser.on("pdfParser_dataReady", pdfData => {
        fs.writeFile("./files/ListaEntrega29456_01.json", JSON.stringify(pdfData));
    });
 
    pdfParser.loadPDF("./files/ListaEntrega29456.pdf");

    
    return res.send({ success: true, result: 'OK' });
    
}))
=======
var multer = require('multer');

const replaceall = require('replaceall');

router.post('/import', asyncHandler(async (req, res) => {
    let fileName = '';
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './uploads/')
        },
        filename: function (req, file, cb) {
            fileName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
            console.log(fileName)
            cb(null, fileName)
        }
    })

    var upload = multer({ storage: storage }).single('file')
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.send({ success: false, errorMessage: "Erro ao salvar o arquivo." });
        }        
        return res.send({ success: true, result: 'Sucesso ao realizar o upload' });
    });    
}));
>>>>>>> 634eb4c04fc7494fb0a9686c78ac3dca17b0d2cc

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

                //if this value is send with value true the route body also send the sms
                if (req.body.processSendSMS == true) {
                    sendSMStoClient(pkgIds, async () => {
                        newRoute.processed = true;
                        await newRoute.save();

                        return res.send({ success: true, result: newRoute });
                    });
                } else {
                    return res.send({ success: true, result: newRoute });
                }
            }
        });
    });
}));

router.post('/process', asyncHandler(async (req, res) => {
    let companySchedule = await Company.findById(req.body.companyId);
    if (companySchedule == null) {
        return res.send({ success: false, errorMessage: "Empresa parceira informada não encontrada." });
    }

    let schedule = await Route.findById(req.body.scheduleId);

    if (schedule == null) {
        return res.send({ success: false, errorMessage: "Rota não encontrada." });
    }

    let pkgIds = [];
    for (let i = 0; i < schedule.packages.length; i++) {
        pkgIds.push(schedule.packages[i]._id);
    }

    sendSMStoClient(pkgIds, async () => {
        schedule.processed = true;
        await schedule.save();
        return res.send({ success: true, result: 'OK' });
    });
}));

router.get('/:scheduleId', asyncHandler(async (req, res) => {

    let schedule = await Route.findById(req.params.scheduleId)
        .populate("employee")
        .populate({
            path: 'packages',
            model: 'Package',
            populate: {
                path: 'statusHistory',
                model: 'Status'
            }
        })
        .populate({
            path: 'packages',
            model: 'Package',
            populate: {
                path: 'client',
                model: 'Client'
            }
        });

    return res.send({ success: true, result: schedule });
}));

router.get('/package/:packageId', asyncHandler(async (req, res) => {
    let pkg = await Package.findById(req.params.packageId)
        .populate('statusHistory client');

    return res.send({ success: true, result: pkg });
}));

router.get('/all/:companyId', asyncHandler(async (req, res) => {
    let page = 1;
    let maxItems = 100000;

    if (req.query.page) {
        page = req.query.page;
    }

    if (req.query.maxItems) {
        maxItems = req.query.maxItems;
    }

    let schedules = await Route.find({ company: req.params.companyId })
        .populate("employee")
        .populate({
            path: 'packages',
            model: 'Package',
            populate: {
                path: 'statusHistory',
                model: 'Status'
            }
        })
        .populate({
            path: 'packages',
            model: 'Package',
            populate: {
                path: 'client',
                model: 'Client'
            }
        })
        .sort({ "dateSchedule": "descending" })
        .limit(maxItems)
        .skip(page == 1 ? 0 : (page - 1) * maxItems);

    return res.send({ success: true, result: schedules });
}));

router.get('/all/:companyId/today/', asyncHandler(async (req, res) => {
    let page = 1;
    let maxItems = 100000;
    let start = new Date();
    start.setHours(0, 0, 0, 0);

    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (req.query.page) {
        page = req.query.page;
    }

    if (req.query.maxItems) {
        maxItems = req.query.maxItems;
    }

    let schedules = await Route.find({ company: req.params.companyId, dateSchedule: { $gte: start, $lt: end } })
        .populate("employee")
        .populate({
            path: 'packages',
            model: 'Package',
            populate: {
                path: 'statusHistory',
                model: 'Status'
            }
        })
        .populate({
            path: 'packages',
            model: 'Package',
            populate: {
                path: 'client',
                model: 'Client'
            }
        })
        .sort({ "dateSchedule": "descending" })
        .limit(maxItems)
        .skip(page == 1 ? 0 : (page - 1) * maxItems);

    return res.send({ success: true, result: schedules });
}));

router.get('/employee/:employeeId/today/', asyncHandler(async (req, res) => {
    let page = 1;
    let maxItems = 100000;
    let start = new Date();
    start.setHours(0, 0, 0, 0);

    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (req.query.page) {
        page = req.query.page;
    }

    if (req.query.maxItems) {
        maxItems = req.query.maxItems;
    }

    let schedules = await Route.find({ employee: req.params.employeeId, dateSchedule: { $gte: start, $lt: end } })
        .populate("employee")
        .populate({
            path: 'packages',
            model: 'Package',
            populate: {
                path: 'statusHistory',
                model: 'Status'
            }
        })
        .populate({
            path: 'packages',
            model: 'Package',
            populate: {
                path: 'client',
                model: 'Client'
            }
        })
        .sort({ "dateSchedule": "descending" })
        .limit(maxItems)
        .skip(page == 1 ? 0 : (page - 1) * maxItems);

    return res.send({ success: true, result: schedules });
}));

router.delete('/:scheduleId', asyncHandler(async (req, res) => {
    let schedule = await Route.findById(req.params.scheduleId)
        .populate("employee")
        .populate({
            path: 'packages',
            model: 'Package',
            populate: {
                path: 'statusHistory',
                model: 'Status'
            }
        })
        .populate({
            path: 'packages',
            model: 'Package',
            populate: {
                path: 'client',
                model: 'Client'
            }
        });

    if (schedule == null) {
        return res.send({ success: false, errorMessage: "Rota não encontrada." });
    }

    for (let i = 0; i < schedule.packages.length; i++) {
        let pkg = schedule.packages[i];
        let pkgHistories = pkg.statusHistory;

        for (let h = 0; h < pkgHistories.length; h++) {
            let history = pkgHistories[h];

            await Status.findByIdAndRemove(history._id);
        }

        await Package.findByIdAndRemove(pkg._id);
    }

    await Route.findByIdAndRemove(schedule._id);

    return res.send({ success: true, result: 'OK' });
}));

async function sendSMStoClient(packages, callback) {
    moment.locale('pt-BR');

    for (let i = 0; i < packages.length; i++) {
        let pkg = await Package.findById(packages[i]).populate('client');
        let phoneNumber = pkg.client.phone;
        if (pkg != null) {
            try {
                let ptbrDate = moment(pkg.estimatedDate).format('L');
                let clientName = pkg.client.name.toString().split(' ')[0];
                let productName = pkg.name.toString().substring(0, 15);
                phoneNumber = clearPhoneNumber(pkg.client.phone);

                let msgText = `${clientName}, o pedido ${productName} será entregue ${ptbrDate}. Responda SIM para confimar ou NAO para o recebimento. STOP para nao receber mensagens.`;
                let msg = await totalVoiceClient.sms.enviar(phoneNumber, msgText, true);

                pkg.smsSID = msg.dados.id;
                await pkg.save();
            } catch (ex) {
                console.log(`Error to send sms to client ${pkg.client.name}, phone: ${phoneNumber} error: ${ex.message}`);
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
            newPkg.deliveryStatus = 'PENDING';

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

function clearPhoneNumber(phone) {
    let newPhone = phone;

    newPhone = replaceall(' ', '', newPhone);
    newPhone = replaceall('-', '', newPhone);
    newPhone = replaceall('_', '', newPhone);

    return newPhone;
}

module.exports = router;