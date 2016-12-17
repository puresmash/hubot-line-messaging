
LineAdapter = require './src/line'
{SendObject, SendText, SendImage, SendVideo, SendAudio, SendLocation, SendSticker, BuildTemplateMessage} = require './src/response'
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
  BuildTemplateMessage
}

exports.use = (robot) ->
    new LineAdapter robot

exports.BuildTemplateMessage.init = (altText) ->
    new BuildTemplateMessage altText
