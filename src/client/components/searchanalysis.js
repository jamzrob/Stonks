"use strict";

import styled from "styled-components";
import React, { useState, useEffect } from "react";
import { FiTwitter } from "react-icons/fi";
import { FcReddit } from "react-icons/fc";
import { ErrorMessage, ModalNotify } from "./shared";
import { TickerSymbols } from "./stocktickers";
import Calendar from "react-calendar";

import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";

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

export const SearchAnalysis = () => {
  const [search, setSearch] = useState("");
  const [reddit, setReddit] = useState({});
  const [tweets, setTweets] = useState({});
  const [news, setNews] = useState({});
  const [notify, setNotify] = useState("");
  const [error, setError] = useState("");

  const [startDate, onChangeStartDate] = useState(new Date());
  const [endDate, onChangeEndDate] = useState(new Date());

  const onChange = (ev) => {
    console.log(ev.target.value);
    setSearch(ev.target.value);
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
    console.log(startDate.getTime());
    window.location.href = `/analysis/${search.toLowerCase()}?start=${Math.floor(
      startDate.getTime() / 1000
    )}&end=${Math.floor(endDate.getTime() / 1000)}`;

    if (!found) {
      alert("not valid stock name");
      return;
    } else {
      console.log("continuing on");
    }
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
        <FormInput placeholder="Submit..." onChange={onChange} />

        <FormButton type="submit" onClick={onSubmit}>
          Submit
        </FormButton>
      </FormBase>
      <Container fluid="lg">
        <Row>
          <h1>
            Dates are only available between between February and April 2021
          </h1>

          <Col>
            <h1>Start Date: {startDate.toDateString()} </h1>
            <Calendar onChange={onChangeStartDate} value={startDate} />
          </Col>
          <Col>
            <h1>End Date: {endDate.toDateString()}</h1>
            <Calendar onChange={onChangeEndDate} value={endDate} />
          </Col>
        </Row>
      </Container>
    </SearchBase>
  );
};
