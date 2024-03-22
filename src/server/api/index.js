"use strict";

module.exports = (app) => {
  require("./v1/news")(app);
  require("./v1/twitter")(app);
  require("./v1/reddit")(app);
  require("./v1/stocks")(app);
  require("./v1/twilio")(app);
  //auth
  require("./v1/auth")(app);
  require("./v1/user")(app);
  require("./v1/session")(app);
  // test
  require("./v1/test")(app);
  // analysis
  require("./v1/analysis")(app);
  require("./v1/words")(app);
  //trading
  require("./v1/alpaca")(app);
};
