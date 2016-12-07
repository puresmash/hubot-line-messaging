
# {Response} = require 'hubot'

# class Response
#   constructor: (@robot, @message, @match) ->
#     @envelope =
#       room: @message.room
#       user: @message.user
#       message: @message

# Line Send message object
class SendObject
    constructor: ->

class SendText extends SendObject
    constructor: (@text)->
        super
        @type = 'text'

class SendImage extends SendObject
    constructor: (@originalContentUrl, @previewImageUrl)->
        super
        @type = 'image'

class SendVideo extends SendObject
    constructor: (@originalContentUrl, @previewImageUrl)->
        super
        @type = 'video'

class SendAudio extends SendObject
    constructor: (@originalContentUrl, @duration)->
        super
        @type = 'audio'

class SendLocation extends SendObject
    constructor: (@title, @address, @latitude, @longitude)->
        super
        @type = 'location'

class SendSticker extends SendObject
    constructor: (@stickerId, @packageId)->
        super
        @type = 'sticker'

module.exports = {
    SendObject
    SendText
    SendImage
    SendVideo
    SendAudio
    SendLocation
    SendSticker
}
