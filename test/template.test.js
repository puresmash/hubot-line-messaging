
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

describe('Test template messages', function() {
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
        // Reply a Template Msg
        describe('giving Template Respond Rule defined', ()=>{
            const replyToken = 'testing token';
            let tmsg;

            before(function(done){
                robot.respond(/template/i, function(res){
                    tmsg = BuildTemplateMessage
                    .init('this is a buttons template')
                    .buttons({
                        "thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
                        "title": "Menu",
                        "text": "Please select"
                    })
                    .action('postback', {
                        "label": "Buy",
                        "data": "action=buy&itemid=123"
                    })
                    .action('postback', {
                        "label": "Add to cart",
                        "data": "action=add&itemid=123"
                    })
                    .action('uri', {
                        "label": "View detail",
                        "uri": "http://example.com/page/123"
                    })
                    .build();
                    res.reply(tmsg);
                });
                done();
            });

            it('should reply a template message', (done)=>{
                const stub = sinon.stub(adapter, '_sendReply');
                const expectedMsg = {
                    "type": "template",
                    "altText": "this is a buttons template",
                    "template": {
                        "type": "buttons",
                        "thumbnailImageUrl": "https://example.com/bot/images/image.jpg",
                        "title": "Menu",
                        "text": "Please select",
                        "actions": [
                          {
                            "type": "postback",
                            "label": "Buy",
                            "data": "action=buy&itemid=123"
                          },
                          {
                            "type": "postback",
                            "label": "Add to cart",
                            "data": "action=add&itemid=123"
                          },
                          {
                            "type": "uri",
                            "label": "View detail",
                            "uri": "http://example.com/page/123"
                          }
                        ]
                    }
                }
                const expected = {
                    replyToken,
                    "messages": [
                        expectedMsg
                    ]
                }

                let msg = new TextMessage(user, "@TestHubot template");
                msg.replyToken = replyToken;

                robot.receive(msg, function(){
                    sinon.assert.calledOnce(stub);
                    // console.log(JSON.stringify(stub.args[0][0]));
                    sinon.assert.calledWith(stub, expected);
                    stub.restore();
                    done();
                });
            })
        })
        // Reply a Confirm Msg
        describe('giving Confirm Respond Rule defined', ()=>{
            const replyToken = 'testing token';
            let tmsg;

            before(function(done){
                robot.respond(/confirm/i, function(res){
                    tmsg = BuildTemplateMessage
                    .init('this is a confirm template')
                    .confirm({
                        "text": "Are you sure?"
                    })
                    .action('message', {
                        "label": "Yes",
                        "text": "yes"
                    })
                    .action('message', {
                        "label": "No",
                        "text": "no"
                    })
                    .build();

                    res.reply(tmsg);
                });
                done();
            });

            it('should reply a confirm message', (done)=>{
                const stub = sinon.stub(adapter, '_sendReply');
                const expectedMsg = {
                  "type": "template",
                  "altText": "this is a confirm template",
                  "template": {
                      "type": "confirm",
                      "text": "Are you sure?",
                      "actions": [
                          {
                            "type": "message",
                            "label": "Yes",
                            "text": "yes"
                          },
                          {
                            "type": "message",
                            "label": "No",
                            "text": "no"
                          }
                      ]
                  }
                }
                const expected = {
                    replyToken,
                    "messages": [
                        expectedMsg
                    ]
                }
                // console.log(util.inspect(testing,true,null));
                let msg = new TextMessage(user, "@TestHubot confirm");
                msg.replyToken = replyToken;

                robot.receive(msg, function(){
                    sinon.assert.calledOnce(stub);
                    // console.log(JSON.stringify(stub.args[0][0]));
                    sinon.assert.calledWith(stub, expected);
                    stub.restore();
                    done();
                });
            })
        })
        // Reply a Confirm Msg
        describe('giving Carousel Respond Rule defined', ()=>{
            const replyToken = 'testing token';
            let tmsg;

            before(function(done){
                robot.respond(/carousel/i, function(res){
                    tmsg = BuildTemplateMessage
                        .init('this is a carousel template')
                        .carousel({
                            "thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
                            "title": "this is menu",
                            "text": "description"
                        })
                        .action('postback', {
                            "label": "Buy",
                            "data": "action=buy&itemid=111"
                        })
                        .action('postback', {
                            "label": "Add to cart",
                            "data": "action=add&itemid=111"
                        })
                        .action('uri', {
                            "label": "View detail",
                            "uri": "http://example.com/page/111"
                        })
                        .carousel({
                            "thumbnailImageUrl": "https://example.com/bot/images/item2.jpg",
                            "title": "this is menu",
                            "text": "description"
                        })
                        .action('postback', {
                            "label": "Buy",
                            "data": "action=buy&itemid=222"
                        })
                        .action('postback', {
                            "label": "Add to cart",
                            "data": "action=add&itemid=222"
                        })
                        .action('uri', {
                            "label": "View detail",
                            "uri": "http://example.com/page/222"
                        })
                        .build();

                    res.reply(tmsg);
                });
                done();
            });

            it('should reply a carousel message', (done)=>{
                const stub = sinon.stub(adapter, '_sendReply');
                const expectedMsg = {
                    "type": "template",
                    "altText": "this is a carousel template",
                    "template": {
                        "type": "carousel",
                        "columns": [{
                            "thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
                            "title": "this is menu",
                            "text": "description",
                            "actions": [{
                                "type": "postback",
                                "label": "Buy",
                                "data": "action=buy&itemid=111"
                            }, {
                                "type": "postback",
                                "label": "Add to cart",
                                "data": "action=add&itemid=111"
                            }, {
                                "type": "uri",
                                "label": "View detail",
                                "uri": "http://example.com/page/111"
                            }]
                        }, {
                            "thumbnailImageUrl": "https://example.com/bot/images/item2.jpg",
                            "title": "this is menu",
                            "text": "description",
                            "actions": [{
                                "type": "postback",
                                "label": "Buy",
                                "data": "action=buy&itemid=222"
                            }, {
                                "type": "postback",
                                "label": "Add to cart",
                                "data": "action=add&itemid=222"
                            }, {
                                "type": "uri",
                                "label": "View detail",
                                "uri": "http://example.com/page/222"
                            }]
                        }]
                    }
                }
                const expected = {
                    replyToken,
                    "messages": [
                        expectedMsg
                    ]
                }
                // console.log(util.inspect(testing,true,null));
                let msg = new TextMessage(user, "@TestHubot carousel");
                msg.replyToken = replyToken;

                robot.receive(msg, function(){
                    sinon.assert.calledOnce(stub);
                    // console.log(JSON.stringify(stub.args[0][0]));
                    sinon.assert.calledWith(stub, expected);
                    stub.restore();
                    done();
                });
            })
        })
    });

})
