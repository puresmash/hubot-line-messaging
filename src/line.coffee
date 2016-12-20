try
  {Robot,Adapter,TextMessage,User} = require 'hubot'
catch
  prequire = require('parent-require')
  {Robot,Adapter,TextMessage,User} = prequire 'hubot'

# {SendObject, SendSticker} = require './response'
{ImageMessage, VideoMessage, AudioMessage, LocationMessage, StickerMessage} = require './receive'
{EventEmitter} = require 'events'
util = require 'util'
crypto = require 'crypto'

class LineAdapter extends Adapter
    constructor: (@robot) ->
        super @robot

        @REPLY_URL = 'https://api.line.me/v2/bot/message/reply'
        @LINE_TOKEN = process.env.HUBOT_LINE_TOKEN
        # @IS_TESTING = process.env.NODE_TESTING

    # Use send when you need to PUSH message
    send: (envelope, msgObjs...)->
        @robot.logger.error 'Send will be provided in future version'

    # Use reply when you need to REPLY message
    reply: (envelope, msgObjs...) ->
        replyToken = envelope.message.replyToken
        replyObj =  @_formatReplyObj replyToken, msgObjs
        @_sendReply replyObj

    # Use reply when you need to REPLY message
    emote: (envelope, msgObjs...) ->
        replyToken = envelope.message.replyToken
        replyObj =  @_formatReplyObj replyToken, msgObjs
        @_sendReply replyObj

    _sendReply: (replyObj) ->
        logger = @robot.logger
        json = JSON.stringify(replyObj)
        # console.log replyObj
        @robot.http(@REPLY_URL)
            .header('Content-Type', 'application/json')
            .header('Authorization', "Bearer #{@LINE_TOKEN}")
            .post(json) (err, res, body) ->
                if err
                    logger.error "Error sending msg: #{err}"
                    return
                if res.statusCode is 200
                    logger.debug "Success, response body: #{body}"
                else
                    logger.debug "Error with statusCode: #{res.statusCode}"
                    logger.debug "Body: #{body}"

    _formatReplyObj: (token, msgAry) ->
        reply =  {
            "replyToken": token,
            "messages":[]
        }
        reply.messages.push @_formatMsgObj msgObj for msgObj in msgAry
        return reply

    _formatMsgObj: (msgObj) ->
        # @robot.logger.debug 'msgObj'
        # @robot.logger.debug util.inspect msgObj, true, null
        # @robot.logger.debug 'typeof msgObj'
        # @robot.logger.debug typeof msgObj
        # @robot.logger.debug 'msgObj instanceof SendObject'
        # @robot.logger.debug msgObj instanceof SendObject
        # @robot.logger.debug 'msgObj instanceof SendSticker'
        # @robot.logger.debug msgObj instanceof SendSticker
        if msgObj and msgObj.type
            # text, sticker, image. audio, video, location, imagemap(X), template
            obj = {
                "type": msgObj.type
            }
            obj.packageId = msgObj.packageId if msgObj.packageId?
            obj.stickerId = msgObj.stickerId if msgObj.stickerId?
            obj.title = msgObj.title if msgObj.title?
            obj.address = msgObj.address if msgObj.address?
            obj.latitude = msgObj.latitude if msgObj.latitude?
            obj.longitude = msgObj.longitude if msgObj.longitude?
            obj.originalContentUrl = msgObj.originalContentUrl if msgObj.originalContentUrl?
            obj.previewImageUrl = msgObj.previewImageUrl if msgObj.previewImageUrl?
            obj.duration = msgObj.duration if msgObj.duration?
            obj.text = msgObj.text if msgObj.text?
            obj.altText = msgObj.altText if msgObj.altText?
            obj.template = msgObj.template if msgObj.template?
            return obj;
        else if typeof msgObj is 'string'
            return {
                "type": "text",
                "text": msgObj
            }

    # getTemplate: (template) ->
    #     # The thumbnailImageUrl and title fields are optional.
    #     # buttons, confirm, carousel
    #     obj = {
    #         type: template.type
    #     }
    #     obj.thumbnailImageUrl = template.thumbnailImageUrl if template.thumbnailImageUrl?
    #     obj.title = template.title if template.title?
    #     obj.text = template.text
    #     obj.actions = @getActions(template.actions) if template.actions?
    #     return obj
    #
    # getActions: (actionAry) ->
    #     ary = []
    #     ary.push @getAction(action) for action in actionAry
    #     return ary
    #
    # getAction: (action) ->
    #     # postback, message, uri
    #     obj = {
    #         type: action.type
    #     }
    #     obj.label = action.label if action.label?
    #     obj.data = action.data if action.data?
    #     obj.text = action.text if action.text?
    #     obj.uri = action.uri if action.uri?
    #     return obj

    run: ->
        self = @
        robot = @robot
        options =
            path: '/'

        bot = new LineStreaming(options, @robot)
        @streaming = bot
        bot.on 'text',
            (sourceId, replyToken, msgObj) ->
                user = @robot.brain.userForId sourceId
                # console.log util.inspect replyToken, false, null
                message = new TextMessage(user, msgObj.text, msgObj.id)
                message.replyToken = replyToken
                self.receive message

        bot.on 'image',
            (sourceId, replyToken, msgObj) ->
                user = @robot.brain.userForId sourceId
                message = new ImageMessage(user, msgObj.id, replyToken)
                self.receive message

        bot.on 'video',
            (sourceId, replyToken, msgObj) ->
                user = @robot.brain.userForId sourceId
                message = new VideoMessage(user, msgObj.id, replyToken)
                self.receive message

        bot.on 'audio',
            (sourceId, replyToken, msgObj) ->
                user = @robot.brain.userForId sourceId
                message = new AudioMessage(user, msgObj.id, replyToken)
                self.receive message

        bot.on 'location',
            (sourceId, replyToken, msgObj) ->
                user = @robot.brain.userForId sourceId
                message = new LocationMessage(user, msgObj.title, msgObj.address,
                                msgObj.latitude, msgObj.longitude, msgObj.id, replyToken)
                self.receive message

        bot.on 'sticker',
            (sourceId, replyToken, msgObj) ->
                user = @robot.brain.userForId sourceId
                message = new StickerMessage(user, msgObj.packageId, msgObj.stickerId, msgObj.id, replyToken)
                self.receive message

        bot.listen()
        self.emit "connected"

class LineStreaming extends EventEmitter
    constructor: (options, @robot) ->
        # router listen path: '/'
        @PATH = options.path
        @CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET
        # @REPLY_URL = 'https://api.line.me/v2/bot/message/reply'
        # @LINE_TOKEN = process.env.HUBOT_LINE_TOKEN

    listen: ->
        # if @IS_TESTING
        # @robot.router.get @PATH, (req, res) =>
        #         console.log 'LISTEN'
        #         replyToken = 'testing token'
        #         eventType = 'message'
        #         text = 'Hubot:hello 中文'
        #         id = 'testing id'
        #         userId = 'testing uid'
        #         # Can't handle other event now, discards them
        #         if eventType is 'message'
        #             @emit 'message', userId, replyToken, text, id
            # res.send 'OK'

        @robot.router.post @PATH, (req, res) =>
            @robot.logger.debug 'GET LINE MSG'

            # Event
            event = @getEvent req.body.events[0]
            # event = req.body.events[0];
            # replyToken = event.replyToken;
            # eventType = event.type;

            # Message
            # message = @getMessage event
            # text = message.text
            # id = message.id
            # @robot.logger.debug "text: #{event.message.text}"

            # Source
            source = @getSource event
            sourceId = source.userId or source.roomId or source.groupId

            # Validate signature
            headerSignature = req.headers['x-line-signature'];
            isValid = @validateSignature req.body, headerSignature
            unless isValid
                @robot.logger.error "Failed validate, result: #{isValid}"
                @robot.logger.error "headerSignature: #{headerSignature}"
                res.statusCode = 403
                res.send 'Auth Failed'
                return;

            # Pass Validate
            # Can't handle other event except message now, discards them
            # by implement getcontent api, can retrieve msg content
            # TODO: check msg here?
            if event.type is 'message'
                message = event.message
                replyToken = event.replyToken
                # console.log "event_type: #{event.type}, message_type: #{message.type}"
                # @emit 'text', sourceId, replyToken, message
                @emit message.type, sourceId, replyToken, message

            res.statusCode = 200
            res.send 'OK'

    # getcontent
    # TODO:

    # get profile
    # TODO:

    # send replyobj
    # TODO:
    # sendReply: (replyObj) ->
    #     logger = @robot.logger
    #     json = JSON.stringify(replyObj)
    #     # console.log replyObj
    #     @robot.http(@REPLY_URL)
    #         .header('Content-Type', 'application/json')
    #         .header('Authorization', "Bearer #{@LINE_TOKEN}")
    #         .post(json) (err, res, body) ->
    #             if err
    #                 logger.error "Error sending msg: #{err}"
    #                 return
    #             if res.statusCode is 200
    #                 logger.debug "Success, response body: #{body}"
    #             else
    #                 logger.debug "Error with statusCode: #{res.statusCode}"
    #                 logger.debug "Body: #{body}"

    # getEventObj
    getEvent: (event)->
        eventObj = {
            "type": event.type,
            "source": event.source
        }
        if event.type is "message"
            eventObj.replyToken = event.replyToken;
            eventObj.message = @getMessage event
            return eventObj;

        @robot.logger.error 'Unsupport other event type yet'
        return eventObj;


    # Message_Type = ['text']
    getMessage: (event)->
        return event.message;

    # Source_Type = ['group', 'room', 'user']
    getSource: (event)->
        source =
            sourceType: event.source.type
            roomId: event.source.userId
            userId: event.source.roomId
            groupId: event.source.groupId
        return source

    validateSignature: (content, headerSignature)->
        genSign = @generateSignature content
        return genSign is headerSignature

    generateSignature: (content)->
        return crypto.createHmac('SHA256', @CHANNEL_SECRET)
            .update(JSON.stringify(content), 'utf8')
            .digest('base64')

module.exports = LineAdapter
