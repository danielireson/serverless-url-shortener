'use strict'

const fs = require('fs')
const path = require('path')

const { API_URL } = process.env

try {
  const readPath = path.resolve(__dirname, '../src/template.html')
  const template = fs.readFileSync(readPath).toString()

  const writePath = path.resolve(__dirname, '../build/index.html')
  fs.writeFileSync(writePath, template.replace('INSERT_API_URL', API_URL))

  console.log('Template build success')
} catch (error) {
  console.error('Template build error')
  console.error('---')
  console.error(error.message)
}
