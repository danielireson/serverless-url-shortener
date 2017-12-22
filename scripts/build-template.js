'use strict'

const fs = require('fs')
const path = require('path')

const config = require('../config.json')

try {
  let readPath = path.resolve(__dirname, '../static/template.html')
  let template = fs.readFileSync(readPath).toString()
  template = template.replace('INSERT_API_URL', config['API_URL'])

  let writePath = path.resolve(__dirname, '../static/index.html')
  fs.writeFileSync(writePath, template)  

  console.log('Template build success')

} catch (error) {
  console.error('Template build error')
  console.error('---')
  console.error(error.message)

}
