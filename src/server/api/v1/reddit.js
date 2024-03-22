"use strict";

const fetch = require("node-fetch");
const Joi = require("@hapi/joi");
const { getSentiment } = require("../../../shared");

module.exports = (app) => {
  /**
   * Fetches top posts for a subreddit
   */
  app.get("/v1/reddit/:subreddit/hot", async (req, res) => {
    try {
      const raw = await fetch(
        `https://api.reddit.com/r/${req.params.subreddit}/hot`
      );
      const posts = await raw.json();

      let tickerReq = req.params.q;

      console.log(req.params.subreddit);

      // should import function
      const formatted_posts = posts.data.children.map((post) => {
        return {
          title: post.data.title,
          body: post.data.selftext,
          ups: post.data.ups,
          upvote_ratio: post.data.upvote_ratio,
          total_awards_received: post.data.total_awards_received,
          created: post.data.created,
          author: post.data.author,
          url: post.data.url,
          score: post.data.score,
        };
      });

      formatted_posts.forEach(async (element) => {
        element["ticker"] = req.params.subreddit;
      });

      res.status(200).send(Object.assign({}, formatted_posts));
    } catch (err) {
      console.log(
        `Getting trending subreddit posts failed: ${req.params.subreddit}`,
        err
      );
      return res.status(404).send({
        error: `Getting reddit posts failed: ${req.params.subreddit}`,
      });
    }
  });

  /**
   * Searches a subreddit and saves results
   */
  app.get("/v1/reddit/:subreddit/search/:q", async (req, res) => {
    try {
      const raw = await fetch(
        `https://api.reddit.com/r/${req.params.subreddit}/search?q=${req.params.q}`
      );
      const posts = await raw.json();

      const formatted_posts = posts.data.children.map((post) => {
        return {
          title: post.data.title,
          body: post.data.selftext,
          ups: post.data.ups,
          upvote_ratio: post.data.upvote_ratio,
          total_awards_received: post.data.total_awards_received,
          created: new Date(post.data.created * 1000),

          author: post.data.author,
          url: post.data.url,
          score: post.data.score,
          sentiment: getSentiment(post.data.selftext),
        };
      });

      formatted_posts.forEach(async (element) => {
        element["ticker"] = req.params.q;
      });

      // console.log(formatted_posts);

      //saves posts to db
      formatted_posts.forEach(async (post) => {
        try {
          post = await new app.models.Reddit(post);
          await post.save();
        } catch (err) {
          const message = err.details[0].message;
          console.log(`Reddit.save failed: ${message}`);
          return res
            .status(404)
            .send({ error: `Reddit post save failed: ${req.params.gameId}` });
        }
      });

      res.status(200).send(Object.assign({}, formatted_posts));
    } catch (err) {
      console.log(
        `Getting trending subreddit posts failed: ${req.params.subreddit}`,
        err
      );
      return res.status(404).send({
        error: `Getting reddit posts failed: ${req.params.subreddit}`,
      });
    }
  });

  /**
   * Searches a subreddit and saves results
   */
  app.get("/v1/test/reddit/:q", async (req, res) => {
    try {
      const raw = await fetch(
        `https://api.reddit.com/r/wallstreetbets/search?q=${req.params.q}`
      );
      const posts = await raw.json();

      const start = new Date("03/10/2021");
      let loop = new Date(start);

      const formatted_posts = {};
      posts.data.children.forEach((post) => {
        const newDate = loop.setDate(loop.getDate() + 1);
        loop = new Date(newDate);
        formatted_posts[loop.toDateString()] = {
          sentiment: getSentiment(post.data.selftext),
          date: loop.toDateString(),
        };
      });

      res.status(200).send(formatted_posts);
    } catch (err) {
      console.log(
        `Getting trending subreddit posts failed: ${req.params.subreddit}`,
        err
      );
      return res.status(404).send({
        error: `Getting reddit posts failed: ${req.params.subreddit}`,
      });
    }
  });
};
