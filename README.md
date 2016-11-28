# hubot-line-messaging

This is a Hubot adapter for [Line Messaging API](https://business.line.me/zh-hant/services/bot) and it supports Line Business Center. This adapter currently only supports [reply text message](https://devdocs.line.me/en/?shell#reply-message), but will include more messaging api recently. 

## Installation

Install this adapter to your project by running

```sh
npm install --save hubot-line-messaging
```

## Configuration

There are several environment variables need to be set in your Node.js server

```sh
HUBOT_NAME=${your_bot_name}
HUBOT_LINE_TOKEN="${your_token}"
LINE_CHANNEL_SECRET=${CHANNEL_SECRET}
```

If you are using Heroku, the command will be

```sh
heroku config:add HUBOT_NAME=${your_bot_name}
heroku config:add HUBOT_LINE_TOKEN="${your_token}"
heroku config:add LINE_CHANNEL_SECRET=${CHANNEL_SECRET}
```

## Usage

Once you configure environment variables well, start your robot as bellow

```sh
./bin/hubot -a line-messaging
```

As mentioned in [Hubot's document](https://github.com/github/hubot/blob/master/docs/scripting.md#hearing-and-responding), if your robot's name is BB8, wake it up like below:

- @BB8 ${keyword}
- BB8, ${keyword}
- BB8: ${keyword}

Unlike some hubot adapter, it won't response unless you include robot's name in the beginning of your message.

## Remark

Debug on Heroku

```sh
heroku config:add HUBOT_LOG_LEVEL=debug
heroku logs --tail
```