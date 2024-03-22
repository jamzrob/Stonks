"use strict";

import styled from "styled-components";
import React, { useState, useEffect } from "react";
import { FiTwitter } from "react-icons/fi";
import { FcReddit } from "react-icons/fc";
import { ErrorMessage, ModalNotify } from "./shared";
import { TickerSymbols } from "./stocktickers";
const lightGreen = "#8FBC8F";
const lightRed = "#F08080";

const SearchBase = styled.div`
  grid-area: main;
  display: grid;
  grid-template-columns: auto;
  grid-template-rows: auto;
  grid-template-areas: "search" "left" "middle" "right";
  padding: 10em;
  font-size: 10px;

  @media (min-width: 500px) {
    grid-template-columns: 4fr 4fr 4fr;
    grid-template-rows: auto auto auto;
    grid-template-areas:
      "search submit submit"
      "left middle right";
    padding: 2em;
  }
`;

const LeftColumn = styled.div`
  margin-right: 10px;
  justify-content: center;
  grid-area: left;
  overflow: hidden;
  white-space: nowrap;
`;

const NewsImage = styled.img`
  height: 50px;
  width: 50px;
`;

const MiddleColumn = styled.div`
  margin-right: 10px;
  justify-content: center;
  grid-area: middle;
  overflow: hidden;
  white-space: nowrap;
`;

const RightColumn = styled.div`
  justify-content: center;
  grid-area: right;
`;

export const FormBase = styled.form`
  padding: 0.1em;
  justify-content: center;
`;

export const FormInput = styled.input`
  margin: 0.5em 0;
  justify-content: center;
  padding-left: 5px;
  grid-area: field;
  display-area: search;
`;

export const FormButton = styled.button`
  max-height: 2em;
  justify-content: center;
  background: #6495ed;
  grid-area: submit;
`;

// copied from twitter
const Tweet = styled.div`
  display: inline-block;
  font-family: "Helvetica Neue", Roboto, "Segoe UI", Calibri, sans-serif;
  font-size: 12px;
  font-weight: bold;
  line-height: 16px;
  border-color: #eee #ddd #bbb;
  border-radius: 5px;
  border-style: solid;
  border-width: 1px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  margin: 10px 5px;
  padding: 0 16px 16px 16px;
  max-width: 468px;
`;

// copied from reddit wsb
const Reddit = styled.div`
  position: relative;
  font-family: Univers, Calibri, "Helvetica Neue", Helvetica, Arial, sans-serif;
`;

const RedditTitle = styled.div`
  font-family: Univers, Calibri, "Helvetica Neue", Helvetica, Arial, sans-serif;
  top: 30px;
  left: 380px;
  font-size: 14px;
  line-height: 30px;
  height: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 2px rgba(255, 255, 255, 0.4);
  border: solid 1px ##1976d2;
  padding: 0px 20px 0px 0px;
  border-radius: 2px;
  border: 1px solid #55599b;
`;

export const Search = () => {
  const [search, setSearch] = useState("");
  const [reddit, setReddit] = useState({});
  const [tweets, setTweets] = useState({});
  const [news, setNews] = useState({});
  const [notify, setNotify] = useState("");
  const [error, setError] = useState("");

  const onChange = (ev) => {
    let upperCase = ev.target.value.toUpperCase();
    setSearch(upperCase);
  };

  const toInputUppercase = e => {
    e.target.value = ("" + e.target.value).toUpperCase();
  };
  

  const onSubmit = async (ev) => {
    ev.preventDefault();
    console.log(search);
    let found = false;
    TickerSymbols.forEach(async (stock) => {
      if (stock.symbol == search || stock.name.toLowerCase().includes(search)) {
        found = true;
      }
    });
    console.log(found);

    if (!found) {
      alert("not valid stock name");
      return;
    } else {
      console.log("continuing on");
    } 

    fetch(`/v1/reddit/wallstreetbets/search/${search}`)
      .then((res) => res.json())
      .then((data) => {
        setReddit(Object.values(data));
      });

    fetch(`/v1/twitter/${search}`)
      .then((res) => res.json())
      .then((data) => {
        setTweets(data);
      });

    fetch(`/v1/news/everythingBasic/${search}`)
      .then((res) => res.json())
      .then((data) => {
 
        setNews(Object.values(data));
      });
  };

  const onSubscribe = async (ev) => {
    ev.preventDefault();
    if (error !== "") return;

    fetch(`/v1/user/subscribe/${search}`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => setNotify(`Subscribed to ${search}`));
  };

  const onAcceptRegister = () => {
    setNotify("");
  };

  return (
    <SearchBase>
      {notify !== "" ? (
        <ModalNotify
          id="notification"
          msg={notify}
          onAccept={onAcceptRegister}
        />
      ) : null}
      <ErrorMessage msg={error} />
      <FormBase>
        <FormInput placeholder="Search..." onChange={onChange} onInput = {toInputUppercase} />
        <FormButton type="submit" onClick={onSubmit}>
          Search
        </FormButton>
        <FormButton type="submit" onClick={onSubscribe}>
          Subscribe
        </FormButton>
      </FormBase>

      <LeftColumn>
        {reddit.length > 0 &&
          reddit.map((post) => {
            return (
              <Reddit
                style={
                  post.sentiment > 0
                    ? { backgroundColor: lightGreen }
                    : post.sentiment < 0
                    ? { backgroundColor: lightRed }
                    : {}
                }
              >
                <a href={post.url}>
                  <RedditTitle>{post.title}</RedditTitle>
                </a>
                <p>{post.body}</p>
                <FcReddit size={16} />
              </Reddit>
            );
          })}
      </LeftColumn>

      <MiddleColumn>
        {news.length > 0 &&
          news.map((article) => {
            return (
              <Reddit
                style={
                  article.sentiment > 0
                    ? { backgroundColor: lightGreen }
                    : article.sentiment < 0
                    ? { backgroundColor: lightRed }
                    : {}
                }
              >
                <a href={article.url}>
                  <RedditTitle>{article.title}</RedditTitle>
                </a>
                <p>
                  {" "}
                  <NewsImage src={article.urlToImage} />
                  {article.description}
                </p>
              </Reddit>
            );
          })}
      </MiddleColumn>
      <RightColumn>
        {tweets.length > 0 &&
          tweets.map((post) => {
            console.log(post.sentiment);
            return (
              <Tweet
                key={post.id}
                style={
                  post.sentiment > 0
                    ? { backgroundColor: lightGreen }
                    : post.sentiment < 0
                    ? { backgroundColor: lightRed }
                    : {}
                }
              >
                <p>{post.text}</p>
                <FiTwitter />
              </Tweet>
            );
          })}
      </RightColumn>
    </SearchBase>
  );
};
