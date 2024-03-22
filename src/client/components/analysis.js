import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import qs from "qs";

export const Plot = ({ data, words, wordMatch }) => {
  const d3Container = useRef(null);

  const asset = "high";
  /* The useEffect Hook is for running side effects outside of React,
       for instance inserting elements into the DOM using D3 */
  useEffect(() => {
    if (Object.keys(data).length && d3Container.current) {
      // sorting data
      const dates = Object.values(data).map((d) => d.stock.date);
      const stock_values = ["open", "high", "low", "close", "volume"];
      const prices = Object.values(data).map((d) => [
        d.stock["date"],
        d.stock[asset],
      ]);
      const price_min = d3.min(prices, (d) => d[1]);
      const price_max = d3.max(prices, (d) => d[1]);
      const price_exts = [price_min, price_max];
      const news = Object.values(data)
        .map((d) => d.news)
        .filter((d) => d !== undefined);
      const news_exts = d3.extent(news, (d) => d.sentiment);
      const tweets = Object.values(data).map((d) => d.tweets);
      const tweet_exts = d3.extent(tweets, (d) => d.sentiment);
      const reddit = Object.values(data).map((d) => d.reddit);
      const reddit_exts = d3.extent(reddit, (d) => d.sentiment);
      const wordValues = Object.keys(words);
      const wordSentimentValues = Object.values(words).map((x) => Math.abs(x));
      const sortedWords = Object.keys(words).sort(function (a, b) {
        return Math.abs(words[b]) - Math.abs(words[a]);
      });

      const combine_exts = [
        Math.min(news_exts[0], reddit_exts[0], tweet_exts[0]),
        Math.max(news_exts[1], reddit_exts[1], tweet_exts[1]),
      ];

      const word_ext = d3.extent(wordSentimentValues);

      const combine_scale = d3
        .scaleLinear()
        .domain(combine_exts)
        .range([plot_height, 0]);

      const date_scale = d3.scaleBand().domain(dates).range([plot_width, 0]);

      const word_band_scale = d3
        .scaleBand()
        .domain(sortedWords)
        .range([0, bar_graph_height]);

      const word_scale = d3
        .scaleLinear()
        .domain(word_ext)
        .range([10, bar_graph_width]);

      // was scaling it compared to individually sentiment before, but makes more sense to have on same scale
      const price_scale = d3
        .scaleLinear()
        .domain(price_exts)
        .range([plot_height, 0]);
      const tweet_scale = d3
        .scaleLinear()
        .domain(tweet_exts)
        .range([plot_height, 0]);
      const reddit_scale = d3
        .scaleLinear()
        .domain(reddit_exts)
        .range([plot_height, 0]);
      const news_scale = d3
        .scaleLinear()
        .domain(news_exts)
        .range([plot_height, 0]);
      const dateOffset = date_scale(dates[dates.length - 2]) / 2 + 10;

      const svg = d3.select(d3Container.current);

      // Bind D3 data

      let central_plot = svg
        .append("g")
        .attr("transform", `translate(${margin},${margin})`);
      let line_plot = central_plot.append("g");
      let tweet_plot = central_plot.append("g");
      let reddit_plot = central_plot.append("g");
      let news_plot = central_plot.append("g");
      let grid_plot = central_plot.append("g");
      let grid_tweet_plot = central_plot.append("g");
      let grid_reddit_plot = central_plot.append("g");
      let grid_news_plot = central_plot.append("g");
      let bar_graph = central_plot
        .append("g")
        .attr("transform", `translate(${plot_width + margin / 4}, 0)`);

      // word sentiment layout
      bar_graph
        .append("rect")
        .attr("width", bar_graph_width)
        .attr("height", bar_graph_height)
        .attr("fill", "none")
        .attr("stroke", d3.hcl(0, 0, 30))
        .attr("stroke-width", 0.8);

      bar_graph
        .append("g")
        .classed("axis y", true)
        .attr("transform", `translate(${bar_graph_width},0)`)
        .call(d3.axisRight(word_band_scale))
        .call(axis_tweak, true)
        .selectAll("text")
        .style("text-anchor", "start");

      bar_graph
        .selectAll("empty")
        .data(sortedWords)
        .enter()
        .append("rect")
        .classed("bar", true)
        .attr("x", 0)
        .attr("y", (d) => word_band_scale(d))
        .attr("width", (d) => word_scale(Math.abs(words[d])))
        .attr("height", word_band_scale.bandwidth())
        .attr("fill", (d) => d3.schemeSet1[words[d] > 0 ? 2 : 0])
        .attr("stroke", d3.color("grey"))
        .on("mouseover", function (d, i) {
          let redditPicked = [];
          if (wordMatch[i]) {
            wordMatch[i].reddit.forEach((x) => {
              const temp = reddit.filter((i) => {
                return new Date(i.date).getTime() === new Date(x).getTime();
              });
              redditPicked = redditPicked.concat(temp);
            });
          }

          let twitterPicked = [];
          if (wordMatch[i]) {
            wordMatch[i].twitter.forEach((x) => {
              const temp = tweets.filter((i) => {
                return new Date(i.date).getTime() === new Date(x).getTime();
              });
              twitterPicked = twitterPicked.concat(temp);
            });
          }
          console.log(twitterPicked);

          let newsPicked = [];
          if (wordMatch[i]) {
            wordMatch[i].news.forEach((x) => {
              const temp = news.filter((i) => {
                return new Date(i.date).getTime() === new Date(x).getTime();
              });
              newsPicked = newsPicked.concat(temp);
            });
            const totalCircles = twitterPicked.concat(
              redditPicked.concat(newsPicked)
            );
          }

          const totalCircles = redditPicked.concat(
            twitterPicked.concat(newsPicked)
          );

          tweet_plot
            .selectAll("g")
            .data(totalCircles)
            .enter()
            .append("circle")
            .attr("cx", (d) => date_scale(d.date))
            .attr("cy", (d) => combine_scale(d.sentiment))
            .attr("r", 3)
            .attr("fill-opacity", 0.5)
            .attr("fill", "black")
            .attr("stroke", "black")
            .attr("id", `highlight`);
        })
        .on("mouseout", function (d, i) {
          d3.selectAll("#highlight").remove();
        });

      // plot layout

      line_plot
        .append("rect")
        .attr("width", plot_width)
        .attr("height", plot_height)
        .attr("fill", "none")
        .attr("stroke", d3.hcl(0, 0, 30))
        .attr("stroke-width", 0.8);

      const circleOut = () => {
        d3.selectAll("#sentimentlabel").remove();
        d3.selectAll("#rectsentimentlabel").remove();
      };
      reddit_plot
        .selectAll("circle")
        .data(reddit)
        .enter()
        .append("circle")
        .attr("cx", (d) => date_scale(d.date))
        .attr("cy", (d) => combine_scale(d.sentiment))
        .attr("r", 3)
        .attr("fill-opacity", 0.5)
        .attr("fill", "#FF4500")
        .attr("stroke", "#FF4500")
        .attr("id", (d) => `reddit${d.date}`)
        .on("mouseover", function (d, i) {
          central_plot
            .append("text")
            .attr("id", "sentimentlabel")
            .text(Math.round(i.sentiment * 100) / 100)
            .attr("x", date_scale(i.date) + 10)
            .attr("y", combine_scale(i.sentiment) + 20);

          central_plot
            .append("rect")
            .attr("id", "rectsentimentlabel")
            .attr("x", date_scale(i.date))
            .attr("y", combine_scale(i.sentiment))
            .attr("width", 40)
            .attr("height", 30)
            .attr("style", "outline: thin solid grey;")
            .style("fill", "none");
        })
        .on("mouseout", function (d, i) {
          circleOut();
        });

      news_plot
        .selectAll("circle")
        .data(news)
        .enter()
        .append("circle")
        .attr("cx", (d) => date_scale(d.date))
        .attr("cy", (d) => combine_scale(d.sentiment))
        .attr("r", 3)
        .attr("fill-opacity", 0.5)
        .attr("fill", d3.color("#E8B828"))
        .attr("stroke", d3.color("#E8B828"))
        .attr("id", (d) => `news${d.date}`)
        .on("mouseover", function (d, i) {
          central_plot
            .append("text")
            .attr("id", "sentimentlabel")
            .text(Math.round(i.sentiment * 100) / 100)
            .attr("x", date_scale(i.date) + 10)
            .attr("y", combine_scale(i.sentiment) + 20);

          central_plot
            .append("rect")
            .attr("id", "rectsentimentlabel")
            .attr("x", date_scale(i.date))
            .attr("y", combine_scale(i.sentiment))
            .attr("width", 40)
            .attr("height", 30)
            .attr("style", "outline: thin solid grey;")
            .style("fill", "none");
        })
        .on("mouseout", function (d, i) {
          circleOut();
        });

      tweet_plot
        .selectAll("circle")
        .data(tweets)
        .enter()
        .append("circle")
        .attr("cx", (d) => date_scale(d.date))
        .attr("cy", (d) => combine_scale(d.sentiment))
        .attr("r", 3)
        .attr("fill-opacity", 0.5)
        .attr("stroke", d3.color("blue"))
        .on("mouseover", function (d, i) {
          central_plot
            .append("text")
            .attr("id", "sentimentlabel")
            .text(Math.round(i.sentiment * 100) / 100)
            .attr("x", date_scale(i.date) + 10)
            .attr("y", combine_scale(i.sentiment) + 20);

          central_plot
            .append("rect")
            .attr("id", "rectsentimentlabel")
            .attr("x", date_scale(i.date))
            .attr("y", combine_scale(i.sentiment))
            .attr("width", 40)
            .attr("height", 30)
            .attr("style", "outline: thin solid grey;")
            .style("fill", "none");
        })
        .on("mouseout", function (d, i) {
          circleOut();
        });

      line_plot
        .append("path")
        .datum(prices)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr(
          "d",
          d3
            .line()
            .x((d) => date_scale(d[0]))
            .y((d) => price_scale(d[1]))
        );

      line_plot
        .append("g")
        .lower()
        .classed("axis x", true)
        .attr("transform", `translate(-${dateOffset},${plot_height})`)
        .call(d3.axisTop(date_scale))
        .call(axis_tweak, true)
        .selectAll("text")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start")
        .attr("tickFormat", "");

      line_plot
        .append("g")
        .lower()
        .classed("axis y", true)
        .call(d3.axisLeft(price_scale))
        .call(axis_tweak);

      grid_reddit_plot
        .selectAll("line")
        .data(reddit)
        .enter()
        .append("line")
        .attr("class", "grid-lines")
        .attr("x1", (d) => date_scale(d.date))
        .attr("x2", (d) => date_scale(d.date))
        .attr("y1", (d) => price_scale(data[d.date].stock[asset]))
        .attr("y2", (d) => combine_scale(d.sentiment))
        .attr("stroke-opacity", 0.2)
        .attr("stroke", "#FF4500");

      grid_news_plot
        .selectAll("line")
        .data(news)
        .enter()
        .append("line")
        .attr("class", "grid-lines")
        .attr("x1", (d) => date_scale(d.date))
        .attr("x2", (d) => date_scale(d.date))
        .attr("y1", (d) => price_scale(data[d.date].stock[asset]))
        .attr("y2", (d) => combine_scale(d.sentiment))
        .attr("stroke-opacity", 0.2)
        .attr("stroke", "#E8B828");

      grid_tweet_plot
        .selectAll("line")
        .data(tweets)
        .enter()
        .append("line")
        .attr("class", "grid-lines")
        .attr("x1", (d) => date_scale(d.date))
        .attr("x2", (d) => date_scale(d.date))
        .attr("y1", (d) => price_scale(data[d.date].stock[asset]))
        .attr("y2", (d) => combine_scale(d.sentiment))
        .attr("stroke-opacity", 0.2)
        .attr("stroke", d3.color("blue"));

      grid_plot
        .selectAll("line")
        .data(prices)
        .enter()
        .append("line")
        .attr("class", "grid-lines")
        .attr("x1", (d) => date_scale(d[0]))
        .attr("x2", (d) => date_scale(d[0]))
        .attr("y1", 0)
        .attr("y2", plot_height)
        .attr("stroke-opacity", 0.2)
        .attr("stroke", d3.color("grey"));
    }
  }, [data, d3Container.current]);

  return (
    <svg
      className="d3-component"
      width={plot_size}
      height={total_height}
      ref={d3Container}
    />
  );
};

/* App */
export const Analysis = ({ match, location }) => {
  const [data, setData] = useState({});
  const [words, setWords] = useState({});
  const [wordMatch, setWordMatch] = useState({});
  useEffect(() => {
    const getData = () => {
      const stock = match.params.stock;
      const query = qs.parse(location.search.substring(1));
      const start = query.start;
      const end = query.end;

      fetch(`/v1/analysis/${stock}?start=${start}&end=${end}`)
        .then((res) => res.json())
        .then((data) => {
          setData(data);
        })
        .catch((e) => console.log(e));

      fetch(`/v1/words/${stock}?start=${start}&end=${end}`)
        .then((res) => res.json())
        .then((data) => {
          const tempWords = Object.keys(data)
            .sort((a, b) => data[a] - data[b])
            .reduce(
              (_sortedObj, key) => ({
                ..._sortedObj,
                [key]: data[key],
              }),
              {}
            );
          getWordData(tempWords, stock, query, start, end);
          setWords(tempWords);
        })
        .catch((e) => console.log(e));
    };

    const getWordData = (wordList, stock, query, start, end) => {
      console.log(wordList);
      const formatWordList = JSON.stringify({ words: wordList });

      fetch(`/v1/words/match/${stock}?start=${start}&end=${end}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: formatWordList,
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          setWordMatch(data);
        })
        .catch((e) => console.log(e));
    };

    getData();

    // make call to get data here
  }, [match.params.stock, location.search]);

  return (
    <div>
      <Plot data={data} words={words} wordMatch={wordMatch} />
    </div>
  );
};

// Scales

// Layout parameters
const margin = 80;
const plot_size = 1200;
const plot_width = 700;
const plot_height = 400;
const bar_graph_height = plot_height + margin;
const bar_graph_width = 200;
const total_height = 600;

// Misc

const create_color_axis = (
  g,
  domain,
  range,
  offset,
  legend_height,
  color_access
) => {
  let spatial_scale = d3.scaleLinear().domain(domain).range(range).nice();
  let the_axis = d3.axisBottom(spatial_scale).ticks(5);
  let proper_offset = offset + legend_height;

  let legend_axis = g
    .append("g")
    .attr("transform", "translate(0," + proper_offset + ")")
    .call(the_axis);
  legend_axis
    .selectAll(".tick")
    .select("line")
    .style("stroke", d3.hcl(0, 0, 52));
  legend_axis.selectAll(".tick").select("text").style("fill", d3.hcl(0, 0, 52));
  let n_ticks = 0;
  legend_axis.selectAll(".tick").each((_) => {
    n_ticks += 1;
  });
  legend_axis.select(".domain").remove();

  let tick_values = [];
  legend_axis.selectAll(".tick").each((d) => {
    tick_values.push(d);
  });
  g.append("defs")
    .append("linearGradient")
    .attr("id", "cm")
    .selectAll("stop")
    .data(tick_values)
    .enter()
    .append("stop")
    .attr("offset", (_, i) => (100 * i) / (tick_values.length - 1) + "%")
    .attr("stop-color", (d) => color_access(d));
  g.append("rect")
    .attr("x", range[0] - 1)
    .attr("width", range[1] - range[0] + 2)
    .attr("y", offset)
    .attr("height", legend_height)
    .style("fill", "url(#cm)");
};

const axis_tweak = (axis_g, remove_span) => {
  if (remove_span) axis_g.selectAll("path").remove();
  else axis_g.selectAll("path").attr("stroke", d3.hcl(0, 0, 70));
  axis_g.selectAll(".tick").selectAll("line").attr("stroke", d3.hcl(0, 0, 45));
  axis_g.selectAll(".tick").selectAll("text").attr("fill", d3.hcl(0, 0, 45));
};
