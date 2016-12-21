
# {Response} = require 'hubot'
lodash = require 'lodash'
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

class BuildTemplateMessage
    constructor: (@altText)->
        @type = 'template'
        @options = {}

    # init: (@altText)->
    #     return new BuildTemplateMessage(altText);

    buttons: (input)->
        @options.templateObj = {
            type: 'buttons',
            thumbnailImageUrl: input.thumbnailImageUrl,
            title: input.title,
            text: input.text
        }
        return @

    confirm: (input)->
        @options.templateObj = {
            type: 'confirm',
            text: input.text
        }
        return @

    carousel: (input)->
        if(!@options.templateObj or @options.templateObj.type isnt 'carousel')
            @_initCarousel()
        @_addCarouselColumn(input.thumbnailImageUrl, input.title, input.text)
        return @

    _initCarousel: ()->
        @options.templateObj = {
            type: 'carousel',
            columns: []
        }

    _addCarouselColumn: (thumbnailImageUrl, title, text)->
        @options.templateObj.columns.push { thumbnailImageUrl, title, text }

    action: (type, input)->
        obj = {}
        if type is 'postback'
            obj.type = 'postback'
            obj.label = input.label if input.label?
            obj.data = input.data if input.data?
            obj.text = input.text if input.text?
        else if type is 'message'
            obj.type = 'message'
            obj.label = input.label if input.label?
            obj.text = input.text if input.text?
        else if type is 'uri'
            obj.type = 'uri'
            obj.label = input.label if input.label?
            obj.uri = input.uri if input.uri?
        else
            throw new Error("Un-supported action type - #{type}, should choose in (postback, message, uri)")
        @_addAction(obj)
        return @

    _addAction: (obj)->
        if (@options.templateObj.type isnt 'carousel')
            @options.templateObj.actions = [] if !@options.templateObj.actions
            @options.templateObj.actions.push obj
        else
            column = lodash.last(@options.templateObj.columns);
            column.actions = [] if !column.actions
            column.actions.push obj


    build: ()->
        obj = {
            type: @type,
            altText: @altText,
            template: {
                type: @options.templateObj.type
            }
        }
        # The thumbnailImageUrl and title fields are optional.
        # columns only appear when carousel
        obj.template.thumbnailImageUrl = @options.templateObj.thumbnailImageUrl if @options.templateObj.thumbnailImageUrl?
        obj.template.title = @options.templateObj.title if @options.templateObj.title?
        obj.template.text = @options.templateObj.text if @options.templateObj.text?

        if @options.templateObj.type is 'carousel'
            # For Carousel
            obj.template.columns = @options.templateObj.columns if @options.templateObj.columns?
        else
            # For Buttons and Confirm
            obj.template.actions = @options.templateObj.actions if @options.templateObj.actions?

        return obj

module.exports = {
    SendObject
    SendText
    SendImage
    SendVideo
    SendAudio
    SendLocation
    SendSticker
    BuildTemplateMessage
}
