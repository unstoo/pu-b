var request = require('request');
const fs = require('fs')
const sigma = JSON.parse(fs.readFileSync('sms-request.json', 'utf8'))

const optionsToSendSms = {
    uri: 'https://online.sigmasms.ru/api/sendings',
    method: 'POST',
    headers: {
        'Authorization': sigma.token,
        'Content-Type': 'application/json'
    },
    json: true, 
    body: {
        "recipient": "+79046471416",
        "type": "sms",
    "payload": {
        "sender": "B-Media",
        "text": "Your sms code:" + '3311'
        }
    }   
}

var optionsValidateStatus = {
  uri: 'https://online.sigmasms.ru/api/sendings/' + '9292352f-4f30-4026-8944-1271df9a7a64',
  method: 'GET',
  headers: {
    'Authorization': tokenObj.token,
    'content-type' : 'application/json'
  },

};

request(optionsToSendSms, function (error, response, body) {
    fs.writeFileSync('sms-request2.json', JSON.stringify(response))
    console.log('++++++')
 
});

function sendSms() {
    // Generate sms code

    // Get new token

    // Try to send sms

    // status === 200
    // Correct phone number

    // status === 422
    // Incorrect phone number
}