"use strict";

const crypto = require("crypto");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/***************** User Model *******************/

const makeSalt = () => Math.round(new Date().valueOf() * Math.random()) + "";

const encryptPassword = (salt, password) =>
  crypto.createHmac("sha512", salt).update(password).digest("hex");

const reservedNames = ["password"];

let User = new Schema({
  username: { type: String, required: true, index: { unique: true } },
  primary_email: { type: String, index: { unique: true } },
  first_name: { type: String, default: "" },
  last_name: { type: String, default: "" },
  phone_number: {type: String, default: ""},
  city: { type: String, default: "" },
  hash: { type: String },
  salt: { type: String },
  token: { type: String },
  stocks: [{ type: String }],
});

User.path("username").validate(function (value) {
  if (!value) return false;
  if (reservedNames.indexOf(value) !== -1) return false;
  return (
    value.length > 5 && value.length <= 16 && /^[a-zA-Z0-9]+$/i.test(value)
  );
}, "invalid username");

User.virtual("password").set(function (password) {
  this.salt = makeSalt();
  this.hash = encryptPassword(this.salt, password);
});

User.method("authenticate", function (plainText) {
  return encryptPassword(this.salt, plainText) === this.hash;
});

User.pre("save", function (next) {
  // Sanitize strings
  this.username = this.username.toLowerCase();
  this.primary_email = this.primary_email
    ? this.primary_email.toLowerCase()
    : "";
  this.first_name = this.first_name
    ? this.first_name.replace(/<(?:.|\n)*?>/gm, "")
    : "";
  this.last_name = this.last_name
    ? this.last_name.replace(/<(?:.|\n)*?>/gm, "")
    : "";
  this.stocks = this.stocks.map((stock) => stock.replace(/<(?:.|\n)*?>/gm, ""));
  next();
});

module.exports = mongoose.model("User", User);
