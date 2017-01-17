
"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");
const path   = require("path");
const util = require("util");

const Robot       = require("hubot/src/robot");
const TextMessage = require("hubot/src/message").TextMessage;

const {
  SendSticker,
  SendLocation,
  SendImage,
  SendVideo,
  SendText,
  SendAudio,
  StickerMessage,
  BuildTemplateMessage,
} = require('index');

describe('Test webhook', function() {
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
        robot.server.close();
        robot.shutdown();
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
                         "userId": "U12345678901234567890123456789012"
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
            it('should return statusCode 403', (done)=>{
                const stub = sinon.stub(robot.logger, 'error');
                httpRequest.post(json)((err, res, body)=>{
                    expect(res.statusCode).to.equal(403);
                    stub.restore();
                    done();
                });
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
                    "source": {
                      "sourceId": "U12345678901234567890123456789012",
                      "sourceType": "user"
                    },
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "message": message
                };

                adapter.streaming.once('text', spy);
                // Fire http
                httpRequest.post(json)((err, res, body)=>{
                    expect(res.statusCode).to.equal(200);
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWith(spy, expected.source, expected.replyToken, expected.message);
                    done();
                });

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
                input.events[0].message = message;
                json = JSON.stringify(input);
                done();
            });

            it("should emit a sticker event to customize scripts", function(done) {
                const spy = sinon.spy();
                const expected = {
                    "source": {
                      "sourceId": "U12345678901234567890123456789012",
                      "sourceType": "user"
                    },
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "message": message
                }

                adapter.streaming.once('sticker', spy);
                // Fire http
                httpRequest.post(json)(function(err, res, body){
                    expect(res.statusCode).to.equal(200);
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWith(spy, expected.source, expected.replyToken, expected.message);
                    done();
                });

            });
        });

        describe('with image message content', function() {
            let json;
            const message = {
                "id": "325708",
                "type": "image"
            };

            before(function(done){
                input.events[0].message = message;
                json = JSON.stringify(input);
                done();
            });

            it("should emit a image event to customize scripts", function(done) {
                const spy = sinon.spy();
                const expected = {
                    "source": {
                      "sourceId": "U12345678901234567890123456789012",
                      "sourceType": "user"
                    },
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "message": message
                }

                adapter.streaming.once('image', spy);
                // Fire http
                httpRequest.post(json)(function(err, res, body){
                    expect(res.statusCode).to.equal(200);
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWith(spy, expected.source, expected.replyToken, expected.message);
                    done();
                });

            });
        });

        describe('with video message content', function() {
            let json;
            const message = {
                "id": "325708",
                "type": "video"
            };

            before(function(done){
                input.events[0].message = message;
                json = JSON.stringify(input);
                done();
            });

            it("should emit a video event to customize scripts", function(done) {
                const spy = sinon.spy();
                const expected = {
                    "source": {
                      "sourceId": "U12345678901234567890123456789012",
                      "sourceType": "user"
                    },
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "message": message
                }

                adapter.streaming.once('video', spy);
                // Fire http
                httpRequest.post(json)(function(err, res, body){
                    expect(res.statusCode).to.equal(200);
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWith(spy, expected.source, expected.replyToken, expected.message);
                    done();
                });

            });
        });

        describe('with audio message content', function() {
            let json;
            const message = {
                "id": "325708",
                "type": "audio"
            };

            before(function(done){
                input.events[0].message = message;
                json = JSON.stringify(input);
                done();
            });

            it("should emit a audio event to customize scripts", function(done) {
                const spy = sinon.spy();
                const expected = {
                    "source": {
                      "sourceId": "U12345678901234567890123456789012",
                      "sourceType": "user"
                    },
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "message": message
                }

                adapter.streaming.once('audio', spy);
                // Fire http
                httpRequest.post(json)(function(err, res, body){
                    expect(res.statusCode).to.equal(200);
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWith(spy, expected.source, expected.replyToken, expected.message);
                    done();
                });

            });
        });

        describe('with location message content', function() {
            let json;
            const message = {
                "id": "325708",
                "type": "location",
                "title": "my location",
                "address": "〒150-0002 東京都渋谷区渋谷２丁目２１−１",
                "latitude": 35.65910807942215,
                "longitude": 139.70372892916203
            };

            before(function(done){
                input.events[0].message = message;
                json = JSON.stringify(input);
                done();
            });

            it("should emit a location event to customize scripts", function(done) {
                const spy = sinon.spy();
                const expected = {
                    "source": {
                      "sourceId": "U12345678901234567890123456789012",
                      "sourceType": "user"
                    },
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "message": message
                }

                adapter.streaming.once('location', spy);
                // Fire http
                httpRequest.post(json)(function(err, res, body){
                    expect(res.statusCode).to.equal(200);
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWith(spy, expected.source, expected.replyToken, expected.message);
                    done();
                });

            });
        });

    });
})
