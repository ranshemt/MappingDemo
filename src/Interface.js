//imports & consts
import React from "react";
import * as turf from "@turf/turf";
import {
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from "@material-ui/core";
const img = require("./Assets/DJI_0039.jpg");
const canvasID = "myCanvas";
const colors = getColors();
//
export default function App() {
  const canvasRef = React.useRef(null);
  /**
   * image dimensions in px / meters
   * + centerCoordinate
   * + initial bearing
   */
  const myScale = 4;
  const originalWidth = 4000;
  const originalHeight = 2250;
  //   const centerLat = 32.462723;
  //   const centerLon = 34.975773;
  const centerLat = 32.46284;
  const centerLon = 34.97569;
  const initialBearing = -19;
  /**
   * Check file "Image Mapping: DJI_0039.JPG_0039 from yivgeny" in our Google Drive fodler:
   * https://docs.google.com/document/d/1l299731IXY5fothCO_mV8LTg6xHnlF0-q9J791vPnBQ
   * specs to compute footprint size
   * height = 20000, f = 4.7, x = 6.3, y = 4.7 | WIDTH = 268.0851 | HEIGHT = 200.00
   */
  const imageWidth_meters = 268.0851;
  const imageHeight_meters = 200.0;
  const [polygon] = React.useState({
    width: {
      meters: imageWidth_meters,
      px: originalWidth / myScale,
    },
    height: {
      meters: imageHeight_meters,
      px: originalHeight / myScale,
    },
  });
  /**
   * center coordinate of the image
   */
  const [center] = React.useState({ lat: centerLat, lon: centerLon });
  /**
   * mouse position stuff
   */
  const [XY, setXY] = React.useState({ x: -1, y: -1 });
  const [axisXY, setAxisXY] = React.useState({ x: -1, y: -1 });
  /**
   * will be used to calculate result
   */
  const [mouseDistance, setMouseDistance] = React.useState({
    width: -1,
    height: -1,
  });
  const [destinationParams, setDestinationParams] = React.useState({
    diagonal: -1,
    bearing: 0,
  });
  const [resultCoord, setResultCoord] = React.useState({
    lat: -1,
    lon: -1,
  });
  //
  const [POINTS, setPOINTS] = React.useState([]);
  /**
   * paint image
   */
  React.useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    canvasRef.current.width = polygon.width.px;
    canvasRef.current.height = polygon.height.px;
    let background = new Image();
    background.src = img;
    background.onload = () => {
      ctx.drawImage(background, 0, 0, polygon.width.px, polygon.height.px);
      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      ctx.moveTo(polygon.width.px / 2, 0);
      ctx.lineTo(polygon.width.px / 2, polygon.height.px);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, polygon.height.px / 2);
      ctx.lineTo(polygon.width.px, polygon.height.px / 2);
      ctx.stroke();
    };
  }, [canvasRef, polygon.width.px, polygon.height.px]);
  /**
   * the main function!
   * get mouse position and calclate the result
   * also updates state for each stage
   * using tmp variables because setState is async
   */
  function getPosAndCalculate(e, fromCenter = false) {
    //
    //from stackoverflow, get the click position relative to top left of image
    const rect = canvasRef.current.getBoundingClientRect(); // abs. size of element
    const scaleX = canvasRef.current.width / rect.width; // relationship bitmap vs. element for X
    const scaleY = canvasRef.current.height / rect.height; // relationship bitmap vs. element for Y
    let X = (e.clientX - rect.left) * scaleX; // scale mouse coordinates after they have
    let Y = (e.clientY - rect.top) * scaleY; // been adjusted to be relative to element
    //
    //mark click poistion on the image
    const currColor = colors[POINTS.length];
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = currColor;
    ctx.fillRect(X - 3, Y - 3, 6, 6);
    setXY({ x: X, y: Y });
    //
    //click position relative to center
    const tmp_axisX = X - canvasRef.current.width / 2;
    const tmp_axisY = (Y - canvasRef.current.height / 2) * -1;
    setAxisXY({ x: tmp_axisX, y: tmp_axisY });
    //
    //pixels to meters
    const tmp_widthMdistance = Math.abs(
      tmp_axisX * (polygon.width.meters / canvasRef.current.width)
    );
    const tmp_heightMdistance = Math.abs(
      tmp_axisY * (polygon.height.meters / canvasRef.current.height)
    );
    setMouseDistance({
      width: tmp_widthMdistance,
      height: tmp_heightMdistance,
    });
    //
    //final bearing
    const tmp_diagonal = Math.sqrt(
      Math.pow(tmp_widthMdistance, 2) + Math.pow(tmp_heightMdistance, 2)
    );
    console.log(`tmp_diagonal = ${tmp_diagonal}`);
    let degree = (Math.atan2(tmp_axisX, tmp_axisY) * 180) / Math.PI;
    if (degree < 0) degree = 360 + degree;
    const tmp_bearing = (degree + initialBearing) % 360;
    setDestinationParams({ diagonal: tmp_diagonal, bearing: tmp_bearing });
    //
    //final coordinate result
    const destination = turf.destination(
      turf.point([center.lon, center.lat]),
      tmp_diagonal,
      tmp_bearing,
      { units: "meters" }
    );
    setResultCoord({
      lat: destination.geometry.coordinates[1],
      lon: destination.geometry.coordinates[0],
    });
    const newPoints = [
      ...POINTS,
      {
        index: POINTS.length,
        lat: destination.geometry.coordinates[1],
        lon: destination.geometry.coordinates[0],
        distance: tmp_diagonal,
        color: colors[POINTS.length],
      },
    ];
    setPOINTS(newPoints);
  }
  /**
   * the component
   */
  return (
    <Grid
      container
      direction="row"
      justify="center"
      alignItems="flex-start"
      alignContent="center"
      style={{ margin: 32 }}
    >
      <Grid xs={8} item>
        <canvas
          id={canvasID}
          ref={canvasRef}
          style={{ cursor: "crosshair" }}
          onClick={(e) => getPosAndCalculate(e)}
        >
          <p>Add suitable fallback here.</p>
        </canvas>
      </Grid>
      <Grid item xs={4}>
        <Typography variant="h4" style={{ fontSize: 20, marginLeft: 50 }}>
          Coordinates
        </Typography>
        <List style={{ marginLeft: 50 }}>
          {POINTS.map((point) => (
            <ListItem>
              <ListItemAvatar>
                <Avatar style={{ backgroundColor: point.color }}>
                  {point.index + 1}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`(${point.lat}, ${point.lon})`}
                secondary={`Distance: ${point.distance} meters`}
              />
            </ListItem>
          ))}
        </List>
        <div style={{ display: "none" }}>
          <Typography variant="body2">
            Definitions:
            <br /> <br />
            Width = X axis = Longtitude <br />
            Height = Y axis = Latitude
          </Typography>
          <Typography variant="h6">
            -------------------------
            <br />
            -------------------------
            <br />
            Coordinate of mouse position
            <br /> <br />
            <span style={{ color: "rgb(255, 0, 0)" }}>
              Latitude: {resultCoord.lat}
            </span>
            <br />
            <span style={{ color: "rgb(255, 0, 0)" }}>
              Longtitude: {resultCoord.lon}
            </span>
          </Typography>
          <Typography variant="h6">
            -------------------------
            <br />
            -------------------------
            <br />
            Distance from center to mouse position
            <br /> <br />
            Width (X axis / longtitude): {mouseDistance.width} meters
            <br />
            Height (Y axis / latitude): {mouseDistance.height} meters
            <br />
            Diagonal: {destinationParams.diagonal} meters
          </Typography>
          <Typography variant="body2">
            -------------------------
            <br />
            -------------------------
            <br />
            Polygon (footprint) dimensions:
            <br /> <br />
            Width:
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {polygon.width.meters} meters
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {polygon.width.px} px
            <br />
            Half width: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {polygon.width.meters / 2} meters
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {polygon.width.px / 2} px
            <br /> <br />
            Height:
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {polygon.height.meters} meters
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {polygon.height.px} px
            <br />
            Half height: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {polygon.height.meters / 2} meters
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {polygon.height.px / 2} px
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            -------------------------
            <br />
            -------------------------
            <br />
            Mouse position relative image center / left top
            <br /> <br />X relative to center: {axisXY.x} px
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; X relative to left top: {XY.x} px
            <br />Y relative to center: {axisXY.y} px
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            &nbsp;&nbsp; Y relative to left top: {XY.y} px
          </Typography>
          <Typography variant="body1">
            -------------------------
            <br />
            -------------------------
            <br />
            Distance from center to mouse position
            <br /> <br />
            Width (X axis / longtitude): {mouseDistance.width} meters
            <br />
            Height (Y axis / latitude): {mouseDistance.height} meters
          </Typography>
          <Typography variant="body1">
            -------------------------
            <br />
            -------------------------
            <br />
            Parameters for destination calculation
            <br /> <br />
            Diagonal: {destinationParams.diagonal} meters
            <br />
            Bearing: {destinationParams.bearing} °
          </Typography>
          <Typography variant="body1">
            -------------------------
            <br />
            -------------------------
            <br />
            Coordinate of mouse position
            <br /> <br />
            Latitude: {resultCoord.lat}
            <br />
            Longtitude: {resultCoord.lon}
          </Typography>
        </div>
      </Grid>
    </Grid>
  );
}
function getColors() {
  return [
    "black",
    "brown",
    "blue",
    "chocolate",
    "cyan",
    "darkviolet",
    "olive",
    "purple",
    "yellow",
    "teal",
    "sheshell",
    "salmon",
    "RebeccaPurple",
    "PaleGreen",
    "Navy",
    "Indigo",
    "DeepPink",
    "AntiqueWhite",
    "OrangeRed",
  ];
}
