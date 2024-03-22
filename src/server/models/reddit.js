b"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/***************** Reddit Model *******************/

/* Schema for an individual move of Klondike */
let Reddit = new Schema({
  title: { type: String },
  body: { type: String },
  ups: { type: Number, default: 1 },
  upvote_ratio: { type: Number, default: 1 },
  total_awards_received: { type: Number, default: 1 },
  created: { type: Date },
  author: { type: String },
  url: { type: String },
  score: { type: Number, default: 0 },
  sentiment: { type: Number, default: 0 },
  ticker: {type: String},
});

Reddit.pre("validate", function (next) {
  this.sticker = this.sticker ? this.sticker.replace(/<(?:.|\n)*?>/gm, "") : "";
  this.title = this.title ? this.title.replace(/<(?:.|\n)*?>/gm, "") : "";
  this.body = this.body ? this.body.replace(/<(?:.|\n)*?>/gm, "") : "";
  this.url = this.url ? this.url.replace(/<(?:.|\n)*?>/gm, "") : "";
  this.author = this.author ? this.author.replace(/<(?:.|\n)*?>/gm, "") : "";
  next();
});

module.exports = mongoose.model("Reddit", Reddit);
