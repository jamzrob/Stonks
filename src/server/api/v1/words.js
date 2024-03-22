// "use strict";
sw = require("stopword");

module.exports = (app) => {
  /**
   * Does word bundeling for model
   */
  app.get("/v1/words/:ticker", async (req, res) => {
    let twitter, reddit, news;

    const ticker = req.params.ticker;
    const start = new Date(req.query.start * 1000);
    const end = new Date(req.query.end * 1000);

    try {
      news = await app.models.News.find({
        ticker,
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
        ticker,
        created: {
          $gte: start,
          $lte: end,
        },
      });
      // some of reddit articles have time in seconds
      const reddit2 = await app.models.Reddit.find({
        ticker,
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
        ticker,
        created_at: {
          $gte: start,
          $lte: end,
        },
      });
    } catch (e) {
      console.log(e);
    }
    wordSentiment = {};
    news.forEach((x) => {
      xWords = words(x.description, x.sentiment);
      wordSentiment = merge(xWords, wordSentiment);
    });

    twitter.forEach((x) => {
      xWords = words(x.text, x.sentiment);
      wordSentiment = merge(xWords, wordSentiment);
    });

    reddit.forEach((x) => {
      xWords = words(x.body, x.sentiment);
      wordSentiment = merge(xWords, wordSentiment);
    });

    sortedWordSentiment = Object.keys(wordSentiment)
      .sort((a, b) => wordSentiment[a] - wordSentiment[b])
      .reduce(
        (_sortedObj, key) => ({
          ..._sortedObj,
          [key]: wordSentiment[key],
        }),
        {}
      );

    maxSentimentVals = maxValues(sortedWordSentiment, 10);
    minSentimentVals = minValues(sortedWordSentiment, 10);
    mergedVals = merge(maxSentimentVals, minSentimentVals);
    res.status(200).send(JSON.stringify(mergedVals));
  });

  /**
   * Returns what top words belong to what feeds
   */
  app.post("/v1/words/match/:ticker", async (req, res) => {
    let twitter, reddit, news;

    const ticker = req.params.ticker;
    const start = new Date(req.query.start * 1000);
    const end = new Date(req.query.end * 1000);
    const words = req.body.words;

    try {
      news = await app.models.News.find({
        ticker: ticker,
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
        ticker: ticker,
        created: {
          $gte: start,
          $lte: end,
        },
      });
      // some of reddit articles have time in seconds
      const reddit2 = await app.models.Reddit.find({
        ticker: ticker,
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
        ticker: ticker,
        created_at: {
          $gte: start,
          $lte: end,
        },
      });
    } catch (e) {
      console.log(e);
    }

    let combined = {};

    Object.keys(words).forEach((w) => {
      combined[w] = {};
      combined[w]["reddit"] = filterByValueReddit(reddit, w);
      combined[w]["news"] = filterByValueNews(news, w);
      combined[w]["twitter"] = filterByValueTwitter(twitter, w);
    });

    res.status(200).send(JSON.stringify(combined));
  });

  function words(str, sentiment) {
    return sw
      .removeStopwords(
        str
          .replace(/['"-]+/g, "")
          .toLowerCase()
          .split(/[\s,\n.!():]+/)
      )
      .reduce(function (count, word) {
        count[word] = count.hasOwnProperty(word)
          ? count[word] + sentiment
          : sentiment;

        return count;
      }, {});
  }
};

function merge(...objects) {
  const merged = objects.reduce((a, obj) => {
    Object.entries(obj).forEach(([key, val]) => {
      a[key] = (a[key] || 0) + val;
    });
    return a;
  }, {});
  return Object.fromEntries(Object.entries(merged).sort((a, b) => b[1] - a[1]));
}

function maxValues(o, n) {
  const values = Object.values(o).sort((a, b) => b - a);

  if (values.length <= n) return o;

  const maxN = values[n - 1];

  return Object.entries(o).reduce(
    (o, [k, v]) => (v >= maxN ? { ...o, [k]: v } : o),
    {}
  );
}

function minValues(o, n) {
  const values = Object.values(o).sort((a, b) => a - b);

  if (values.length <= n) return o;

  const maxN = -1 * values[n - 1];

  return Object.entries(o).reduce(
    (o, [k, v]) => (v * -1 >= maxN ? { ...o, [k]: v } : o),
    {}
  );
}

function filterByValueReddit(array, string) {
  return array
    .filter((o) => o.body.toLowerCase().includes(string.toLowerCase()))
    .map((x) => x.created.toDateString());
}

function filterByValueNews(array, string) {
  return array
    .filter((o) => o.description.toLowerCase().includes(string.toLowerCase()))
    .map((x) => x.datePublished.toDateString());
}

function filterByValueTwitter(array, string) {
  return array
    .filter((o) => o.text.toLowerCase().includes(string.toLowerCase()))
    .map((x) => x.created_at.toDateString());
}
