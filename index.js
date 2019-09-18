const cheerio = require("cheerio");
const Telegraf = require("telegraf");
const axios = require("axios");
require("dotenv").config();
const express = require("express");
const port = process.env.PORT || 5000;
const app = express();
app.listen(port, () => console.log(`Server started on port ${port}`));

app.get("/", (req, res) => {
  res.send("<h1>HELLO</h1>");
});

let currTime = new Date();
if (currTime.getHours() >= 7 && currTime.getHours() <= 17) {
  setInterval(() => {
    app.get("https://ancient-caverns-68428.herokuapp.com");
  }, 1800000);
}

const url =
  "http://www.itmm.unn.ru/studentam/raspisanie/raspisanie-bakalavriata-i-spetsialiteta-ochnoj-formy-obucheniya/";

async function getScheduleInfo() {
  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    return {
      date: $(".pagetext > div > p")
        .contents()
        .last()
        .text(),
      link: $(".pagetext > div > p > a")[3].attribs.href
    };
  } catch (err) {
    console.log(err);
  }
}

const bot = new Telegraf(process.env.BOT_TOKEN);
console.log("Bot is running!!!");
bot.start(ctx => ctx.reply("Hello \nFuck you :)"));
bot.help(ctx => ctx.reply('Use "/schedule" for fresh ITMM schedule'));
bot.action("delete", ({ deleteMessage }) => deleteMessage());

bot.command("help", ({ reply }) =>
  reply('Use "/schedule" for fresh ITMM schedule')
);

(async () => {
  let info = await getScheduleInfo();
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
})();

bot.launch();
