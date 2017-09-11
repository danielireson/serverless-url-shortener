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
      return S3.putObject(redirect).promise()
    })
    .then(function () {
      let response = buildResponse(200, 'URL successfully shortened')
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

function buildResponse (statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message: message,
    }) 
  }
}

function validate (str = '') {
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
