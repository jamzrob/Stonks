"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/***************** Reddit Model *******************/

/* Schema for an individual move of Klondike */
let Twitter = new Schema({
  text: { type: String },
  id: { type: Number },
  created_at: { type: Date },
  retweet_count: { type: Number },
  reply_count: { type: Number },
  like_count: { type: Number },
  quote_count: { type: Number },
  sentiment: { type: Number, default: 0 },
  ticker: {type: String},
});

Twitter.pre("validate", function (next) {
  this.sticker = this.sticker ? this.sticker.replace(/<(?:.|\n)*?>/gm, "") : "";
  this.text = this.text ? this.text.replace(/<(?:.|\n)*?>/gm, "") : "";
  next();
});

module.exports = mongoose.model("Twitter", Twitter);
