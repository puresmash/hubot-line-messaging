
{Message} = require 'hubot'

# class Response
#   constructor: (@robot, @message, @match) ->
#     @envelope =
#       room: @message.room
#       user: @message.user
#       message: @message

# Line Receive message object
# class ReceiveMessage extends Message
#     constructor: (@user, @id, @replyToken)->
#         super @user

# class TextMessage extends Message
#     constructor: (@user, @text, @id, @replyToken)->
#         super @user
#         @type = 'text'

class ImageMessage extends Message
    constructor: (@user, @id, @replyToken, @sourceType) ->
        super @user
        @type = 'image'

class VideoMessage extends Message
    constructor: (@user, @id, @replyToken, @sourceType) ->
        super @user
        @type = 'video'

class AudioMessage extends Message
    constructor: (@user, @id, @replyToken, @sourceType) ->
        super @user
        @type = 'audio'

class LocationMessage extends Message
    constructor: (@user, @title, @address, @latitude, @longitude, @id, @replyToken, @sourceType) ->
        super
        @type = 'location'

class StickerMessage extends Message
    constructor: (@user, @stickerId, @packageId, @id, @replyToken, @sourceType) ->
        super
        @type = 'sticker'

module.exports = {
    ImageMessage
    VideoMessage
    AudioMessage
    LocationMessage
    StickerMessage
}
