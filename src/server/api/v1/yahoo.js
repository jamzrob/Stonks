"use strict";

const needle = require("needle");

const apiKey = '';

async function getRequest(endpointUrl) {
    const res = await needle("get", endpointUrl);
    if (res.body) {
      return res.body;
    } else {
      throw new Error("Unsuccessful request");
    }
  }

  app.get("/v1/yahoo/:symbol", async (req, res) => {
    console.log("hi")
    let endpointUrl = `https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-profile`;
    try {
      const response = await getRequest(endpointUrl);
      res.send(response);
    } catch (e) {
      console.log(e);
    }
  });


// var req = unirest("GET", "https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-profile");

// req.query({
// 	"symbol": "AMRN",
// 	"region": "US"
// });

// req.headers({
// 	"x-rapidapi-key": "5ec46429c2mshdbc3ba9bedec55ep1e8f5fjsnb87bf00857e1",
// 	"x-rapidapi-host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
// 	"useQueryString": true
// });


// req.end(function (res) {
// 	if (res.error) throw new Error(res.error);

// 	console.log(res.body);
// });
