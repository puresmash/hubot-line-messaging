
LineAdapter = require './src/line'
{SendObject, SendText, SendImage, SendVideo, SendAudio, SendLocation, SendSticker} = require './src/response'
{ImageMessage, VideoMessage, AudioMessage, LocationMessage, StickerMessage} = require './src/receive'

module.exports = exports = {
  LineAdapter
  SendObject
  SendText
  SendImage
  SendVideo
  SendAudio
  SendLocation
  SendSticker
  ImageMessage
  VideoMessage
  AudioMessage
  LocationMessage
  StickerMessage
}

exports.use = (robot) ->
    new LineAdapter robot
