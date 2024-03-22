"use strict";

const needle = require("needle");

const apiKey = ``;

const { getSentiment } = require("../../../shared");
module.exports = (app) => {
  /**
   * Fetches a news article
   */
  app.get(
    "/v1/news/everythingCustomized/:q/:qlnTitle/:sources/:domains/:excludeDomains/:from/:to/:language/:sortBy/:pageSize/:page",
    async (req, res) => {
      let endpointUrl = `https://newsapi.org/v2/everything?q=${req.params.q}&qlnTitle={req.&language=en&apiKey=${apiKey}`;
    }
  );

  app.get("/v1/news/everythingBasic/:q", async (req, res) => {
    let endpointUrl = `https://newsapi.org/v2/everything?q=${req.params.q}&language=en&apiKey=${apiKey}`;
    try {
      const response = await getRequest(endpointUrl);

      // console.log(req.params.q);

      let tickerReq = req.params.q;

      let formatted_posts = response.articles.map((post) => {
        //console.log(getSentiment(post.description));
        return {
          source: post.source.name,
          author: post.author,
          title: post.title,
          description: post.description,
          url: post.url,
          urlToImage: post.urlToImage,
          datePublished: post.publishedAt,
          content: post.content,
          sentiment: getSentiment(post.description),
        };
      });

      formatted_posts["ticker"] = tickerReq;

      formatted_posts.forEach(async (element) => {
        element["ticker"] = tickerReq;
      });

      formatted_posts.forEach(async (post) => {
        try {
          post = await new app.models.News(post);
          await post.save();
        } catch (err) {
          const message = err.details[0].message;
          console.log(`News.save failed: ${message}`);
          return res
            .status(404)
            .send({ error: `News post save failed: ${req.params.gameId}` });
        }
      });

      // save req

      res.status(200).send(Object.assign({}, formatted_posts));
      // res.send(response);
    } catch (e) {
      console.log(e);
    }
  });

  app.get("/v1/test/news/:q", async (req, res) => {
    let endpointUrl = `https://newsapi.org/v2/everything?q=${req.params.q}&language=en&apiKey=${apiKey}`;
    try {
      const response = await getRequest(endpointUrl);

      let tickerReq = req.params.q;

      const start = new Date("03/10/2021");
      let loop = new Date(start);

      const formatted_posts = {};

      response.articles.forEach((post) => {
        let newDate = loop.setDate(loop.getDate() + 1);
        loop = new Date(newDate);
        //console.log(getSentiment(post.description));
        formatted_posts[loop.toDateString()] = {
          sentiment: getSentiment(post.description),
          date: loop.toDateString(),
        };
      });

      // save req

      res.status(200).send(formatted_posts);
      // res.send(response);
    } catch (e) {
      console.log(e);
    }
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
