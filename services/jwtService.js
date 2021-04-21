const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config')

function generateJwt(object)
{
    return jwt.sign(object, jwtSecret)
}

function verifyJwt()