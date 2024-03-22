"use strict";

const fetch = require("node-fetch");
const Joi = require("@hapi/joi");
const { getSentiment } = require("../../../shared");
const Alpaca = require("@alpacahq/alpaca-trade-api");

module.exports = (app) => {
  /**
   * Fetches top posts for a subreddit
   */
  app.get("/v1/alpaca", async (req, res) => {
    try {
      const alpaca = new Alpaca({
        keyId: "",
        secretKey: "",
        paper: true,
        usePolygon: false,
      });

      const account = await alpaca.getAccount();
      console.log(account);
      const data = await raw.json();
      console.log(data);

      res.status(200).send(Object.assign({}, { borat: "Great Success" }));
    } catch (err) {
      console.log(err);
      return res.status(404).send({
        error: `Error placing an order`,
      });
    }
  });
};
