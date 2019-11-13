'use strict'

const url = require('url')
const AWS = require('aws-sdk')
const S3 = new AWS.S3()
const nanoid_locale = require('nanoid-good/locale/en')
const nanoid = require('nanoid-good/async/generate')(nanoid_locale)
const CHARACTERS = require('nanoid/url').replace(/[-_]/g, '')
const PERMITTED = /^[0-9a-z-_]+$/i

const { BUCKET, REGION, SHORT_URL } = process.env

module.exports.handle = async (event, _context) => {
  const { url, vanity } = JSON.parse(event.body)

  return validate(url)
    .then(() => getPath(vanity))
    .then(path => saveRedirect(buildRedirect(path, url)))
    .then(path => buildResponse(200, 'URL successfully shortened', path))
    .catch(err => buildResponse(err.statusCode, err.message))
}

async function validate(longUrl) {
  if (!longUrl) {
    return Promise.reject({
      statusCode: 400,
      message: 'URL is required'
    })
  }

  const { protocol, host } = url.parse(longUrl)

  if (!protocol || !host) {
    return Promise.reject({
      statusCode: 400,
      message: 'URL is invalid'
    })
  }

  return longUrl
}

async function getPath(vanity) {
  return Promise.resolve(
    typeof vanity === 'string' && PERMITTED.test(vanity)
      ? String(vanity)
      : nanoid(CHARACTERS, 7)
  ).then(path => isPathFree(path).then(isFree => (isFree ? path : getPath())))
}

async function isPathFree(path) {
  return S3.headObject(buildRedirect(path))
    .promise()
    .then(() => false)
    .catch(err =>
      err.code === 'NotFound' ? Promise.resolve(true) : Promise.reject(err)
    )
}

async function saveRedirect(redirect) {
  return S3.putObject(redirect)
    .promise()
    .then(() => redirect['Key'])
}

function buildRedirect(path, longUrl) {
  let redirect = {
    Bucket: BUCKET,
    Key: path
  }

  if (longUrl) {
    redirect['WebsiteRedirectLocation'] = longUrl
  }

  return redirect
}

function buildRedirectUrl(path) {
  const baseUrl = SHORT_URL || `https://${BUCKET}.s3.${REGION}.amazonaws.com`
  return `${baseUrl}/${path}`
}

function buildResponse(statusCode, message, path) {
  const body = { message }

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
