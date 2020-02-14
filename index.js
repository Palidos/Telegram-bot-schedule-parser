const cheerio = require("cheerio");
const Telegraf = require("telegraf");
const axios = require("axios");
const http = require("http");
require("dotenv").config();
const express = require("express");
const port = process.env.PORT || 5000;
const app = express();
app.listen(port, () => console.log(`Server started on port ${port}`));

let lastScheduleFileName = null;

app.get("/", (req, res) => {
  res.send("<h1>HELLO</h1>");
});

let currTime = new Date();
if (currTime.getHours() >= 7 && currTime.getHours() <= 17) {
  setInterval(() => {
    http.get("https://ancient-caverns-68428.herokuapp.com");
  }, 100000);
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

setInterval(async() => {
  let info = await getScheduleInfo();
  bot.telegram.sendMessage(process.env.CHAT_ID, info.date);
  const filename = info.link.split("/").pop();
  if (filename !== lastScheduleFileName) {
    lastScheduleFileName = filename;
    bot.telegram.sendDocument(process.env.CHAT_ID, {
      url: info.link,
      filename,
    })
      .catch(err => {
        console.log(err);
      });
  }
}, 100000);


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
    const filename = info.link.split("/").pop();
    ctx.telegram
      .sendDocument(ctx.from.id, {
        url: info.link,
        filename,
      })
      .catch(err => {
        console.log(err);
      });
  });
})();

bot.launch();
