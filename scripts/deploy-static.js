'use strict'

const exec = require('child_process').exec

const config = require('../config.json')

const command = `aws s3 sync static s3://${config.BUCKET}`

exec(command, function (error, stdout, stderr) {
  if (stderr) {
    console.error('Deploy static error')
    console.error(stderr)
  } else {
    console.log('Deploy static success')
    console.log(stdout)
  }
})
