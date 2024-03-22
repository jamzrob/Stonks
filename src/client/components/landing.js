"use strict";

import React from "react";
import styled from "styled-components";

const LandingBase = styled.div`
  display: flex;
  justify-content: center;
  grid-area: main;
`;

export const Landing = () => (
  <LandingBase>
    <h1>Welcome to Stonkify!!</h1>
  </LandingBase>
);
