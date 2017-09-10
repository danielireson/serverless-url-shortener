'use strict'

module.exports.handle = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'create function called',
      input: event,
    }),
  }

  callback(null, response)
}
