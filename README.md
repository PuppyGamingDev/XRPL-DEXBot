# XRPL-DEXBot
Discord bot to buy XRPL Tokens from the XRPL DEX using XRP

## Initial setup
Create a new file called `.env` and paste the following into it
```
TOKEN=
CLIENTID=
MONGOURI=
XUMM_API_KEY=
XUMM_API_SECRET=
```
Install the required packages with `npm install` or `npm i discord.js mongoose xrpl xumm-sdk dotenv node-schedule`

While they are installing you can begin gathering your information for the `.env` file.

- `TOKEN` and `CLIENTID` are your Bot Token and Client ID from Discord Application > [GUIDE HERE](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)
- `MONGOURI` is a MongoDB Connection String > [GUIDE HERE](https://www.mongodb.com/docs/guides/atlas/connection-string/)
- `XUMM_API_KEY` and `XUMM_API_SECRET` require you to create an application with XUMM and get the values > [GUIDE HERE](https://xumm.readme.io/docs/register-your-app)

Once you have all your values, in the console run `node deploy-commands.js` and it will register the Bot's commands globally so any server the bot is in will be able to use them.


On the Discord Developer Dashboard for your application, navigate to `OAUTH2 > URL Generator` and tick the boxes for `bot` & `application.commands` and copy the URL that is generated below it and paste into your browser to invite the bot to your server. (The bot shouldn't need any extra permissions as all interactions are based on replying to interactions and not actual posting)

Once your bot is in, in the console run `node bot.js` and you should see that it's running when it outputs `LedgerTips is running!`

## Commands

### /addtoken
This command will add a new token to the database

### /buy
This command will look at the open orders forthe current token and will respond with an approximate amount you would receive and provide you the XUMM Transaction to make the order, this uses the `tfSell` flag which will make it use ALL of your XRP you send if there is enough of the token available no matter what the price.

### /tip
While you are having fun, why not send me a tip if you feel I deserve it :)

## Finishing up
If you have any questions, my DMs are always open on

- Twitter > @iamshiffed
- Discord > Shiffed#2071
- New Discord Handles > shiffed
- Email > puppygamingdev@gmail.com

Tips are always welcome and help continue development

XRPL: `rm2AEVUcxeYh6ZJUTkWUqVRPurWdn4E9W`