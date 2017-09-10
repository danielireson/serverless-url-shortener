'use strict'

const url = require('url')

const AWS = require('aws-sdk')
const S3 = new AWS.S3()

const config = require('../config.json')

module.exports.handle = (event, context, callback) => {
  validateURL(event.url)
    .then(function (url) {
      return S3.putObject(buildRedirect(url)).promise()
    })
    .then(function (response) {
      return Promise.resolve(buildResponse(200, 'URL successfully shortened'))
    })
    .catch(function (err) {
      return Promise.resolve(buildResponse(err.statusCode, err.message))
    })
    .then(function (response) {
      callback(null, response)
    })
}

function buildRedirect (url) {
  return {
    Bucket: config.BUCKET,
    Key: 'test'
  }
}

function buildResponse (statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message: message,
    }) 
  }
}

function validateURL (str = '') {
  let urlObj = url.parse(str)
  if (urlObj.protocol !== null && urlObj.host !== null) {
    return Promise.resolve(str)
  } else {
    return Promise.reject({
      statusCode: 400,
      message: 'Long URL is invalid'
    })
  }
}
