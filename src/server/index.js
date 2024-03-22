"use strict";

const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const session = require("express-session");
const envConfig = require("simple-env-config");

const env = process.env.NODE_ENV ? process.env.NODE_ENV : "dev";

/**********************************************************************************************************/

const setupServer = async () => {
  // Get the app config
  const conf = await envConfig("./config/config.json", env);
  const port = process.env.PORT ? process.env.PORT : conf.port;
  const mongourl = conf.mongodb;

  // Setup our Express pipeline
  let app = express();
  app.engine("pug", require("pug").__express);
  app.set("views", __dirname);
  app.use(express.static(path.join(__dirname, "../../public")));

  // Setup pipeline session support
  app.store = session({
    name: "session",
    secret: "grahamcardrules",
    resave: false,
    saveUninitialized: false,
    cookie: {
      path: "/",
    },
  });
  app.use(app.store);

  // Finish with the body parser
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Connect to MongoDB
  try {
    // Dont want to see MongooseJS deprecation warnings
    mongoose.set("useNewUrlParser", true);
    mongoose.set("useFindAndModify", false);
    mongoose.set("useCreateIndex", true);
    mongoose.set("useUnifiedTopology", true);
    // Connect to the DB server
    await mongoose.connect(mongourl);
    console.log(`MongoDB connected: ${mongourl}`);
  } catch (err) {
    console.log(err);
    process.exit(-1);
  }

  // Import our Data Models
  app.models = {
    Reddit: require("./models/reddit"),
    News: require("./models/news"),
    Twitter: require("./models/twitter"),
    User: require("./models/user"),
  };

  // Import our routes
  require("./api")(app);

  // Give them the SPA base page
  app.get("*", (req, res) => {
    res.render("base.pug");
  });

  // Run the server itself
  let server = app.listen(8000, () => {
    console.log(` Listening on: ${server.address().port}`);
  });
};

/**********************************************************************************************************/

// Run the server
setupServer();
