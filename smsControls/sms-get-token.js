var rp = require('request-promise');
const fs = require('fs')



const getToken = async (sigmaCredentials) => {
    const optionsToGetToken = {
        uri: 'https://online.sigmasms.ru/api/login',
        method: 'POST',
        headers: {'Content-Type' : 'application/json'},
        json: true,
        body: {
            username: sigmaCredentials.username,
            password: sigmaCredentials.password
        }
    };

    try {
        const response = await rp(optionsToGetToken)        
        
        return [
            false,  //error
            response //response.token
        ]
    
    } catch (e) {
        console.log(e)
        return [
            true,
            e
        ]
    }
}

module.exports = {
    getToken
}