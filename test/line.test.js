
"use strict";

// var expect = require("chai").expect;
const sinon = require("sinon");
const path   = require("path");

const Robot       = require("hubot/src/robot");
const TextMessage = require("hubot/src/message").TextMessage;

const LineMessaging = require('index')
const SendSticker = LineMessaging.SendSticker;
const SendLocation = LineMessaging.SendLocation;
const SendImage = LineMessaging.SendImage;
const SendVideo = LineMessaging.SendVideo;
const SendText = LineMessaging.SendText;
const SendAudio = LineMessaging.SendAudio;
const StickerMessage = LineMessaging.StickerMessage;

describe('Test Line Adapter', function() {
    let robot;
    let user;
    let adapter;

    before(function(done){
        // Hubot will require(hubot-adapter) in robot.coffee
        // Ensure NODE_PATH is set to root (NODE_PATH=.)
        robot = new Robot(null, 'adapter', true, 'TestHubot');
        robot.adapter.on("connected", function() {
            // console.log('adapter connected');
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
        // Reply a Text
        describe('giving Text Respond Rule defined', function(){
            before(function(done){
                robot.respond(/hello/i, function(res){
                    res.reply('world');
                });
                done();
            });

            it("should reply a text", function(done) {
                const stub = sinon.stub(adapter, '_sendReply');
                const expected = {
                    "replyToken": "testing token",
                    "messages": [{
                        "type": "text",
                        "text": "world"
                    }]
                }

                // Receive TextMessage
                let msg = new TextMessage(user, "@TestHubot hello");
                msg.replyToken = 'testing token';

                robot.receive(msg, function() {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, expected);
                    stub.restore();
                    done();
                });
            });
        });
        // Reply a Sticker
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
                const stub = sinon.stub(adapter, '_sendReply');
                const expected = {
                    "replyToken": "testing token",
                    "messages": [{
                        "type": "sticker",
                        "packageId": "1",
                        "stickerId": "1"
                    }]
                }

                let msg = new TextMessage(user, "@TestHubot sticker 1");
                msg.replyToken = 'testing token';

                robot.receive(msg, function(){
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, expected);
                    stub.restore();
                    done();
                });

            });
        });
        // Reply a Location
        describe('giving Location Respond Rule defined', function() {
            before(function(done){
                robot.respond(/location/i, function(res){
                    // ＬＩＮＥ株式会社
                    let location =
                        new SendLocation(
                            'ＬＩＮＥ',
                            '〒150-0002 東京都渋谷区渋谷２丁目２１−１',
                            35.65910807942215,
                            139.70372892916203
                        );
                    res.emote(location);
                });
                done();
            });

            it("should reply a location", function(done) {
                const stub = sinon.stub(adapter, '_sendReply');
                const expected = {
                    "replyToken": "testing token",
                    "messages": [{
                        "type": "location",
                        "title": "ＬＩＮＥ",
                        "address": "〒150-0002 東京都渋谷区渋谷２丁目２１−１",
                        "latitude": 35.65910807942215,
                        "longitude": 139.70372892916203
                    }]
                }

                let msg = new TextMessage(user, "@TestHubot location");
                msg.replyToken = 'testing token';

                robot.receive(msg, function(){
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, expected);
                    stub.restore();
                    done();
                });

            });
        });
    });

    describe('when receiving Sticker Message from adapter', function(){
        before(function(done){
            const matcher = function(message){
                // Not implement listenrt, so should CatchAllMessage.message
                if (message.message instanceof StickerMessage){
                    // console.log('INTO MATCHER');
                    return true
                }
                return false;
            }
            robot.listen(matcher, function(res){
                const stickerMessage = res.message.message;
                res.envelope.message = stickerMessage;
                const sticker = new SendSticker(stickerMessage.stickerId, stickerMessage.packageId);
                res.reply(sticker);
            });
            done();
        });

        describe('giving Sticker Respond Rule defined', function(){
            it('should reply a sticker', function(done){
                let stub = sinon.stub(adapter, '_sendReply');
                const expected = {
                    "replyToken": "testing token",
                    "messages": [{
                        "type": "sticker",
                        "packageId": "1",
                        "stickerId": "1"
                    }]
                }

                const msg = new StickerMessage(user, "1", "1", "mid", "testing token");

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
        let httpRequest;
        let autoPassValidate;
        let input;

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

        //
        describe('with wrong x-line-signature', ()=>{
            let json;
            before((done)=>{
                autoPassValidate.returns(false);
                json = JSON.stringify(input);
                done();
            });
            it('should stop propagation', (done)=>{
                const stub = sinon.stub(robot.logger, 'error');
                httpRequest.post(json);
                setTimeout(function(){
                    sinon.assert.calledTwice(stub);
                    sinon.assert.calledWith(stub, "Failed validate, result: false");
                    stub.restore();
                    done();
                }, 30);

            });
            after((done)=>{
                autoPassValidate.returns(true);
                done();
            })
        });

        describe('with text message content', function() {
            let json;
            const message = {
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
                const spy = sinon.spy();
                const expected = {
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
                }, 30);

            });
        });

        describe('with sticker message content', function() {
            let json;
            const message = {
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
                const spy = sinon.spy();
                const expected = {
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
                }, 30);

            });
        });
    });
})
