
// var expect = require("chai").expect;
var sinon = require("sinon");
var path   = require("path");

var Robot       = require("hubot/src/robot");
var TextMessage = require("hubot/src/message").TextMessage;
// var Adapter = require("hubot-adapter");

describe('Test adapter reply', function() {
    var robot;
    var user;
    var adapter;
    var stub;

    beforeEach(function(done){
        // Hubot will require(hubot-adapter) in robot.coffee
        // Ensure NODE_PATH is set to root (NODE_PATH=.)
        robot = new Robot(null, 'adapter', true, 'TestHubot');

        robot.adapter.on("connected", function() {
            /**
             * #1 load hubot script from ./test/robot.js
             */
            // only load scripts we absolutely need
            // process.env.HUBOT_AUTH_ADMIN = "1";
            robot.loadFile(
                path.resolve(
                    path.join("test")
                ),
                "robot.js"
                // ,"auth.coffee"
            );
            // load the module under test and configure it for the
            // robot.  This is in place of external-scripts
            // require("index.coffee")(robot);

            /**
             * #2 dynamic specify hubot script using IIFE
             */
            // (function(robot){
            //     robot.respond(/hello/i, function(res){
            //         res.reply('world');
            //     });
            // })(robot)


            // create a user
            // user = robot.brain.userForId("1", {
            //     name: "mocha",
            //     room: "#mocha"
            // });
            user = robot.brain.userForId("1");

            adapter = robot.adapter;

            stub = sinon.stub(adapter, '_sendReply');

            done();
        });

        robot.run();
    });

    afterEach(function() {
        stub.restore();
        robot.shutdown();
    });

    it("responds when greeted", function(done) {
        // var spy = sinon.spy(adapter, '_sendReply');
        var expected = {
            "replyToken": "testing token",
            "messages": [{
                "type": "text",
                "text": "world"
            }]
        }
        // #1 Testing Methods
        // Insert setFn to replace adapter.reply and get msgObjs
        // adapter.forTesting(function(envelope, msgObjs){
        //     console.log(msgObjs);
        //     expect(msgObjs).match(/world/);
        //     done();
        // });

        // #2 Using Sinon.JS
        var token = 'testing';
        var msg = new TextMessage(user, "@TestHubot hello");
        // adapter.receive(new TextMessage(user, "hello"));
        // adapter.receive(new TextMessage(user, "Hubot:hello 中文"));
        msg.replyToken = 'testing token';
        adapter.receive(msg);

        setTimeout(function(){
            sinon.assert.calledOnce(stub);
            sinon.assert.calledWith(stub, expected);
            done();
        }, 10);

    });


})
