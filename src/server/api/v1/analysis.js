"use strict";
const fetch = require("node-fetch");
const needle = require("needle");
const { resetWarningCache } = require("prop-types");

const apiKey = ``;

module.exports = (app) => {
  app.get(
    "/v1/analysis/ticker/:ticker/start/:startdate/end/:enddate",
    async (req, res) => {
      let stockApiEndpointUrl = `http://localhost:8000/v1/stocks/stocktimeseries/${req.params.ticker}/start/${req.params.startdate}/end/${req.params.enddate}`;

      let twitter, reddit, news;

      const start = new Date(req.params.startdate * 1000);
      const end = new Date(req.params.enddate * 1000);
      try {
        news = await app.models.News.find({
          ticker: req.params.ticker,
          datePublished: {
            $gte: start,
            $lte: end,
          },
        });
      } catch (e) {
        console.log(e);
      }
      try {
        const reddit1 = await app.models.Reddit.find({
          ticker: req.params.ticker,
          created: {
            $gte: start,
            $lte: end,
          },
        });
        // some of reddit articles have time in seconds
        const reddit2 = await app.models.Reddit.find({
          ticker: req.params.ticker,
          created: {
            $gte: start / 1000,
            $lte: end / 1000,
          },
        });
        reddit = reddit1.concat(reddit2);
      } catch (e) {
        console.log(e);
      }
      try {
        twitter = await app.models.Twitter.find({
          ticker: req.params.ticker,
          created_at: {
            $gte: start,
            $lte: end,
          },
        });
      } catch (e) {
        console.log(e);
      }

      let combinedData = await combineDataFunction(
        twitter,
        news,
        reddit,
        stockApiEndpointUrl
      );

      res.status(200).send(combinedData);
    }
  );

  app.get("/v1/analysis/:ticker", async (req, res) => {
    let stockApiEndpointUrl = `http://localhost:8000/v1/stocks/stocktimeseries/${req.params.ticker}/start/${req.params.startdate}/end/${req.params.enddate}`;

    let twitter, reddit, news;
    const ticker = req.params.ticker;
    const start = req.query.start;
    const end = req.query.end;

    let data = {};
    let fdata = {};
    try {
      const raw = await fetch(
        `http://localhost:8000/v1/analysis/ticker/${ticker}/start/${start}/end/${end}`
      );
      data = await raw.json();

      // get average sentiment per a day
      Object.values(data).forEach((val, index) => {
        const date = val.stock.date;
        let twitterAverage, redditAverage, newsAverage;
        if (val.tweets) {
          twitterAverage = {
            date: date,
            sentiment:
              val.tweets.reduce((acc, cur) => acc + cur.sentiment, 0) /
              val.tweets.length,
          };
        } else {
          twitterAverage = {
            date: date,
            sentiment: 0,
          };
        }
        if (val.news) {
          newsAverage = {
            date: date,
            sentiment:
              val.news.reduce((acc, cur) => acc + cur.sentiment, 0) /
              val.news.length,
          };
        } else {
          newsAverage = {
            date: date,
            sentiment: 0,
          };
        }
        if (val.reddit) {
          redditAverage = {
            date: date,
            sentiment:
              val.reddit.reduce((acc, cur) => acc + cur.sentiment, 0) /
              val.reddit.length,
          };
        } else {
          redditAverage = {
            date: date,
            sentiment: 0,
          };
        }
        fdata[date] = {
          stock: val.stock,
          news: newsAverage,
          reddit: redditAverage,
          tweets: twitterAverage,
        };
      });
    } catch (e) {
      console.log(e);
    }

    res.status(200).send(fdata);
  });
};

async function combineDataFunction(
  twitterPost,
  newsArticle,
  redditPost,
  endpoint
) {
  let response = await fetch(endpoint);

  let data = await response.json();

  const tweets = twitterPost.reduce((acc, cur, i) => {
    if (!acc[cur.created_at.toDateString()]) {
      acc[cur.created_at.toDateString()] = [];
    }
    acc[cur.created_at.toDateString()].push(cur);
    return acc;
  }, {});

  const reddits = redditPost.reduce((acc, cur, i) => {
    if (!acc[cur.created.toDateString()]) {
      acc[cur.created.toDateString()] = [];
    }
    acc[cur.created.toDateString()].push(cur);
    return acc;
  }, {});

  const news = newsArticle.reduce((acc, cur, i) => {
    if (!acc[cur.datePublished.toDateString()]) {
      acc[cur.datePublished.toDateString()] = [];
    }
    acc[cur.datePublished.toDateString()].push(cur);
    return acc;
  }, {});

  const combined = {};

  Object.values(data).forEach((val, index) => {
    combined[val.date] = {
      stock: val,
      news: news[val.date],
      reddit: reddits[val.date],
      tweets: tweets[val.date],
    };
  });

  return combined;
}
