var fs = require('fs');
const path = require('path')
var express = require('express');
var cors = require('cors');
const fileUpload = require('express-fileupload');
var bodyParser = require('body-parser')
const jwt = require('jsonwebtoken');
const jwtSecret = "mysuperdupersecret";

const rawCredentials = fs.readFileSync(path.join(__dirname, './smsControls/sigmaCredentials.json'), 'utf8')
const sigmaCredentials = JSON.parse(rawCredentials)

const { sendSmsWithCode } = require('./smsControls/index.js')
const { 
    storePhoneNumber, isPhoneNumberStored,
    matchSmsCode, setVerified, 
    setPassword, setEmail,
    setPersonalData, setAccountType, 
    getAccountHolderName, setAddress, setIdData,
    setFreelanceInfo, setTxSurvey } = require('./db.js')

const app = express();


function moveFile(soure, dest, err) {
    try {
        var source = fs.createReadStream(soure);
        var dest = fs.createWriteStream(dest, {flags: 'w+'});
        
    } catch (e) {
        console.log('Couldnt move file'); 
        console.log(e)
        return 
    }

    source.pipe(dest);
        source.on('end', function() { console.log('copied')});
        source.on('error', function(err) { console.log('err copying') });
    
}

app.use(cors())
app.use(bodyParser.json())
// JWT
app.use((req, res, next) => {
    // login does not require jwt verification
    if (req.path == '/' || req.path == '/login') {
      // next middleware
      return next()
    }

    if (req.path == '/api') {
        const newPhoneNumberStep = req.body.phoneNumber && req.body.new
        const smsCodeVerificatioStep = req.body.smsCodeToMatch && req.body.phoneNumber
        if (newPhoneNumberStep || smsCodeVerificatioStep) {
            return next()
        }
    }
  
    // get token from request header Authorization
    
    const token = req.headers.authorization
  
    // Debug print
    console.log("")
    console.log(req.path)
    console.log("authorization:", token)
  
    // Token verification
    try {
      var decoded = jwt.verify(token, jwtSecret);
      req.body.phoneNumber = decoded.phoneNumber
      req.decodedJWT = decoded
      console.log("decoded", decoded)
    } catch (err) {
      // Catch the JWT Expired or Invalid errors
      return res.status(401).json({ status: "error", body: err.message, path: req.path })
    }
  
    // next middleware
    next()
  });


app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : path.join(__dirname, 'tmp')
}))

// app.get("/login", (req, res) => {
//     // generate a constant token, no need to be fancy here
//     const token = jwt.sign({ "username": "89046471416" }, jwtSecret, { expiresIn: 60 * 60 }) // 1 min token
//     // return it back
//     res.json({ "token": token })
//   });

app.post('/api', async function (req, res) {
    console.log(req.body)
    const { body } = req

    if (body.phoneNumber && body.new) {

        const {phoneNumber} = body
        const numberIsFound = await isPhoneNumberStored(phoneNumber)

        if (numberIsFound) {
            return res.json({ status: 'ok', value: phoneNumber })
        }

        // TODO: Invalidate SMS code after 30 sec
        // TODO: Throttle bruteforce
        const [error, smsCode] = await sendSmsWithCode(phoneNumber, sigmaCredentials)

        if (!error) {
            const result = await storePhoneNumber(phoneNumber, smsCode)
            return res.json({ status: 'ok', value: phoneNumber })
        }

        if (error) {
            return res.json({ status: 'error', value: 'Invalid phone number' })
        }

    } 
    
    
    else if (body.smsCodeToMatch && body.phoneNumber) {
        const {smsCodeToMatch, phoneNumber} = body
        // const [error] = matchSmsCode(phoneNumber, req.body.smsCodeToMatch)

        if (!Number.parseInt(smsCodeToMatch)) {
            return res.json({ status: 'error', value: 'SMS code doesn\'t match.' })
        }

        const itDoesMatch = await matchSmsCode(phoneNumber, Number.parseInt(smsCodeToMatch))

        if (itDoesMatch) {
            await setVerified(phoneNumber)
            // Authenicate session
            const token = jwt.sign({ "phoneNumber": phoneNumber }, jwtSecret, { expiresIn: 60 * 60 * 24 })
            return res.json({ status: 'ok', value: 'SMS code match.', "token": token })

        }

        if (!itDoesMatch) {
            // TODO: Throttle bruteforce
            return res.json({ status: 'error', value: 'SMS code deosn\'t match.' })
        }

    } 
    
    else if (body.password) {
        //TODO: Salt & hash password
        const {password, phoneNumber} = body
        await setPassword(password, phoneNumber)
        return res.json({ status: 'ok', value: 'Password\'s set.' })
    }

    else if (body.email) {
        const {email, phoneNumber} = body
        await setEmail(email, phoneNumber)
        return res.json({ status: 'ok', value: 'Email\'s set.' })
    } 

    else if (body.personalData && body.personalData.firstName 
        && body.personalData.lastName && body.personalData.dob && body.personalData.country) {

        const {phoneNumber} = body
        const patronymic = req.body.personalData.patronymic || ''
        const {firstName, lastName, dob, country} = body.personalData

        await setPersonalData(firstName, lastName, patronymic, dob, country, phoneNumber)
        return res.json({ status: 'ok', value: 'Personal data\'s set.' })
    } 
    
    else if (body.accountType && ['personal', 'business', 'freelance'].includes(body.accountType.toLowerCase())) {
        const {accountType, phoneNumber} = body 
        await setAccountType(accountType, phoneNumber)
        return res.json({ status: 'ok', value: 'Account type\'s set.' })
    }

    
    else if (req.body.addressData && req.body.addressData.city 
        && req.body.addressData.state && req.body.addressData.zip && req.body.addressData.addressOne) {
            const {phoneNumber, addressData} = body
            const {country, state, city, zip, addressOne, addressTwo} = addressData
            const [error, response] = await setAddress(country, state, city, zip, addressOne, addressTwo, phoneNumber)

            if (error) {
                return res.json({ status: 'error', value: 'Something went wrong.', debug: error.debug })
            }


            return res.json({ status: 'ok', value: 'Address data\'s set.' })


    } else if (req.body.idData) {
        const {phoneNumber} = body
        const { idType, idDateIssue, idDateExpiration, idDivsionCode, idIssuer, idSeries, idNumber, sex } = body.idData
        const [error, response] = await setIdData(idDateIssue, idDateExpiration, idDivsionCode, idIssuer, idSeries, idNumber, sex, idType, phoneNumber)
        
        if (error) {
            return res.json({ status: 'error', value: 'Something went wrong.', dbg: response.dbg })
        }
        
        return res.json({ status: 'ok', value: 'ID data\'s set.' })
    
    } 
    
    else if (req.body.idFiles) {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ status: 'error', body: 'No files.'})
        }

        const { upload } = req.files
        console.log('uploaded file(s): ' + JSON.stringify(upload))
        const isArray = Array.isArray(upload)
        
        if (isArray) { 
            if (upload[0].size > 0 && upload[1].size > 0) {
                upload.forEach(file => {
                    moveFile(file.tempFilePath, path.join(__dirname, 'uploads', file.name))
                })
                
                return res.json({ status: 'ok', value: 'ID files saved.' })
            }
            else {
                fs.unlink(upload[0].tempFilePath, function (err) {
                    if (err) throw err
                })
    
                fs.unlink(upload[1].tempFilePath, function (err) {
                    if (err) throw err
                })
    
                return res.status(400).json({ status: 'error', body: 'File size is too small.'})
            }
        }
    
        

        if (!isArray) {
            if (upload.size === 0) {
                fs.unlink(upload.tempFilePath, function (err) {
                    if (err) throw err
                    console.log('File deleted!')
                })
                return res.status(400).json({ status: 'error', body: 'File size is too small.'})
            }
            else {
                const file_name = upload.name
                moveFile(upload.tempFilePath, path.join(__dirname, 'uploads', file_name))
                return res.json({ status: 'ok', value: 'ID files saved.' })
            }
        }
        
        

    } 


    else if (req.body.idSelfieFile) {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send({ status: 'error', body: 'No file was uploaded.'})
        }
    
        if (req.files.upload.size === 0) {
            fs.unlink(req.files.upload.tempFilePath, function (err) {
                if (err) throw err;
                console.log('File deleted!');
            }); 
    
            return res.status(400).send({ status: 'error', body: 'File size is too small.'})
        }
    
        const isArray = Array.isArray(req.files.upload)

        if (!isArray) {
            const file_name = req.files.upload.name
            moveFile(req.files.upload.tempFilePath, path.join(__dirname, 'uploads', file_name))
        }

        if (isArray) {
            return res.json({ status: 'error', value: 'Only one file\'s required.' })
        }

        
        return res.json({ status: 'ok', value: 'Selfie file saved.' })
    } 


    else if (req.body.poaFile) {
        console.log('POAPAOAPAOA')
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send({ status: 'error', body: 'No file was uploaded.'})
        }
    
        if (req.files.upload.size === 0) {
            fs.unlink(req.files.upload.tempFilePath, function (err) {
                if (err) throw err;
                console.log('File deleted!');
            }); 
    
            return res.status(400).send({ status: 'error', body: 'File size is too small.'})
        }
    
        const isArray = Array.isArray(req.files.upload)

        if (!isArray) {
            const file_name = req.files.upload.name
            moveFile(req.files.upload.tempFilePath, path.join(__dirname, 'uploads', file_name))
            return res.json({ status: 'ok', value: 'POA file saved.' })
        }

        if (isArray) {
            return res.json({ status: 'error', value: 'Only one file\'s required.' })
        }

        
        

    } 

    // TODO: add DB
    else if (req.body.freelanceInfo) {
        const { phoneNumber } = body
        const { freelanceInfo, freelancePaymentsFrom, freelancePaymentsTo} = body
        const { category, subCategory, customers, salesChannels, websites, socials } = freelanceInfo
        const stringifiedWebsites = websites ? (websites.map(item => item.value)).join(';') : ''
        const stringifiedSocials = socials ? (socials.map(item => item.value)).join(';') : ''
        const [error, response] = 
            await setFreelanceInfo(category, subCategory, customers, salesChannels, freelancePaymentsFrom, freelancePaymentsTo, phoneNumber)
        
        if (error) {
            return res.json({ status: 'error', value: 'Something went wrong.', dbg: response })
        }
        
        return res.json({ status: 'ok', value: 'ID data\'s set.' })
    
    } 

    // TODO: add DB
    else if (req.body.txSurvey) {
        const { phoneNumber } = body
        const { txSurvey } = body
        const {txVolume, txCount, singleMaxLimitTx } = txSurvey
        const [error, response] =  await setTxSurvey(txVolume, txCount, singleMaxLimitTx, phoneNumber)
        
        if (error) {
            console.log(response)
            return res.json({ status: 'error', value: 'Something went wrong.', dbg: response })
        }
        
        return res.json({ status: 'ok', value: 'ID data\'s set.' })
    
    } 

    
    else {
        res.json({ status: 'error', body: 'Uknown request.' })
    }

    console.log('---------------------------------\n')
})


app.post('/profile', function (req, res, next) {

    // Do I know this user? -> check db
    // Has he uploaded this file previously? -> check db
    // Save file: ./kyc/<PHONE_NUMBER>/id1
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send({ status: 'error', body: 'No file was uploaded.'})
    }

    if (req.files.upload.size === 0) {
        fs.unlink(req.files.upload.tempFilePath, function (err) {
            if (err) throw err;
            console.log('File deleted!');
        }); 

        return res.status(400).send({ status: 'error', body: 'File size is too small.'})
    }


    const FILE_NAME = req.files.upload.name
    moveFile(req.files.upload.tempFilePath, path.join(__dirname, 'uploads', FILE_NAME))

    res.end('File uploaded!')
    
})

app.get('/', function (req, res){
    res.sendFile(__dirname + '/index.html');
})


app.get('/data', async function (req, res) {
    console.log('data')
    console.log(req.decodedJWT)
    const name = await getAccountHolderName(req.decodedJWT.phoneNumber)
    return res.json({ name })
})


app.use(function (err, req, res, next) {
    console.log('Unhandeled error handler:')
    console.log(err)
    fs.writeFileSync('Unhandeled-error-handler-' + '-' + Date.now() + '.json', JSON.stringify({req, err}))

    return res.json({ status: 'error', body: 'Please try again.' })
})

app.listen(4000);
