try
  {Robot,Adapter,TextMessage,User} = require 'hubot'
catch
  prequire = require('parent-require')
  {Robot,Adapter,TextMessage,User} = prequire 'hubot'

{EventEmitter} = require 'events'
util = require 'util'
crypto = require 'crypto'

class LineAdapter extends Adapter
    constructor: ->
        super

        @REPLY_URL = 'https://api.line.me/v2/bot/message/reply'
        @LINE_TOKEN = process.env.HUBOT_LINE_TOKEN

    reply: (envelope, strings...) ->
        @_sendText envelope.message.replyToken, msg for msg in strings

    _sendText: (token, msg) ->
        logger = @robot.logger

        @robot.http(@REPLY_URL)
            .header('Content-Type', 'application/json')
            .header('Authorization', "Bearer #{@LINE_TOKEN}")
            .post(JSON.stringify(@_formatReplyObj token, msg)) (err, res, body) ->
                if err
                    logger.error "Error sending msg: #{err}"
                    return
                if res.statusCode is 200
                    logger.debug "Success, response body: #{body}"
                else
                    logger.debug "Error with statusCode: #{res.statusCode}"
                    logger.debug "Body: #{body}"


    _formatReplyObj: (token, msg) ->
        return {
            "replyToken": token,
            "messages":[
                {
                    "type": "text",
                    "text": msg
                }
            ]
        }

    run: ->
        self = @
        robot = @robot
        options =
            path: '/'

        bot = new LineStreaming(options, @robot)

        bot.on 'message',
            (userId, replyToken, text, id) ->
                user = @robot.brain.userForId userId
                # console.log util.inspect replyToken, false, null
                message = new TextMessage(user, text, id)
                message.replyToken = replyToken
                self.receive message
        bot.listen()
        self.emit "connected"

class LineStreaming extends EventEmitter
    constructor: (options, @robot) ->
        # router listen path: '/'
        @PATH = options.path
        @CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET

    listen: ->
        # @robot.router.get @PATH, (req, res) =>
        #     console.log 'LISTEN'
        #     replyToken = 'testing token'
        #     eventType = 'message'
        #     text = 'Hubot:hello'
        #     id = 'testing id'
        #     userId = 'testing uid';
        #     # Can't handle other event now, discards them
        #     if eventType is 'message'
        #         @emit 'message', userId, replyToken, text, id
        #     res.send 'OK'

        @robot.router.post @PATH, (req, res) =>
            @robot.logger.debug 'GET LINE MSG'

            # Event
            event = req.body.events[0];
            replyToken = event.replyToken;
            eventType = event.type;

            # Message
            message = @getMessage event
            text = message.text
            id = message.id

            # Source
            source = @getSource event
            userId = source.userId or source.roomId

            # Validate signature
            headerSignature = req.headers['x-line-signature'];
            isValid = @validateSignature req.body, headerSignature
            unless isValid
                @robot.logger.debug "Failed validate, result: #{isValid}"
                @robot.logger.debug "headerSignature: #{headerSignature}"
                res.send 'Auth Failed'
                return;

            # Pass Validate
            # Can't handle other event now, discards them
            if eventType is 'message'
                @emit 'message', userId, replyToken, text, id

            res.send 'OK'

    # Message_Type = ['text']
    getMessage: (event)->
        message =
            text: event.message.text;
            id: event.message.id;
        return message

    # Source_Type = ['room', 'user']
    getSource: (event)->
        source =
            sourceType: event.source.type
            roomId: event.source.userId
            userId: event.source.roomId
        return source

    validateSignature: (content, headerSignature)->
        genSign = @generateSignature content
        return genSign is headerSignature

    generateSignature: (content)->
        return crypto.createHmac('SHA256', @CHANNEL_SECRET)
            .update(JSON.stringify(content), 'utf8')
            .digest('base64')

exports.use = (robot) ->
    new LineAdapter robot
