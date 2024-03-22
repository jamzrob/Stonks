"use strict";

const fetch = require("node-fetch");
const Joi = require("@hapi/joi");
const { getSentiment } = require("../../../shared");

const needle = require("needle");

module.exports = (app) => {
  /**
   * Fetches top posts for a subreddit
   */
  app.get("/v1/test/analysis/:ticker", async (req, res) => {
    const ticker = req.params.ticker;
    const start = req.query.start;
    const end = req.query.end;
    const stocks = await getRequest(
      `https://thestonkify.com/v1/test/stocks/${ticker}?start=${start}&end=${end}`
    );
    // const news = await getRequest(
    //   `https://thestonkify.com/v1/test/news/${ticker}`
    // );
    const reddit = await getRequest(
      `https://thestonkify.com/v1/test/reddit/${ticker}`
    );
    const twitter = await getRequest(
      `https://thestonkify.com/v1/test/twitter/${ticker}`
    );
    const combined = {};
    Object.values(stocks).forEach((val, index) => {
      if (reddit[val.date] && twitter[val.date]) {
        combined[val.date] = {
          stock: val,
          // news: news[val.date],
          reddit: reddit[val.date],
          tweets: twitter[val.date],
        };
      }
    });
    console.log(combined);
    res.send(combined);
  });
};

async function getRequest(endpointUrl) {
  const res = await needle("get", endpointUrl);
  if (res.body) {
    return res.body;
  } else {
    throw new Error("Unsuccessful request");
  }
}
