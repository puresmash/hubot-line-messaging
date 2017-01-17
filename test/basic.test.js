
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

describe('Test basic messages', function() {
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

    describe('when receiving Text Message from adapter', function(){
        // Reply a Text
        describe('giving Text Respond Rule defined', function(){
            const type = 'text';
            const replyToken = 'testing token';
            const text = 'world';

            before(function(done){
                robot.respond(/hello/i, function(res){
                    res.reply('world');
                });
                done();
            });

            it("should reply a text", function(done) {
                const stub = sinon.stub(adapter, '_sendReply');
                const expected = {
                    replyToken,
                    "messages": [{
                        type,
                        text
                    }]
                }

                // Receive TextMessage
                let msg = new TextMessage(user, "@TestHubot hello");
                msg.replyToken = replyToken;

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
            const type = 'sticker';
            const replyToken = 'testing token';
            const packageId = '1';
            const stickerId = '1';

            before(function(done){
                robot.respond(/sticker (.*)/i, function(res){
                    let keyword = res.match[1];
                    let sticker = new SendSticker(keyword, packageId);
                    res.reply(sticker);
                });
                done();
            });

            it("should reply a sticker", function(done) {
                const stub = sinon.stub(adapter, '_sendReply');
                const expected = {
                    replyToken,
                    "messages": [{
                        type,
                        packageId,
                        stickerId
                    }]
                }

                let msg = new TextMessage(user, "@TestHubot sticker 1");
                msg.replyToken = replyToken;

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
            const type = 'location';
            const replyToken = 'testing token';
            const title = 'ＬＩＮＥ';
            const address = '〒150-0002 東京都渋谷区渋谷２丁目２１−１';
            const latitude = 35.65910807942215;
            const longitude = 139.70372892916203;

            before(function(done){
                robot.respond(/location/i, function(res){
                    let location = new SendLocation(title, address, latitude, longitude);
                    res.emote(location);
                });
                done();
            });

            it("should reply a location", function(done) {
                const stub = sinon.stub(adapter, '_sendReply');
                const expected = {
                    replyToken,
                    "messages": [{
                        type,
                        title,
                        address,
                        latitude,
                        longitude
                    }]
                }

                let msg = new TextMessage(user, "@TestHubot location");
                msg.replyToken = replyToken;

                robot.receive(msg, function(){
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, expected);
                    stub.restore();
                    done();
                });

            });
        });
        // Reply a Image
        describe('giving Image Respond Rule defined', function() {
            const type = 'image';
            const replyToken = 'testing token';
            const originalContentUrl = 'https://placeholdit.imgix.net/~text?txtsize=34&txt=360%C3%97360&w=360&h=360';
            const previewImageUrl = 'https://placeholdit.imgix.net/~text?txtsize=23&txt=240%C3%97240&w=240&h=240';

            before(function(done){
                robot.respond(/image/i, function(res){
                    res.reply(new SendImage(originalContentUrl, previewImageUrl));
                });
                done();
            });

            it("should reply a image", function(done) {
                const stub = sinon.stub(adapter, '_sendReply');
                const expected = {
                    replyToken,
                    "messages": [{
                        type,
                        originalContentUrl,
                        previewImageUrl,
                    }]
                }

                let msg = new TextMessage(user, "@TestHubot image");
                msg.replyToken = replyToken;

                robot.receive(msg, function(){
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, expected);
                    stub.restore();
                    done();
                });

            });
        });
        // Reply a Video
        describe('giving Video Respond Rule defined', function() {
            const type = 'video';
            const replyToken = 'testing token';
            const originalContentUrl = 'https://example.com/original.mp4';
            const previewImageUrl = 'https://example.com/preview.jpg';

            before(function(done){
                robot.respond(/video/i, function(res){
                    res.reply(new SendVideo(originalContentUrl, previewImageUrl));
                });
                done();
            });

            it("should reply a video", function(done) {
                const stub = sinon.stub(adapter, '_sendReply');
                const expected = {
                    replyToken,
                    "messages": [{
                        type,
                        originalContentUrl,
                        previewImageUrl,
                    }]
                }

                let msg = new TextMessage(user, "@TestHubot video");
                msg.replyToken = replyToken;

                robot.receive(msg, function(){
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, expected);
                    stub.restore();
                    done();
                });

            });
        });
        // Reply a Audio
        describe('giving Audio Respond Rule defined', function() {
            const type = 'audio';
            const replyToken = 'testing token';
            const originalContentUrl = 'https://example.com/original.m4a';
            const duration = 240000;

            before(function(done){
                robot.respond(/audio/i, function(res){
                    res.reply(new SendAudio(originalContentUrl, duration));
                });
                done();
            });

            it("should reply a audio", function(done) {
                const stub = sinon.stub(adapter, '_sendReply');
                const expected = {
                    replyToken,
                    "messages": [{
                        type,
                        originalContentUrl,
                        duration,
                    }]
                }

                let msg = new TextMessage(user, "@TestHubot audio");
                msg.replyToken = replyToken;

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

                const msg = new StickerMessage(user, "1", "1", "mid", "testing token", "user");

                robot.receive(msg, function(){
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, expected);
                    stub.restore();
                    done();
                });
            });
        })
    });

})
