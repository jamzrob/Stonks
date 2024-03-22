"use strict";

const e = require("express");
const needle = require("needle");
var unirest = require("unirest");

const apiKey = ``;

module.exports = (app) => {
  /**
   * Fetches a tweet
   */
  app.get("/v1/stocks/fundamentaldata/:function/:symbol", async (req, res) => {
    let endpointUrl = `https://www.alphavantage.co/query?function=${req.params.function}&symbol=${req.params.symbol}&apikey=${apiKey}`;

    try {
      const response = await getRequest(endpointUrl);
      res.send(response);
    } catch (e) {
      console.log(e);
    }
  });

  app.get("/v1/yahoo/:symbol", (req, res) => {
    var req1 = unirest("GET", "https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-chart");

    req1.query({
      "interval": "5m",
      "symbol": `${req.params.symbol}`,
      "range": "1d",
      "region": "US"
    });
    
    req1.headers({
      "x-rapidapi-key": "5ec46429c2mshdbc3ba9bedec55ep1e8f5fjsnb87bf00857e1",
      "x-rapidapi-host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
      "useQueryString": true
    });
    
    
    req1.end(function (response) {
      if (response.error) {
        res.sendStatus(400)
        return;
      }
      try {
        res.send({"price" : response.body.chart.result[0].meta.regularMarketPrice})
      } catch (e) {
        res.sendStatus(400)
      }
    });
  });

  app.get(
    "/v1/stocks/stocktimeseries/:symbol/start/:startdate/end/:enddate",
    async (req, res) => {
      let endpointUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${req.params.symbol}&apikey=${apiKey}`;

      try {
        const response = await getRequest(endpointUrl);

        const data = await dataManipulationTest(
          response,
          req.params.startdate * 1000,
          req.params.enddate * 1000
        );

        res.send(data);
      } catch (e) {
        console.log(e);
      }
    }
  );
};

async function getRequest(endpointUrl) {
  const res = await needle("get", endpointUrl);
  if (res.body) {
    return res.body;
  } else {
    throw new Error("Unsuccessful request");
  }
}

async function dataManipulationTest(stockData, start, end) {
  let parsedObject = stockData["Time Series (Daily)"];
  var stockDataArray = {};

  for (var outerKey in parsedObject) {
    const formattedDate = outerKey.split("-");
    const date = new Date(
      formattedDate[0],
      formattedDate[1] - 1,
      formattedDate[2]
    );
    const timestamp = new Date(date).getTime();

    if (start <= timestamp && timestamp <= end) {
      const obj = {
        date: date.toDateString(),
        open: parsedObject[outerKey]["1. open"],
        high: parsedObject[outerKey]["2. high"],
        low: parsedObject[outerKey]["3. low"],
        close: parsedObject[outerKey]["4. close"],
        volume: parsedObject[outerKey]["5. volume"],
      };
      stockDataArray[date.toDateString()] = obj;
    }
  }
  return stockDataArray;
}
