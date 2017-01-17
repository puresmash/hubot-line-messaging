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
                    logger.debug "Json: #{json}"

    _formatReplyObj: (token, msgAry) ->
        reply =  {
            "replyToken": token,
            "messages":[]
        }
        reply.messages.push @_formatMsgObj msgObj for msgObj in msgAry
        return reply

    _formatMsgObj: (msgObj) ->
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

    run: ->
        self = @
        robot = @robot
        options =
            path: '/'

        bot = new LineStreaming(options, @robot)
        @streaming = bot
        bot.on 'text',
            (source, replyToken, msgObj) ->
                user = @robot.brain.userForId(source.sourceId, source.user)
                message = new TextMessage(user, msgObj.text, msgObj.id)
                message.replyToken = replyToken
                message.sourceType = source.sourceType
                self.receive message

        bot.on 'image',
            (source, replyToken, msgObj) ->
                user = @robot.brain.userForId(source.sourceId, source.user, source.sourceType)
                message = new ImageMessage(user, msgObj.id, replyToken)
                self.receive message

        bot.on 'video',
            (source, replyToken, msgObj) ->
                user = @robot.brain.userForId(source.sourceId, source.user, source.sourceType)
                message = new VideoMessage(user, msgObj.id, replyToken)
                self.receive message

        bot.on 'audio',
            (source, replyToken, msgObj) ->
                user = @robot.brain.userForId(source.sourceId, source.user, source.sourceType)
                message = new AudioMessage(user, msgObj.id, replyToken)
                self.receive message

        bot.on 'location',
            (source, replyToken, msgObj) ->
                user = @robot.brain.userForId(source.sourceId, source.user)
                message = new LocationMessage(user, msgObj.title, msgObj.address,
                    msgObj.latitude, msgObj.longitude, msgObj.id, replyToken, source.sourceType)
                self.receive message

        bot.on 'sticker',
            (source, replyToken, msgObj) ->
                user = @robot.brain.userForId(source.sourceId, source.user)
                message = new StickerMessage(user, msgObj.packageId, msgObj.stickerId, msgObj.id,
                    replyToken, source.sourceType)
                self.receive message

        bot.listen()
        self.emit "connected"

class LineStreaming extends EventEmitter
    constructor: (options, @robot) ->
        # router listen path: '/'
        @PATH = options.path
        @CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET
        @LINE_TOKEN = process.env.HUBOT_LINE_TOKEN
        @USER_PROFILE = process.env.USER_PROFILE
        @PROFILE_URL = 'https://api.line.me/v2/bot/profile/'
        @robot.logger.debug 'Env LINE_TOKEN is SET' if @LINE_TOKEN
        @robot.logger.debug 'Env CHANNEL_SECRET is SET' if @CHANNEL_SECRET
        @robot.logger.debug 'Flag USER_PROFILE is SET' if @USER_PROFILE
        @cacheUser = new Map();
        # @REPLY_URL = 'https://api.line.me/v2/bot/message/reply'
        # @LINE_TOKEN = process.env.HUBOT_LINE_TOKEN

    listen: ->
        self = @

        @robot.router.post @PATH, (req, res) =>
            @robot.logger.debug 'GET LINE MSG'

            # Event
            event = @getEvent req.body.events[0]

            # Validate signature
            headerSignature = req.headers['x-line-signature'];
            isValid = @validateSignature req.body, headerSignature
            unless isValid
                @robot.logger.error "Failed validate, result: #{isValid}"
                @robot.logger.error "headerSignature: #{headerSignature}"
                res.statusCode = 403
                res.send 'Auth Failed'
                return;

            # Source
            source = @getSource event
            sourceId = source.userId or source.roomId or source.groupId
            sourceType = source.sourceType
            if @USER_PROFILE and sourceType is 'user'
              # retrieve from cache
              if @cacheUser.has(sourceId)
                @robot.logger.debug("retrieve user-#{sourceId} from cache");
                @emitEvent event, {sourceId, sourceType}, @cacheUser.get(sourceId)
                return;

              @getProfile(sourceId).then((user) ->
                self.cacheUser.set sourceId, user
                self.emitEvent event, {sourceId, sourceType}, user
                return;
              ).catch((err) ->
                self.logger.error("Error getting profile: #{err}")
                res.statusCode = 404
                res.send 'Failed get user profile'
                return;
              )
              return;


            @emitEvent event, {sourceId, sourceType}, null

            res.statusCode = 200
            res.send 'OK'

    # Only Calling When Pass Validate
    # Can't handle other event except message now, discards them
    # by implement getcontent api, can retrieve msg content
    emitEvent: (event, source, user) ->
      if event.type is 'message'
          message = event.message
          replyToken = event.replyToken
          source.user = user if user
          @emit message.type, source, replyToken, message

    # getcontent
    # TODO:

    # get profile
    getProfile: (userId) ->
      self = @
      logger = @robot.logger

      promise = new Promise((resolve, reject) ->
        self.robot.http("#{self.PROFILE_URL}#{userId}")
          .header('Content-Type', 'application/json')
          .header('Authorization', "Bearer #{self.LINE_TOKEN}")
          .get() (err, res, body) ->
            if err
              logger.error "Error getting profile: #{err}"
              reject err
              return
            if res.statusCode is 200
              logger.debug "Success, response body: #{body}"
              resolve JSON.parse(body)
              return;
            reject body
            return;
      )
      return promise;


    # send replyobj
    # TODO: MOVE sendreply to here

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
