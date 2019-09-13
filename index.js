const cheerio = require("cheerio");
const Telegraf = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const url =
  "http://www.itmm.unn.ru/studentam/raspisanie/raspisanie-bakalavriata-i-spetsialiteta-ochnoj-formy-obucheniya/";

function getScheduleInfo() {
  return Promise.resolve(axios.get(url))
    .then(res => {
      const $ = cheerio.load(res.data);
      return {
        date: $(".pagetext > div > p")
          .contents()
          .last()
          .text(),
        link: $(".pagetext > div > p > a")[3].attribs.href
      };
    })
    .catch(err => {
      console.log(err);
    });
}

const bot = new Telegraf(process.env.BOT_TOKEN);
console.log("Bot is running!!!");
bot.start(ctx => ctx.reply("Hello \nFuck you :)"));
bot.help(ctx => ctx.reply('Use "/schedule" for fresh ITMM schedule'));
bot.action("delete", ({ deleteMessage }) => deleteMessage());

bot.command("help", ({ reply }) =>
  reply('Use "/schedule" for fresh ITMM schedule')
);

getScheduleInfo().then(info => {
  bot.command("schedule", ctx => {
    ctx.reply(info.date);
    const nameSplit = info.link.split("/");
    ctx.telegram
      .sendDocument(ctx.from.id, {
        url: info.link,
        filename: nameSplit[nameSplit.length - 1]
      })
      .catch(err => {
        if (err) console.log(err);
      });
  });
});

bot.launch();

