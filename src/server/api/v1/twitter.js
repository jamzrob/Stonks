"use strict";

const needle = require("needle");
const token =
  "";
const { getSentiment } = require("../../../shared");
module.exports = (app) => {
  /**
   * Fetches a user information
   * username is the twitter users username
   */
  app.get("/v1/twitter/user/:username", async (req, res) => {
    const endpointURL = "https://api.twitter.com/2/users/by?usernames=";
    try {
      // These are the parameters for the API request
      // specify User names to fetch, and any additional fields that are required
      // by default, only the User ID, name and user name are returned
      const params = {
        usernames: req.params.username, // Edit usernames to look up
        "user.fields": "created_at,description", // Edit optional query parameters here
        expansions: "pinned_tweet_id",
      };
      const response = await getRequest(endpointURL, params);
      console.dir(response, {
        depth: null,
        colors: true,
      });
      res.send(response);
    } catch (e) {
      console.log(e);
      res.sendStatus(400);
    }
  });

  /*
   * Gets a single Tweet
   * params: the tweet id
   */
  app.get("/v1/tweet/:id", async (req, res) => {
    const endpointUrl = "https://api.twitter.com/2/tweets?ids=";
    try {
      const params = {
        ids: req.params.id, // Edit Tweet IDs to look up
        "tweet.fields": "lang,author_id", // Edit optional query parameters here
        "user.fields": "created_at", // Edit optional query parameters here
      };
      const response = await getRequest(endpointUrl, params);
      res.send(response);
    } catch (e) {
      console.log(e);
      res.sendStatus(400);
    }
  });

  /*
   * Gets a single Tweet
   * params: the tweet id
   */
  app.get("/v1/tweet/:id", async (req, res) => {
    const endpointUrl = "https://api.twitter.com/2/tweets?ids=";
    try {
      const params = {
        ids: req.params.id, // Edit Tweet IDs to look up
        "tweet.fields": "lang,author_id", // Edit optional query parameters here
        "user.fields": "created_at", // Edit optional query parameters here
      };
      const response = await getRequest(endpointUrl, params);
      res.send(response);
    } catch (e) {
      console.log(e);
      res.sendStatus(400);
    }
  });

  /*
   * Gets full archieve of tweet from verified users
   * params: the tweet id
   */
  app.get("/v1/tweets_isverified/:query", async (req, res) => {
    const endpointUrl = "https://api.twitter.com/2/tweets/search/recent";
    try {
      const params = {
        query: req.params.query + " -is:retweet lang:en" + " is:verified",
        max_results: "100",
        "tweet.fields": "created_at,entities,public_metrics",
      };
      const response = await getRequest(endpointUrl, params);

      let filtered_response = [];
      response.data.forEach(async (post) => {
        filtered_response.push({
          text: post.text,
          id: post.id,
          created_at: post.created_at,
          retweet_count: post.public_metrics.retweet_count,
          reply_count: post.public_metrics.reply_count,
          like_count: post.public_metrics.like_count,
          quote_count: post.public_metrics.quote_count,
          sentiment: getSentiment(post.text),
        });
      });

      filtered_response.forEach(async (post) => {
        try {
          post = await new app.models.Twitter(post);
          await post.save();
        } catch (err) {
          const message = err.details[0].message;
          console.log(`Twitter.save failed: ${message}`);
          return res.status(404).send({ error: `Twitter post save failed` });
        }
      });

      res.send(response);
    } catch (e) {
      console.log(e);
      res.sendStatus(400);
    }
  });

  app.get("/v1/twitter/:query", async (req, res) => {
    const endpointUrl = "https://api.twitter.com/2/tweets/search/recent";
    try {
      const params = {
        query: req.params.query + " -is:retweet lang:en" + " is:verified",
        max_results: "100",
        "tweet.fields": "created_at,entities,public_metrics",
      };
      const response = await getRequest(endpointUrl, params);

      const filtered_response = [];
      response.data.forEach(async (post) => {
        filtered_response.push({
          text: post.text,
          id: post.id,
          created_at: post.created_at,
          retweet_count: post.public_metrics.retweet_count,
          reply_count: post.public_metrics.reply_count,
          like_count: post.public_metrics.like_count,
          quote_count: post.public_metrics.quote_count,
          sentiment: getSentiment(post.text),
        });
      });

      filtered_response.forEach(async (element) => {
        element["ticker"] = req.params.query;
      });

      filtered_response.forEach(async (post) => {
        try {
          post = await new app.models.Twitter(post);
          await post.save();
        } catch (err) {
          const message = err.details[0].message;
          console.log(`Twitter.save failed: ${message}`);
          return res.status(404).send({ error: `Twitter post save failed` });
        }
      });

      res.send(filtered_response);
    } catch (e) {
      console.log(e);
    }
  });

  /*
   * Gets full archieve of tweeet
   * params: the tweet id
   */
  app.get("/v1/test/twitter/:query", async (req, res) => {
    const endpointUrl = "https://api.twitter.com/2/tweets/search/recent";
    try {
      const params = {
        query: req.params.query + " -is:retweet lang:en" + " is:verified",
        max_results: "100",
        "tweet.fields": "created_at,entities,public_metrics",
      };
      const response = await getRequest(endpointUrl, params);

      const start = new Date("03/10/2021");
      let loop = new Date(start);

      const formatted_posts = {};

      response.data.forEach(async (post) => {
        let newDate = loop.setDate(loop.getDate() + 1);
        loop = new Date(newDate);
        formatted_posts[loop.toDateString()] = {
          sentiment: getSentiment(post.text),
          date: loop.toDateString(),
        };
      });

      res.send(formatted_posts);
    } catch (e) {
      console.log(e);
      res.sendStatus(400);
    }
  });

  /**
   * Updates information for all ids passed in
   * param: ids [list] - is a list of strings containing the tweet ids
   *
   */
  app.post("/v1/twitter/update_tweets", async (req, res) => {
    const endpointUrl = "https://api.twitter.com/2/tweets?ids=";
    let ids_string = "";
    req.body.forEach(async (id) => {
      ids_string += id + ",";
    });
    ids_string = ids_string.slice(0, -1);

    try {
      const params = {
        ids: ids_string, // Edit Tweet IDs to look up
        "tweet.fields": "created_at,entities,public_metrics", // Edit optional query parameters here
        "user.fields": "created_at", // Edit optional query parameters here
      };
      const response = await getRequest(endpointUrl, params);
      let filtered_response = [];
      response.data.forEach(async (post) => {
        filtered_response.push({
          text: post.text,
          id: post.id,
          created_at: post.created_at,
          retweet_count: post.public_metrics.retweet_count,
          reply_count: post.public_metrics.reply_count,
          like_count: post.public_metrics.like_count,
          quote_count: post.public_metrics.quote_count,
        });
      });
      res.send(filtered_response);
      // FIXME: CURRENTLY NOT UPLOADING TO THE DB.. NOT SURE HOW WE WANT TO HANDLE THIS
    } catch (e) {
      console.log(e);
      res.sendStatus(400);
    }
  });
};

async function getRequest(endpointUrl, params) {
  const res = await needle("get", endpointUrl, params, {
    headers: {
      "User-Agent": "v2RecentSearchJS",
      authorization: `Bearer ${token}`,
    },
  });
  if (res.body) {
    return res.body;
  } else {
    throw new Error("Unsuccessful request");
  }
}
