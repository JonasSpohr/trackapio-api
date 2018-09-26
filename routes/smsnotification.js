const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const moment = require('moment');

const Package = require('../models/Package.js');
const Status = require('../models/Status.js');

const totalvoice = require('totalvoice-node');
const totalVoiceClient = new totalvoice("4b0ab141619c1f66edb946e42afc8ddb");

const replaceall = require('replaceall');

router.post('/answer', asyncHandler(async (req, res) => {
  let pkg = await Package.findOne({ smsSID: req.body.sms_id });

  let newStatus = new Status();

  if (pkg != null) {
    newStatus.status = parseTextAnswer(req.body.resposta);
    newStatus.date = new Date();
    newStatus.description = 'A resposta do cliente foi: ' + newStatus.status;

    await newStatus.save();

    pkg.statusHistory.push(newStatus._id);
    await pkg.save();

    if (newStatus.status == 'CONFIRMADO') {
      sendConfirmSMStoClient(pkg._id, () => {
        return res.send({ success: true, result: "OK" });
      })
    } else if (newStatus.status == 'CANCELADO') {
      sendCancelSMStoClient(pkg._id, () => {
        return res.send({ success: true, result: "OK" });
      })
    } else {
      sendSorrySMStoClient(pkg._id, () => {
        return res.send({ success: true, result: "NOK" });
      })
    }
  }
}));

router.post('/beginroute', asyncHandler(async (req, res) => {
  let pkg = await Package.findById(req.body.packageId);

  if (pkg != null) {

    pkg.deliveryStatus = 'STARTED';
    await pkg.save();

    sendSMStoBeginRouteClient(pkg._id, () => {
      return res.send({ success: true, result: "OK" });
    })

  } else {
    return res.send({ success: false, result: "Pacote de entrega não encontrado." });
  }

}));

router.post('/delivered', asyncHandler(async (req, res) => {
  let pkg = await Package.findById(req.body.packageId);

  if (pkg != null) {

    pkg.deliveryStatus = 'DELIVERED';
    await pkg.save();

    sendDeliveredSMStoClient(pkg._id, () => {
      return res.send({ success: true, result: "OK" });
    })

  } else {
    return res.send({ success: false, result: "Pacote de entrega não encontrado." });
  }

}));

router.post('/faildelivered', asyncHandler(async (req, res) => {
  let pkg = await Package.findById(req.body.packageId);

  if (pkg != null) {

    pkg.deliveryStatus = 'FAILDELIVERED';
    await pkg.save();

    sendFailDeliveredSMStoClient(pkg._id, () => {
      return res.send({ success: true, result: "OK" });
    })

  } else {
    return res.send({ success: false, result: "Pacote de entrega não encontrado." });
  }

}));

router.post('/fail', asyncHandler(async (req, res) => {
  return res.send({ success: true, result: req.body });
}));

async function sendConfirmSMStoClient(id, callback) {
  moment.locale('pt-BR');

  let pkg = await Package.findById(id).populate('client');

  if (pkg != null) {
    try {
      let clientName = pkg.client.name.toString().split(' ')[0];

      let msgText = `${clientName}, perfeito! Aguarde a sua encomenda na data informada, agradecemos o contato.`;
      let phone = clearPhoneNumber(pkg.client.phone);
      let msg = await totalVoiceClient.sms.enviar(phone, msgText, true);

    } catch (ex) {
      console.log(`Error to send confirm sms to client ${pkg.client.name}, phone: ${pkg.client.phone} error: ${ex.message}`);
    }
  }
  callback();
}

async function sendCancelSMStoClient(id, callback) {
  moment.locale('pt-BR');

  let pkg = await Package.findById(id).populate('client');

  if (pkg != null) {
    try {
      let clientName = pkg.client.name.toString().split(' ')[0];

      let msgText = `${clientName}, sem problemas! Logo entraremos em contato para verificar a melhor data para realizar a entrega.`;
      let phone = clearPhoneNumber(pkg.client.phone);
      let msg = await totalVoiceClient.sms.enviar(phone, msgText, false);

    } catch (ex) {
      console.log(`Error to send cancel sms to client ${pkg.client.name}, phone: ${pkg.client.phone} error: ${ex.message}`);
    }
  }
  callback();
}

async function sendSorrySMStoClient(id, callback) {
  moment.locale('pt-BR');

  let pkg = await Package.findById(id).populate('client');

  if (pkg != null) {
    try {
      let clientName = pkg.client.name.toString().split(' ')[0];
      let ptbrDate = moment(pkg.estimatedDate).format('L');
      let msgText = `Ola ${clientName}, responda SIM para confirmar a possibilidade de recebimento e NAO caso nao possa receber na data ${ptbrDate}.`;
      let phone = clearPhoneNumber(pkg.client.phone);
      let msg = await totalVoiceClient.sms.enviar(phone, msgText, true);

      pkg.smsSID = msg.dados.id;
      await pkg.save();
    } catch (ex) {
      console.log(`Error to send sorry sms to client ${pkg.client.name}, phone: ${pkg.client.phone} error: ${ex.message}`);
    }
  }
  callback();
}

async function sendSMStoBeginRouteClient(id, callback) {
  moment.locale('pt-BR');

  let pkg = await Package.findById(id).populate('client');
  let phoneNumber = pkg.client.phone;
  if (pkg != null) {
    try {
      let clientName = pkg.client.name.toString().split(' ')[0];
      let productName = pkg.name.toString().substring(0, 15);
      phoneNumber = clearPhoneNumber(pkg.client.phone);

      let msgText = `${clientName}, o produto ${productName} saiu para entrega :) . Responda SIM para confimar ou NAO para o recebimento. STOP para nao receber mensagens.`;
      let msg = await totalVoiceClient.sms.enviar(phoneNumber, msgText, true);

      pkg.smsSID = msg.dados.id;
      await pkg.save();
    } catch (ex) {
      console.log(`Error to send sms to client ${pkg.client.name}, phone: ${phoneNumber} error: ${ex.message}`);
    }

  }

  callback();
}

async function sendDeliveredSMStoClient(id, callback) {
  moment.locale('pt-BR');

  let pkg = await Package.findById(id).populate('client');

  if (pkg != null) {
    try {
      let clientName = pkg.client.name.toString().split(' ')[0];

      let msgText = `${clientName}, a entrega do seu produto foi efetuada! Agradecemos a preferencia :) .`;
      let phone = clearPhoneNumber(pkg.client.phone);
      let msg = await totalVoiceClient.sms.enviar(phone, msgText, false);

    } catch (ex) {
      console.log(`Error to send cancel sms to client ${pkg.client.name}, phone: ${pkg.client.phone} error: ${ex.message}`);
    }
  }
  callback();
}

async function sendFailDeliveredSMStoClient(id, callback) {
  moment.locale('pt-BR');

  let pkg = await Package.findById(id).populate('client');

  if (pkg != null) {
    try {
      let clientName = pkg.client.name.toString().split(' ')[0];

      let msgText = `${clientName}, a entrega do seu produto não foi efetuada! Entraremos em contato para agendar a melhor data.`;
      let phone = clearPhoneNumber(pkg.client.phone);
      let msg = await totalVoiceClient.sms.enviar(phone, msgText, false);

    } catch (ex) {
      console.log(`Error to send cancel sms to client ${pkg.client.name}, phone: ${pkg.client.phone} error: ${ex.message}`);
    }
  }
  callback();
}

function parseTextAnswer(text) {
  if (text.toString().toUpperCase() == 'SIM') {
    return "CONFIRMADO"
  }

  if (text.toString().toUpperCase() == 'NÃO' || text.toString().toUpperCase() == 'NAO') {
    return "CANCELADO"
  }

  return text;
}

function clearPhoneNumber(phone) {
  let newPhone = phone;

  newPhone = replaceall(' ', '', newPhone);
  newPhone = replaceall('-', '', newPhone);
  newPhone = replaceall('_', '', newPhone);

  return newPhone;
}

module.exports = router;