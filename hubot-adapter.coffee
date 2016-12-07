
# This file is a workaround for testing adapter, ignore this file if you are a end-user
# Keep it the same as index.coffee in order to run npm test

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
