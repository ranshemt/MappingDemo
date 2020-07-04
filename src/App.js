import React from "react";
import { Typography, Container } from "@material-ui/core";
import Interface from "./Interface";
const S = {
  flexContainer: {
    display: "flex",
    flexDirection: "column",
    alignContent: "center",
    alignItems: "center",
    justifyContent: "space-between",
    boxSizing: "border-box",
    padding: 0,
    margin: 0,
  },
};

export default function App() {
  return (
    <Container maxWidth="xl">
      <div style={S.flexContainer}>
        <Typography variant="h2">
          Mapping Demo
          {/* ,&nbsp;<a
            style={{ fontSize: "10%" }}
            target="_blank"
            href="https://www.google.com/maps/d/viewer?mid=1RnQNtgEXUfJX0edsa9whdrXAun9rYd0O&ll=32.462847328400976%2C34.97585218808621&z=18"
          >
            reference google map
          </a> */}
        </Typography>
        <Interface />
      </div>
    </Container>
  );
}
