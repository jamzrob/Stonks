const aposToLexForm = require("apos-to-lex-form");
const SpellCorrector = require("spelling-corrector");
const SW = require("stopword");
var Sentiment = require("sentiment");
var sentiment = new Sentiment();

const spellCorrector = new SpellCorrector();

const getSentiment = (text) => {
  // convert apostrophe=connecting words to lex form
  const lexedReview = aposToLexForm(text);

  // all to lower case
  const casedReview = lexedReview.toLowerCase();

  // removing nonalphabetical characters
  const alphaOnlyReview = casedReview.replace(/[^a-zA-Z\s]+/g, "");

  var Sentiment = require("sentiment");
  var sentiment = new Sentiment();
  return sentiment.analyze(text).score;
};

const validPassword = (password) => {
  if (!password || password.length < 8) {
    return { error: "Password length must be > 7" };
  } else if (!password.match(/[0-9]/i)) {
    return { error: "Password must contain a number" };
  } else if (!password.match(/[a-z]/)) {
    return { error: "Password must contain a lowercase letter" };
  } else if (!password.match(/\@|\!|\#|\$|\%|\^/i)) {
    return { error: "Password must contain @, !, #, $, % or ^" };
  } else if (!password.match(/[A-Z]/)) {
    return { error: "Password must contain an uppercase letter" };
  }
  return undefined;
};

const validUsername = (username) => {
  if (!username || username.length <= 2 || username.length >= 16) {
    return { error: "Username length must be > 2 and < 16" };
  } else if (!username.match(/^[a-z0-9]+$/i)) {
    return { error: "Username must be alphanumeric" };
  }
  return undefined;
};

module.exports = { getSentiment, validPassword, validUsername };
