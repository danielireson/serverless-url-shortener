'use strict'

const exec = require('child_process').exec

const {
  BUCKET,
  REGION
} = process.env

let command = `aws s3 sync static s3://${BUCKET}`
exec(command, function (error, stdout, stderr) {
  if (stderr) {
    console.error('Deploy static error')
    console.error('---')
    console.error(stderr)
  } else {
    console.log('Deploy static success')
    console.log(`http://${BUCKET}.s3-website-${REGION}.amazonaws.com/`)
    console.log('---')
    console.log(stdout)
  }
})
