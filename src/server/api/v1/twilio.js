// "use strict";
// var twilio = require('twilio');

var accountSid = ""; // Your Account SID from www.twilio.com/console
var authToken = ""; // Your Auth Token from www.twilio.com/console

module.exports = (app) => {
  /**
   * send a text via twilio
   * @param to: the number you wand to send a text to "1234567890"
   * @param message: the message you want to send
   */
  app.post("/v1/twilio/text", async (req, res) => {
    var twilio = require("twilio");
    var client = new twilio(accountSid, authToken);
    client.messages
      .create({
        body: req.body.message,
        to: req.body.to, // Text this number
        from: "+12054967373", // From a valid Twilio number HARD CODED
      })
      .then((message) => res.status(200).send({}))
      .catch((e) => res.status(400).send({ error: err }));
  });
};
