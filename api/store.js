'use strict'

const url = require('url')

const AWS = require('aws-sdk')
const S3 = new AWS.S3()

const config = require('../config.json')

module.exports.handle = (event, context, callback) => {
  let longUrl = JSON.parse(event.body).url || ''
  validate(longUrl)
    .then(function () {
      return getPath()
    })
    .then(function (path) {
      let redirect = buildRedirect(path, longUrl)
      return saveRedirect(redirect)
    })
    .then(function (path) {
      let response = buildResponse(200, 'URL successfully shortened', path)
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

function validate (longUrl) {
  if (longUrl === '') {
    return Promise.reject({
      statusCode: 400,
      message: 'URL is required'
    })
  }

  let parsedUrl = url.parse(longUrl)
  if (parsedUrl.protocol === null || parsedUrl.host === null) {
    return Promise.reject({
      statusCode: 400,
      message: 'URL is invalid'
    })
  }

  return Promise.resolve(longUrl)
}

function getPath () {
  return new Promise(function (resolve, reject) {
    let path = generatePath()
    isPathFree(path)
      .then(function (isFree) {
        return isFree ? resolve(path) : resolve(getPath())
      })
  })
}

function generatePath (path = '') {
  let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let position = Math.floor(Math.random() * characters.length)
  let character = characters.charAt(position)

  if (path.length === 7) {
    return path
  }

  return generatePath(path + character)
}

function isPathFree (path) {
  return S3.headObject(buildRedirect(path)).promise()
    .then(() => Promise.resolve(false))
    .catch((err) => err.code == 'NotFound' ? Promise.resolve(true) : Promise.reject(err))
}

function saveRedirect (redirect) {
  return S3.putObject(redirect).promise()
    .then(() => Promise.resolve(redirect['Key']))
}

function buildRedirect (path, longUrl = false) {
  let redirect = {
    'Bucket': config.BUCKET,
    'Key': path,
  }

  if (longUrl) {
    redirect['WebsiteRedirectLocation'] = longUrl
  }

  return redirect
}

function buildRedirectUrl (path) {
  let baseUrl = `https://${config.BUCKET}.s3.${config.REGION}.amazonaws.com/`
  
  if ('BASE_URL' in config && config['BASE_URL'] !== '') {
    baseUrl = config['BASE_URL']
  }

  return baseUrl + path
}

function buildResponse (statusCode, message, path = false) {
  let body = { message }

  if (path) {
    body['path'] = path
    body['url'] = buildRedirectUrl(path)
  }

  return {
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    statusCode: statusCode,
    body: JSON.stringify(body)
  }
}
