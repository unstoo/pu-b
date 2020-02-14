var rp = require('request-promise');

// rp(optionsToSendSms)
//     .then(res => fs.writeFileSync('sendSmsResponse.json', JSON.stringify(res)))
//     .catch(e => console.log(e))

const sendSmsCode = async (phoneNumber, smsCode, sigmaToken) => {
    const optionsToSendSms = {
        uri: 'https://online.sigmasms.ru/api/sendings',
        method: 'POST',
        headers: {
            'Authorization': sigmaToken.token,
            'Content-Type': 'application/json'
        },
        json: true, 
        body: {
            "recipient": phoneNumber,
            "type": "sms",
            "payload": {
                "sender": "B-Media",
                "text": "Your sms code: " + smsCode
            }
        }   
    }


    try {
        const response = await rp(optionsToSendSms)
        // Store in DB: response.id -- status can be checked
        // fs.writeFileSync('sendSmsResponse.json', JSON.stringify(response))
        return [
            false,
            response
        ]
    
    } catch (e) {
        // If token old: update
        // console.log(e)
        console.log('e getting');
        
        return [
            true,
            e
        ]
    }
}
    
// sendSmsCode('+79046471416, 1337)
module.exports = {
    sendSmsCode
}