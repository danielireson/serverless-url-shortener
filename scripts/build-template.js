'use strict'

const fs = require('fs')
const path = require('path')

const { API_URL, TITLE, CREDIT, CREDIT_URL } = process.env

try {
  const readPath = path.resolve(__dirname, '../src/template.html')
  const template = fs.readFileSync(readPath).toString()

  const writePath = path.resolve(__dirname, '../build/index.html')
  fs.writeFileSync(
    writePath,
    template
      .replace(/INSERT_API_URL/g, API_URL)
      .replace(/INSERT_TITLE/g, TITLE || 'serverless url shortener')
      .replace(
        /INSERT_CREDIT_URL/g,
        CREDIT_URL || 'https://github.com/danielireson/serverless-url-shortener'
      )
      .replace(/INSERT_CREDIT/g, CREDIT || 'View this project on Github')
  )

  console.log('Template build success')
} catch (error) {
  console.error('Template build error')
  console.error('---')
  console.error(error.message)
}
