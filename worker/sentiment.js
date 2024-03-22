const fetch = require("node-fetch");

/*const data  = [{source:"twitter", text:"there are doubts about our finances"},
                              {source:'reddit', text: "there is a shortage of capital, and we need extra financing"},
                              {source:'news', text: 'growth is strong and we have plenty of liquidity'}];
                              */
const labelData = (cb, unlabeledData) => {
  fetch("http://localhost:5000/get_label", {
    method: "POST",
    body: JSON.stringify(unlabeledData),
    headers: {
      "Content-Type": "application/json",
    },
    cache: true,
  })
    .then((res) => res.json())
    .then((raw) => {
      cb(raw);
    });
};

//labelData(d => console.log(d), data);

const labelTwitter = (tweetcb) => {
  console.log("getting tweets");
  fetch("http://localhost:8000/v1/twitter/ticker/all")
    .then((res) => res.json())
    .then((tweetdata) => {
      for (let i = 0; i < tweetdata.length() - 100; i += 100) {
        tweetcb(tweetdata, sliceVal);
      }
    });
};

formatTwitter = (twitterData, sliceVal) => {
  labelData(
    (d) => console.log(d),
    twitterData
      .map((d) => {
        return { source: "twitter", text: d.text };
      })
      .slice(sliceVal, sliceVal + 100)
  );
};

labelTwitter(formatTwitter);
