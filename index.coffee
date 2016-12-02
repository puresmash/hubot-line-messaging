
LineAdapter = require './src/line'
{SendObject, SendText, SendImage, SendVideo, SendAudio, SendLocation, SendSticker} = require './src/response'

module.exports = exports = {
  LineAdapter
  SendObject
  SendText
  SendImage
  SendVideo
  SendAudio
  SendLocation
  SendSticker
}

exports.use = (robot) ->
    new LineAdapter robot
