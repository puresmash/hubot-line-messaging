
// var expect = require("chai").expect;
var sinon = require("sinon");
var path   = require("path");

var Robot       = require("hubot/src/robot");
var TextMessage = require("hubot/src/message").TextMessage;
// var Adapter = require("hubot-adapter");
var LineMessaging = require('index')
var SendSticker = LineMessaging.SendSticker;
var SendLocation = LineMessaging.SendLocation;
var SendImage = LineMessaging.SendImage;
var SendVideo = LineMessaging.SendVideo;
var SendText = LineMessaging.SendText;
var SendAudio = LineMessaging.SendAudio;
var StickerMessage = LineMessaging.StickerMessage;

describe('Test Line Adapter', function() {
    var robot;
    var user;
    var adapter;

    before(function(done){
        // Hubot will require(hubot-adapter) in robot.coffee
        // Ensure NODE_PATH is set to root (NODE_PATH=.)
        robot = new Robot(null, 'adapter', true, 'TestHubot');

        robot.adapter.on("connected", function() {
            // console.log('adapter connected');
            /**
             * #1 load hubot script from ./test/robot.js
             */
            // only load scripts we absolutely need
            // process.env.HUBOT_AUTH_ADMIN = "1";
            // robot.loadFile(
            //     path.resolve(
            //         path.join("test")
            //     ),
            //     "robot.js"
            //     // ,"auth.coffee"
            // );
            // load the module under test and configure it for the
            // robot.  This is in place of external-scripts
            // require("index.coffee")(robot);

            /**
             * #2 Dynamic specify hubot script
             */

            // robot.respond(/hello/i, function(res){
            //     res.reply('world');
            // });

            // create a user
            // user = robot.brain.userForId("1", {
            //     name: "mocha",
            //     room: "#mocha"
            // });
            user = robot.brain.userForId("1");

            adapter = robot.adapter;

            done();
        });

        robot.run();
    });

    after(function() {
        robot.shutdown();
    });

    describe('when receiving Text Message from adapter', function(){
        describe('giving Text Respond Rule defined', function(){
            before(function(done){
                robot.respond(/hello/i, function(res){
                    res.reply('world');
                });
                done();
            });

            it("should reply a text", function(done) {
                // var spy = sinon.spy(adapter, '_sendReply');
                var stub = sinon.stub(adapter, '_sendReply');
                var expected = {
                    "replyToken": "testing token",
                    "messages": [{
                        "type": "text",
                        "text": "world"
                    }]
                }

                // Receive TextMessage
                var msg = new TextMessage(user, "@TestHubot hello");
                msg.replyToken = 'testing token';

                robot.receive(msg, function() {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, expected);
                    // console.log('test1 done');
                    stub.restore();
                    done();
                });
            });
        });

        describe('giving Sticker Respond Rule defined', function() {
            before(function(done){
                robot.respond(/sticker (.*)/i, function(res){
                    let keyword = res.match[1];
                    let sticker = new SendSticker(keyword, '1');
                    res.reply(sticker);
                });
                done();
            });

            it("should reply a sticker", function(done) {

                var stub = sinon.stub(adapter, '_sendReply');
                var expected = {
                    "replyToken": "testing token",
                    "messages": [{
                        "type": "sticker",
                        "packageId": "1",
                        "stickerId": "1"
                    }]
                }

                var msg = new TextMessage(user, "@TestHubot sticker 1");
                msg.replyToken = 'testing token';

                robot.receive(msg, function(){
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, expected);
                    // console.log('test2 done');
                    stub.restore();
                    done();
                });

            });
        });
    });

    describe('when receiving Sticker Message from adapter', function(){
        before(function(done){
            var matcher = function(message){
                // Not implement listenrt, so should CatchAllMessage.message
                if (message.message instanceof StickerMessage){
                    // console.log('INTO MATCHER');
                    return true
                }
                return false;
            }
            robot.listen(matcher, function(res){
                var stickerMessage = res.message.message;
                res.envelope.message = stickerMessage;
                var sticker = new SendSticker(stickerMessage.stickerId, stickerMessage.packageId);
                res.reply(sticker);
            });
            done();
        });

        describe('giving Sticker Respond Rule defined', function(){
            it('should reply a sticker', function(done){
                var stub = sinon.stub(adapter, '_sendReply');
                var expected = {
                    "replyToken": "testing token",
                    "messages": [{
                        "type": "sticker",
                        "packageId": "1",
                        "stickerId": "1"
                    }]
                }

                var msg = new StickerMessage(user, "1", "1", "mid", "testing token");

                robot.receive(msg, function(){
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, expected);
                    stub.restore();
                    done();
                });
            });
        })
    });


    describe('when hear a Webhook request from Line', function() {
        var httpRequest;
        var autoPassValidate;
        var input;

        before(function(done){
            autoPassValidate = sinon.stub(adapter.streaming, 'validateSignature').returns(true);

            httpRequest = robot.http('http://localhost:8080')
                .header('Content-Type', 'application/json')
                .header('x-line-signature', "test");
            input = {
              "events": [
                  {
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "type": "message",
                    "timestamp": 1462629479859,
                    "source": {
                         "type": "user",
                         "userId": "U206d25c2ea6bd87c17655609a1c37cb8"
                     },
                     "message": {/*  override me */}
                  }
              ]
            };
            done();
        });

        after(function(){
            autoPassValidate.restore();
        });

        describe('with text message content', function() {
            var json;
            var message = {
                "id": "325708",
                "type": "text",
                "text": "Hello, world"
            };

            before(function(done){
                // Because this test is only for testing LineStreaming.
                // In oreder to avoid trigger the real flow, don't send text like "@Testhubot hello"
                input.events[0].message = message;
                json = JSON.stringify(input);
                done();
            });

            it("should emit a text event to customize scripts", function(done) {

                var spy = sinon.spy();
                var expected = {
                    "sourceId": "U206d25c2ea6bd87c17655609a1c37cb8",
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "message": message
                }

                adapter.streaming.once('text', spy);
                // console.log(adapter.streaming.listenerCount('TextMessage'));
                // Fire http
                httpRequest.post(json)(function(err, res, body){
                    if (res.statusCode == 200){
                        // console.log('Fire Succeed');
                        // console.log("Success, response body: " + body);
                    }
                });

                setTimeout(function(){
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWith(spy, expected.sourceId, expected.replyToken, expected.message);
                    done();
                }, 20);

            });
        });

        describe('with sticker message content', function() {
            var json;
            var message = {
                "id": "325708",
                "type": "sticker",
                "packageId": "1",
                "stickerId": "1"
            };

            before(function(done){
                // Because this test is only for testing LineStreaming.
                // In oreder to avoid trigger the real flow, don't send text like "@Testhubot hello"
                input.events[0].message = message;
                json = JSON.stringify(input);
                done();
            });

            it("should emit a sticker event to customize scripts", function(done) {

                var spy = sinon.spy();
                var expected = {
                    "sourceId": "U206d25c2ea6bd87c17655609a1c37cb8",
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "message": message
                }

                adapter.streaming.once('sticker', spy);
                // console.log(adapter.streaming.listenerCount('TextMessage'));
                // Fire http
                httpRequest.post(json)(function(err, res, body){
                    if (res.statusCode == 200){
                        // console.log('Fire Succeed');
                        // console.log("Success, response body: " + body);
                    }
                });

                setTimeout(function(){
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWith(spy, expected.sourceId, expected.replyToken, expected.message);
                    done();
                }, 20);

            });
        });

    });
})
