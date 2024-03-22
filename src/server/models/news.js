"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/***************** Reddit Model *******************/

/* Schema for an individual move of Klondike */
let News = new Schema({
  source: { type: String },
  author: { type: String },
  title: { type: String },
  description: { type: String },
  url: { type: String },
  urlToImage: { type: String },
  datePublished: { type: Date },
  content: { type: String },
  sentiment: { type: Number, default: 0 },
  ticker: {type: String}, 
});

News.pre("validate", function (next) {
  this.ticker = this.ticker ? this.ticker.replace(/<(?:.|\n)*?>/gm, "") : "";
  this.source = this.source ? this.source.replace(/<(?:.|\n)*?>/gm, "") : "";
  this.author = this.author ? this.author.replace(/<(?:.|\n)*?>/gm, "") : "";
  this.title = this.title ? this.title.replace(/<(?:.|\n)*?>/gm, "") : "";
  this.description = this.description
    ? this.description.replace(/<(?:.|\n)*?>/gm, "")
    : "";
  this.url = this.url ? this.url.replace(/<(?:.|\n)*?>/gm, "") : "";
  this.urlToImage = this.urlToImage
    ? this.urlToImage.replace(/<(?:.|\n)*?>/gm, "")
    : "";
  this.content = this.content ? this.content.replace(/<(?:.|\n)*?>/gm, "") : "";
  next();
});

module.exports = mongoose.model("News", News);
