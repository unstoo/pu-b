const { sendSmsCode } = require('./sms-send-code.js')
const { getToken } = require('./sms-get-token.js')
const fs = require('fs')
const path = require('path')

console.log('----- 1')


 const sendSmsWithCode = async (phoneNumber, sigmaCredentials) => {
        console.log('----- 2');
        // TODO: Proper token update mechanism. Mustn't update on every request. (Token lives 1hr)
        const [errorToken, sigmaToken] = await getToken(sigmaCredentials)

        
        const numbers = Math.random().toString().split('')
        const randomCode = numbers.splice(2,6).join('')
        
        const [error, response] = await sendSmsCode(phoneNumber, randomCode, sigmaToken)
        console.log('------3: ');
   
       if (error) {
           // TODO: edge cases
           console.log(response.error);
           fs.writeFileSync('error-sendSmsWithCode-' + phoneNumber + '-' + Date.now() + '.json', JSON.stringify(response))
           return [
                true,
                response.error
            ]   
       }
   
       console.log('sendSmsCode() result:');
       console.log([
           null,
           randomCode
       ]);
       return [
        null,
        randomCode
    ]
   
 }


module.exports = {
    sendSmsWithCode
}

// sendSmsWithCode('+79046471416', sigmaCredentials)
