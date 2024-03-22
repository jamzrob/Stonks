"use strict";

import React, { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import styled from "styled-components";
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Table from 'react-bootstrap/Table'
import { GravHash } from "./header";
import {
  ErrorMessage,
  InfoBlock,
  InfoData,
  InfoLabels,
  ShortP,
} from "./shared";
import { TickerSymbols } from "./stocktickers";
import { curveNatural } from "d3-shape";

const ProfileBlockBase = styled.div`
  display: grid;
  grid-template-columns: auto;
  grid-template-rows: auto;
  grid-template-areas: "pic" "profile";
  padding: 1em;

  @media (min-width: 500px) {
    grid-template-columns: auto 1fr;
    grid-template-areas: "pic profile";
    padding: 2em;
  }
`;

const ProfileImage = styled.img`
  grid-area: pic;
  max-width: 150px;
  padding: 1em;
  @media (min-width: 500px) {
    padding: 0.5em;
    max-width: 200px;
  }
`;

const StockTable = styled.table`
  width: 100%;
  text-align: center;
  @media (max-width: 499px) {
    & > tbody > tr > td:nth-of-type(2),
    & > thead > tr > th:nth-of-type(2) {
      display: none;
    }
  }
`;

export const FormButton = styled.button`
  max-height: 2em;
  justify-content: center;
  background: #6495ed;
  grid-area: submit;
`;


const ProfileBlock = (props) => {
  const [stocks, setStocks] = useState([])
  const [stockPrices, setStockPrices] = useState([]);
  const [test, setTest] = useState()
  let stockNames = [];
  props.stocks.forEach(stock => {
    let found = false;
    TickerSymbols.forEach(async (stockTicker) => {
      if (stockTicker.symbol == stock.toUpperCase()){
        stockNames.push(stockTicker.name);
        found = true; 
      }
    })
    if (found == false) {stockNames.push("unkown")}
  })
  
  const getStockPrice = async (stock) => {
    const response = await fetch(`/v1/yahoo/${stock}`)
    const data = await response.json();
    return data.price
}


const getStockPrices = async () => {
  let stockPrices = [];
  let prom;
  if (stocks.length > 5) {
    prom = stocks.slice(0,5).map(async stock => getStockPrice(stock));
  } else {
    prom = stocks.map(async stock => getStockPrice(stock));
  }
  stockPrices = await Promise.all(prom);
  return stockPrices
}


  useEffect(() => {
    setTest("hi")
    setStocks(props.stocks)
    if (stocks.length > 0){
      getStockPrices().then((data) => {
        setStockPrices(data);
        console.log("got new prices")
      })
      .catch((err) => console.log(err));
    }
  }, [props]);


  const unsubscribeStock = async (ev, stock) => {
    setTest("changed")
    ev.preventDefault();
    let currentState = props
    let index = currentState.stocks.indexOf(stock)
    currentState.stocks.splice(index,1)
    const res = await fetch('/v1/user', { 
      method: 'PUT',
      body: JSON.stringify(currentState),
      headers: {
        'content-type': 'application/json'
      }
    })
    if (res.status == 204) {
      let newStockPrices = stockPrices;
      newStockPrices.splice(index, 1)
      setStocks(currentState.stocks)
      setStockPrices(newStockPrices)
    } else {
      const err = await res.json();
    }
  };


  return (
    <div>
      <ProfileBlockBase>
        <ProfileImage src={GravHash(props.primary_email, 200)} />
        <InfoBlock>
          <InfoLabels>
            <p>Username:</p>
            <p>First Name:</p>
            <p>Last Name:</p>
            <p>Email Address:</p>
          </InfoLabels>
          <InfoData>
            <ShortP>{props.username}</ShortP>
            <ShortP>{props.first_name}</ShortP>
            <ShortP>{props.last_name}</ShortP>
            <ShortP>{props.primary_email}</ShortP>
          </InfoData>
        </InfoBlock>
      </ProfileBlockBase>
      <p>Following (Max 5 Stocks): </p>
      <StockTable>
          <thead>
            <tr>
              <th>Stock Name</th>
              <th>Stock Ticker</th>
              <th>Stock Price</th>
            </tr>
          </thead>
          <tbody>
          {stocks.map((stock,index) => (
              <tr>
                <td> {stockNames[index]}</td>
                <td>{stock}</td>
                <td>{stockPrices[index]}</td>
                <FormButton onClick={(ev) => {unsubscribeStock(ev, stock)}}> Unsubscribe </FormButton>
              </tr>
            ))}
          </tbody>
        </StockTable>
    </div>
    
  );
};

const EditLinkBase = styled.div`
  grid-area: sb;
  display: none;
  & > a {
    cursor: not-allowed;
  }
  @media (min-width: 500px) {
    display: inherit;
  }
`;

const EditLink = ({ show }) => {
  return show ? (
    <EditLinkBase>
      <Link to="/edit">Edit Profile</Link>
    </EditLinkBase>
  ) : null;
};


const ProfileBase = styled.div`
  grid-area: main;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const Profile = (props) => {
  let [state, setState] = useState({
    username: "",
    first_name: "",
    last_name: "",
    primary_email: "",
    stocks: [],
    stockPrices: [],
    error: "",
  });

  const fetchUser = (username) => {
    fetch(`/v1/user/${username}`)
      .then((res) => res.json())
      .then((data) => {
        setState(data);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchUser(props.match.params.username);
  }, [props]);

  useEffect(() => {
    props.logIn(props.match.params.username);
  }, []);


  // Is the logged in user viewing their own profile
  const isUser = state.username === props.currentUser;
  return (
    <Fragment>
      <EditLink show={isUser} />
      <ProfileBase>
        <ErrorMessage msg={state.error} hide={true} />
        <ProfileBlock {...state} />
      </ProfileBase>
    </Fragment>
  );
};

Profile.propTypes = {
  match: PropTypes.object.isRequired,
  gridPlacement: PropTypes.string,
  user: PropTypes.string,
};
