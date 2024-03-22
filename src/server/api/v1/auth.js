/* Copyright G. Hemingway, 2020 - All rights reserved */
"use strict";

const request = require("request");

const ghConfig = {
  client_id: "",
  client_secret: "",
  scope: "",
};

module.exports = (app) => {
  const checkState = (goodState, state) => {
    return new Promise((resolve, reject) => {
      if (goodState !== state) {
        reject({
          error:
            "Invalid state - Log out and in again before linking with Github.",
        });
      } else resolve();
    });
  };

  const checkCode = (code) => {
    return new Promise((resolve, reject) => {
      request.post(
        {
          url: `https://github.com/login/oauth/access_token`,
          headers: {
            "User-Agent": "request",
            Accept: "application/json",
          },
          formData: {
            client_id: ghConfig.client_id,
            client_secret: ghConfig.client_secret,
            code: code,
          },
        },
        (err, res, body) => {
          if (err) reject(err);
          if (body.error) reject(body);
          else resolve(JSON.parse(body));
        }
      );
    });
  };

  const checkGithubInfo = (accessToken) => {
    return new Promise((resolve, reject) => {
      request.get(
        {
          url: "https://api.github.com/user",
          headers: {
            "User-Agent": "request",
            Authorization: `token ${accessToken}`,
          },
        },
        (err, res, body) => {
          if (err) reject(err);
          else resolve(JSON.parse(body));
        }
      );
    });
  };

  // Any attempt to login redirects to Github SSO auth
  app.get("/github/login", async (req, res) => {
    // Redirect to Github login with client_id, state and scope
    req.session.state = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, "")
      .substr(0, 10);
    const ghPath =
      `https://github.com/login/oauth/authorize?` +
      `scope=${ghConfig.scope}&` +
      `client_id=${ghConfig.client_id}&` +
      `state=${req.session.state}`;
    console.log(`Sending users to: ${ghPath}`);
    res.redirect(ghPath);
  });

  app.get("/auth/github", async (req, res) => {
    // Must have a temp code from GH
    if (!req.query.code)
      return res.status(400).send({ error: "Code field required" });
    // Must have state token too
    if (!req.query.state)
      return res.status(400).send({ error: "State field required" });
    // Validate state
    try {
      // Is this a valid GH response
      await checkState(req.session.state, req.query.state);
      // Convert code to token and scope
      const { access_token } = await checkCode(req.query.code);
      // Get GH username
      const { login } = await checkGithubInfo(access_token);
      console.log(`Fetched Github UserId: ${login}`);

      const info = await getGithubInfo(login, access_token);

      const gitHubUser = {
        username: info.login,
        primary_email: info.email,
      };
      if (info.name) {
        const names = info.name.split(" ");

        gitHubUser["first_name"] = names[0];
        gitHubUser["last_name"] = names[0];
      }

      let user = await app.models.User.findOne({
        username: gitHubUser.username,
      });

      if (user) {
        req.session.user = user;
        res.redirect(`/profile/${user.username}`);
      } else {
        //create user
        try {
          let user = new app.models.User(gitHubUser);
          await user.save();
          req.session.user = user;
          res.redirect(`/profile/${user.username}`);
        } catch (error) {
          console.log(error);
          res.status(400).send({ error: error });
        }
      }
    } catch (err) {
      console.log(err);
      // Send user to error page explaining what happened
      res.status(400).send(err);
    }
  });

  const getGithubInfo = (username, accessToken) => {
    return new Promise((resolve, reject) => {
      const url = `https://api.github.com/users/${username}`;
      console.log(url);
      request.get(
        {
          url: url,
          headers: {
            "User-Agent": "request",
            Authorization: `token ${accessToken}`,
          },
        },
        (err, res, body) => {
          if (err) reject(err);
          else resolve(JSON.parse(body));
        }
      );
    });
  };
};
