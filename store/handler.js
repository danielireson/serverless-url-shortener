'use strict'

const url = require('url')

const AWS = require('aws-sdk')
const S3 = new AWS.S3()

const config = require('../config.json')

module.exports.handle = (event, context, callback) => {
  validate(event.url)
    .then(function () {
      return getShortUrl()
    })
    .then(function (shortUrl) {
      let redirect = buildRedirect(shortUrl, event.url)
      return saveRedirect(redirect)
    })
    .then(function (shortUrl) {
      let response = buildResponse(200, 'URL successfully shortened', shortUrl)
      return Promise.resolve(response)
    })
    .catch(function (err) {
      let response = buildResponse(err.statusCode, err.message)
      return Promise.resolve(response)
    })
    .then(function (response) {
      callback(null, response)
    })
}

function validate (longUrl = '') {
  let parsedUrl = url.parse(longUrl)
  if (parsedUrl.protocol === null || parsedUrl.host === null) {
    return Promise.reject({
      statusCode: 400,
      message: 'URL is invalid'
    })
  }

  return Promise.resolve(longUrl)
}

function getShortUrl () {
  return new Promise(function (resolve, reject) {
    let shortUrl = generateShortUrl()
    isShortUrlFree(shortUrl)
      .then(function (isFree) {
        return isFree ? resolve(shortUrl) : resolve(getShortUrl())
      })
  })
}

function generateShortUrl (shortUrl = '') {
  let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let position = Math.floor(Math.random() * characters.length)
  let character = characters.charAt(position)

  if (shortUrl.length === 7) {
    return shortUrl
  }

  return generateShortUrl(shortUrl + character)
}

function isShortUrlFree (shortUrl) {
  return S3.headObject(buildRedirect(shortUrl)).promise()
    .then(() => Promise.resolve(false))
    .catch(() => Promise.resolve(true))
}

function saveRedirect (redirect) {
  return S3.putObject(redirect).promise()
    .then(() => Promise.resolve(redirect['Key']))
}

function buildRedirect (shortUrl, longUrl = false) {
  let redirect = {
    'Bucket': config.BUCKET,
    'Key': shortUrl,
  }

  if (longUrl) {
    redirect['WebsiteRedirectLocation'] = longUrl
  }

  return redirect
}

function buildRedirectUrl (shortUrl) {
  let baseUrl = `https://${config.BUCKET}.s3.${config.REGION}.amazonaws.com/`
  
  if ('BASE_URL' in config && config['BASE_URL'] !== '') {
    baseUrl = config['BASE_URL']
  }

  return baseUrl + shortUrl
}

function buildResponse (statusCode, message, shortUrl = false) {
  let body = { message }

  if (shortUrl) {
    body['path'] = shortUrl
    body['shortUrl'] = buildRedirectUrl(shortUrl) 
  }

  return {
    statusCode: statusCode,
    body: JSON.stringify(body)
  }
}
