const { Client } = require('pg')

const clientSettings = {
    user: 'postgres',
    host: 'localhost',
    database: 'paysunion',
    password: 'postgres',
    port: 5432,
}


async function storePhoneNumber(phoneNumber, smsCode) {
    const client = new Client(clientSettings)
    try { 
        await client.connect() 
    } catch(e) {
        console.log('storePhoneNumber() couldnt connect to pg. error: \n')
        console.log(e)
        await client.end()
        return false
    }

    const isAlreadyStored = await isPhoneNumberStored(phoneNumber)
    
    if (isAlreadyStored) return false

    try {
        const resposne = await client
        .query(`INSERT INTO public.users (phonenumber, smscode) VALUES ($1::text, $2::integer)`, [phoneNumber, smsCode])
    } catch (e) {
        console.log('couldnt storePhoneNumber to pg. error: \n')
        console.log(e)
        await client.end()
        return false
    }
    
    await client.end()
    return true 
}


async function isPhoneNumberStored(phoneNumber) {
    const client = new Client(clientSettings)
    try { 
        await client.connect() 
    } catch(e) {
        console.log('storePhoneNumber() couldnt connect to pg. error: \n')
        console.log(e)
        await client.end()  
        return false
    }

    try {
        const response = await client
            .query(`SELECT EXISTS(SELECT * FROM public.users WHERE phonenumber = $1::text)`, [phoneNumber])  
            await client.end()  
            return response.rows[0].exists
    } catch (e) {
        console.log('error while isPhoneNumberStored() against pg: \n')
        console.log(e)
        await client.end()  
        return false
    }
}

async function matchSmsCode(phoneNumber, smsCode) {
    const client = new Client(clientSettings)
    try { 
        await client.connect() 
    } catch(e) {
        console.log('matchSmsCode() couldnt connect to pg. error: \n'); console.log(e)
        await client.end()  
        return false
    }

    try {
        const response = await client
            .query(`SELECT * FROM public.users WHERE phonenumber = $1::text AND smscode = $2::integer`, [phoneNumber, smsCode])  
            await client.end()
            console.log(response.rowCount === 1)
            return response.rowCount === 1
    } catch (e) {
        console.log('error while matchSmsCode() against pg: \n'); console.log(e)
        await client.end()  
        return false
    }
}

async function setVerified(phoneNumber) {
    const client = new Client(clientSettings)
    try { 
        await client.connect() 
    } catch(e) {
        console.log('setVerified() couldnt connect to pg. error: \n'); console.log(e)
        await client.end()  
        return false
    }

    try {
        const response = await client
            .query(`UPDATE public.users SET smscode_verified = $1::boolean WHERE phonenumber = $2::text`, [true, phoneNumber])  
            await client.end()
            console.log(response)
            return response.rows.length === 1
    } catch (e) {
        console.log('error while setVerified() against pg: \n'); console.log(e)
        await client.end()  
        return false
    }
}

const setPassword = async (password, phoneNumber) => {
    const client = new Client(clientSettings)
    try { 
        await client.connect() 
    } catch(e) {
        console.log('setPassword() couldnt connect to pg. error: \n'); console.log(e)
        await client.end()  
        return false
    }

    try {
        const response = await client
            .query(`UPDATE public.users SET password = $1::text WHERE phonenumber = $2::text`, [password, phoneNumber])  
            await client.end()
            console.log(response)
            return response.rows.length === 1
    } catch (e) {
        console.log('error while setPassword() against pg: \n'); console.log(e)
        await client.end()  
        return false
    }
}

const setEmail = async (email, phoneNumber) => {
    const client = new Client(clientSettings)
    try { 
        await client.connect() 
    } catch(e) {
        console.log('setEmail() couldnt connect to pg. error: \n'); console.log(e)
        await client.end()  
        return false
    }

    try {
        const response = await client
            .query(`UPDATE public.users SET email = $1::text WHERE phonenumber = $2::text`, [email, phoneNumber])  
            await client.end()
            console.log(response)
            return response.rows.length === 1
    } catch (e) {
        console.log('error while setEmail() against pg: \n'); console.log(e)
        await client.end()  
        return false
    }
}

const setPersonalData = async (firstName, lastName, patronymic, dob, country, phoneNumber) => {
    const client = new Client(clientSettings)
    try { 
        await client.connect() 
    } catch(e) {
        console.log('setPersonalData() couldnt connect to pg. Error: \n'); console.log(e)
        await client.end()  
        return false
    }

    try {
        const query = `UPDATE public.users`
        + ` SET firstname = $1::text, lastname = $2::text, patronymic = $3::text, dob = $4::text, country = $5::text ` 
        + `WHERE phonenumber = $6::text`
        const data = [firstName, lastName, patronymic, dob, country, phoneNumber]
        const response = await client
            .query(query, data)  
            await client.end()
            console.log(response)
            return response.rows.length === 1
    } catch (e) {
        console.log('Error while setPersonalData() against pg: \n'); console.log(e)
        await client.end()  
        return false
    }
}

const setAccountType = async (accountType, phoneNumber) => {
    const client = new Client(clientSettings)
    try { 
        await client.connect() 
    } catch(e) {
        console.log('setAccountType() couldnt connect to pg. error: \n'); console.log(e)
        await client.end()  
        return false
    }

    try {
        const response = await client
            .query(`UPDATE public.users SET accounttype = $1::text WHERE phonenumber = $2::text`, [accountType, phoneNumber])  
            await client.end()
            console.log(response)
            return response.rows.length === 1
    } catch (e) {
        console.log('error while setAccountType() against pg: \n'); console.log(e)
        await client.end()  
        return false
    }
}

const getAccountHolderName = async (phoneNumber) => {
    const client = new Client(clientSettings)
    try { 
        await client.connect() 
    } catch(e) {
        console.log('storePhoneNumber() couldnt connect to pg. error: \n')
        console.log(e)
        await client.end()  
        return false
    }

    try {
        const response = await client
            .query(`SELECT firstname, lastname FROM public.users WHERE phonenumber = $1::text`, [phoneNumber])  
            await client.end()  
            return response.rows[0]
    } catch (e) {
        console.log('error while isPhoneNumberStored() against pg: \n')
        console.log(e)
        await client.end()  
        return false
    }
}

const setAddress = async (country, state, city, zip, addressone, addresstwo ,phoneNumber) => {
    const client = new Client(clientSettings)
    try { 
        await client.connect() 
    } catch(e) {
        console.log('setAddress() couldnt connect to pg. error: \n')
        console.log(e)
        await client.end()  
        e.debug = 'setAddress() couldnt connect to pg. error: \n'
        return [
            true,
            e
        ]
    }

    try {

        const query = `UPDATE public.users`
        + ` SET country = $1::text, state = $2::text, city = $3::text, zip = $4::text, addressone = $5::text, addresstwo = $6::text ` 
        + `WHERE phonenumber = $7::text`
        const data = [country, state, city, zip, addressone, addresstwo, phoneNumber]
        const response = await client.query(query, data)
        await client.end() 
   
        return [
            null,
            response.rows[0]
        ]
    } catch (e) {
        console.log('error while setAddress() against pg: \n')
        console.log(e)
        await client.end()  
        e.debug = 'error while setAddress() against pg: \n'
        return [
            true,
            e
        ]
    }

}

const setIdData = async (idDateIssue, idDateExpiration, idDivsionCode, idIssuer, idSeries, idNumber, sex, idType, phoneNumber) => {
    const client = new Client(clientSettings)
    try { 
        await client.connect() 
    } catch(e) {
        console.log('setIdData() couldnt connect to pg. error: \n')
        console.log(e)
        await client.end()  
        e.debug = 'setIdData() couldnt connect to pg. error: \n'
        return [
            true,
            e
        ]
    }

    try {

        const query = `UPDATE public.users`
        + ` SET iddateissue = $1::text, iddateexpiration = $2::text, iddivsioncode = $3::text,` 
        + ` idissuer = $4::text, idseries = $5::text, idnumber = $6::text, sex = $7::text, idtype = $8::text` 
        + ` WHERE phonenumber = $9::text`
        const data = [idDateIssue, idDateExpiration, idDivsionCode, idIssuer, idSeries, idNumber, sex, idType, phoneNumber]
        const response = await client.query(query, data)
        await client.end() 
   
        return [
            null,
            response.rows[0]
        ]
    } catch (e) {
        console.log('error while setIdData() against pg: \n')
        console.log(e)
        await client.end()  
        e.debug = 'error while setIdData() against pg: \n'
        return [
            true,
            e
        ]
    }
}



// setPersonalData('Joe', 'Doe', '', '31-12-1965', 'United States', 996) -- OK

module.exports = {
    storePhoneNumber,
    isPhoneNumberStored,
    matchSmsCode,
    setVerified,
    setPassword,
    setEmail,
    setPersonalData,
    setAccountType,
    getAccountHolderName,
    setAddress,
    setIdData
}