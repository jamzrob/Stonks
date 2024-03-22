const { Queue, Worker, QueueEvents, QueueScheduler } = require("bullmq");
const myQueueScheduler = new QueueScheduler("Posts");
const queue = new Queue("Posts");
const fetch = require("node-fetch");
const envConfig = require("simple-env-config");
const user = require("../src/server/api/v1/user");

const hourInSeconds = 3600000;

const fiveSeconds = 5000;

const addToQueue = async (ticker) => {
  queue.add(
    `twitter ${ticker}`,
    { ticker },
    {
      repeat: {
        every: hourInSeconds,
      },
    }
  );
  queue.add(
    `reddit ${ticker}`,
    { ticker },
    {
      repeat: {
        every: hourInSeconds,
      },
    }
  );

  queue.add(
    `news ${ticker}`,
    { ticker },
    {
      repeat: {
        every: hourInSeconds,
      },
    }
  );

  queue.add(
    `user`,
    { ticker },
    {
      repeat: {
        every: fiveSeconds,
      },
    }
  );
};

const worker = new Worker("Posts", async (job) => {
  const date = new Date(Date.now());
  if (job.name.includes("twitter")) {
    fetch(`http://localhost:8000/v1/twitter/${job.data.ticker}`)
      .then((res) => res.json())
      .then((json) => job.updateProgress("SUCCESS: " + job.name + " " + date))
      .catch((error) => job.updateProgress("FAIL: " + job.name + " " + date));
  } else if (job.name.includes("reddit")) {
    fetch(
      `http://localhost:8000/v1/reddit/wallstreetbets/search/${job.data.ticker}`
    )
      .then((res) => res.json())
      .then((json) => job.updateProgress("SUCCESS: " + job.name + " " + date))
      .catch((error) => job.updateProgress("FAIL: " + job.name + " " + date));
  } else if (job.name.includes("news")) {
    fetch(`http://localhost:8000/v1/news/everythingBasic/${job.data.ticker}`)
      .then((res) => res.json())
      .then((json) => job.updateProgress("SUCCESS: " + job.name + " " + date))
      .catch((error) => job.updateProgress("FAIL: " + job.name + " " + date));
  } else {
    fetch(`http://localhost:8000/v1/users/all`)
      .then((res) => res.json())
      .then((json) => {
        job.updateProgress(json);
        json.user.forEach((u) => {
          u.stocks.forEach((s) => {
            job.updateProgress("UPDATE: " + s + " FOR " + u.username);
          });
        });
      });
  }
});

const queueEvents = new QueueEvents("Posts");

queueEvents.on("completed", (data) => {});

queueEvents.on("progress", (progress, job) => {
  // Do something with the return value.
  console.log(progress.data);
});

queueEvents.on("failed", (err, jobId) => {
  console.error("error getting posts", jobId, err);
});

const stocks = ["tsla", "gme", "pfe", "khc", "mj", "amzn", "aapl"];
const stopSchedule = async () => await myQueueScheduler.close();
for (s of stocks) {
  addToQueue(s);
}

module.exports = { addToQueue };
