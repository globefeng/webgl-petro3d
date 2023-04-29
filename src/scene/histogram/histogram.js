import React, { useContext, useState, useEffect, Fragment } from 'react';
import { PetroContext } from '../../context/petroContext';
import './histogram.css';
import Button from '@mui/material/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import checkIcon from '../treeView/checked.svg';
import './histogram.css';

const HistogramComponent = () => {
  const { eventData, fractureData, histogramSize, dispatchAction } = useContext(PetroContext)
  const [histogramList, setHistogramList] = useState();
  // const [histogramTableList, setHistogramTableList] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  // const [showReset, setShowReset] = useState(false);
  const [sliderPosition, setSliderPosition] = useState([0, 100, 0]);
  const [downPosition, setDownPosition] = useState([-1, -1]);
  // const [eventTime, setEventTime] = useState([-1, -1]);
  const [mouseInside, setMouseInside] = useState([false, false]);
  const [chartData, setChartData] = useState(null);
  const [showHistogram, setShowHistogram] = useState(true);
  const [showPress, setShowPress] = useState(true);
  const [showSlurry, setShowSlurry] = useState(true);
  const [showProppant, setShowProppant] = useState(true);
  const [currentHistogram, setCurrentHistogram] = useState(-1);
  const [currentPress, setCurrentPress] = useState(-1);
  const [currentSlurry, setCurrentSlurry] = useState(-1);
  const [currentProppant, setCurrentProppant] = useState(-1);

  const canvasHeight = 160;

  const findMinMax = (arr) => {
    let min = arr[0].T, max = arr[0].T;

    for (let i = 1, len = arr.length; i < len; i++) {
      let v = arr[i].T;
      min = (v < min) ? v : min;
      max = (v > max) ? v : max;
    }

    return [min, max];
  }

  const getEventTime = (x) => {
    let unitLength = 100 / histogramList.length;
    let currentX = x / unitLength;
    let currentIndex = Math.floor(currentX);
    let currentLeft = (currentX - currentIndex) / unitLength;

    if (currentIndex > (histogramList.length - 1)) {
      return histogramList[histogramList.length - 1].max;
    }

    return Math.floor(histogramList[currentIndex].min +
      (histogramList[currentIndex].max - histogramList[currentIndex].min) * currentLeft);
  }

  const displayHistogram = () => {
    if (histogramList === undefined || histogramSize === null || histogramSize === undefined) return;

    let maxCount = histogramList.reduce((max, p) => p.count > max ? p.count : max, histogramList[0].count);
    let barCount = histogramList.length;

    var histogramCanvas = document.getElementById("histogramCanvas");
    histogramCanvas.width = histogramSize[0] - 4;
    histogramCanvas.height = canvasHeight;

    let padding = 20;
    let chartWidth = histogramSize[0] - 2 * padding;
    let chartHeight = canvasHeight - 30;

    var ctx = document.getElementById("histogramCanvas").getContext("2d");

    if (showHistogram) {
        for (var i = 0; i < histogramList.length; i++) {
          var d = histogramList[i];

          ctx.fillStyle = "rgb(" + d.colorR + ',' + d.colorG + ',' + d.colorB + ")";
          ctx.fillRect(padding + chartWidth / barCount * i, chartHeight - (d.count * chartHeight) / maxCount, chartWidth / barCount, (d.count * chartHeight) / maxCount);

          ctx.beginPath();
          ctx.lineWidth = "1";
          ctx.strokeStyle = "black";
          ctx.rect(padding + chartWidth / barCount * i, chartHeight - (d.count * chartHeight) / maxCount, chartWidth / barCount, (d.count * chartHeight) / maxCount);
          ctx.stroke();
        }
    }

    if (chartData !== null && chartData.length > 2) {
      let lastX = padding;
      if (showPress) {
        ctx.beginPath();
        ctx.lineWidth = "1";
        ctx.strokeStyle = "red";
        lastX = Math.floor(padding + chartData[0].X * chartWidth);
        ctx.moveTo(lastX, chartHeight - chartData[0].Press * chartHeight);
        for (var i2 = 1; i2 < chartData.length; i2++)
        {
          let newX = Math.floor(padding + chartData[i2].X * chartWidth);
          if (newX !== lastX) {
            ctx.lineTo(newX, chartHeight - chartData[i2].Press * chartHeight);
            lastX = newX;
          }
        }
        ctx.stroke();  

        if (showHistogram) {
          ctx.beginPath();
          ctx.lineWidth = "1";
          ctx.strokeStyle = "white";
          lastX = Math.floor(padding + chartData[0].X * chartWidth);
          ctx.moveTo(lastX, chartHeight - chartData[0].Press * chartHeight + 2);
          for (var i3 = 1; i3 < chartData.length; i3++)
          {
            let newX = Math.floor(padding + chartData[i3].X * chartWidth);
            if (newX !== lastX) {
              ctx.lineTo(newX, chartHeight - chartData[i3].Press * chartHeight + 2);
              lastX = newX;
            }
          }
          ctx.stroke();           
        }
      }

      if (showSlurry) {
        ctx.beginPath();
        ctx.lineWidth = "1";      
        ctx.strokeStyle = "green";
        lastX = Math.floor(padding + chartData[0].X * chartWidth);
        ctx.moveTo(lastX, chartHeight - chartData[0].Slurry * chartHeight * 0.8);

        for (var i4 = 1; i4 < chartData.length; i4++)
        {
          let newX = Math.floor(padding + chartData[i4].X * chartWidth);
          if (newX !== lastX) {
            ctx.lineTo(newX, chartHeight - chartData[i4].Slurry * chartHeight * 0.8);
            lastX = newX;
          }
        }
        ctx.stroke();      

        if (showHistogram) {
          ctx.beginPath();
          ctx.lineWidth = "1";      
          ctx.strokeStyle = "white";
          lastX = Math.floor(padding + chartData[0].X * chartWidth);
          ctx.moveTo(lastX, chartHeight - chartData[0].Slurry * 0.8 * chartHeight + 2);
          for (var i5 = 1; i5 < chartData.length; i5++)
          {
            let newX = Math.floor(padding + chartData[i5].X * chartWidth);
            if (newX !== lastX) {
              ctx.lineTo(newX, chartHeight - chartData[i5].Slurry * chartHeight * 0.8 + 2);
              lastX = newX;
            }
          }
          ctx.stroke();      
        }
      }

      if (showProppant) {
        ctx.beginPath();
        ctx.lineWidth = "1";
        ctx.strokeStyle = "blue";
        lastX = Math.floor(padding + chartData[0].X * chartWidth);
        ctx.moveTo(lastX, chartHeight - chartData[0].Proppant * chartHeight * 0.6);
        for (var i6 = 1; i6 < chartData.length; i6++)
        {
          let newX = Math.floor(padding + chartData[i6].X * chartWidth);
          if (newX !== lastX) {
            ctx.lineTo(newX, chartHeight - chartData[i6].Proppant * chartHeight * 0.6);
            lastX = newX;
          }
        }
        ctx.stroke();
        
        if (showHistogram) {
          ctx.beginPath();
          ctx.lineWidth = "1";
          ctx.strokeStyle = "white";
          lastX = Math.floor(padding + chartData[0].X * chartWidth);
          ctx.moveTo(lastX, chartHeight - chartData[0].Proppant * chartHeight * 0.6 + 2);
          for (var i7 = 1; i7 < chartData.length; i7++)
          {
            let newX = Math.floor(padding + chartData[i7].X * chartWidth);
            if (newX !== lastX) {
              ctx.lineTo(newX, chartHeight - chartData[i7].Proppant * chartHeight * 0.6 + 2);
              lastX = newX;
            }
          }
          ctx.stroke();     
        }
      }
    } 

    drawTriangle(ctx, (padding + sliderPosition[1] * chartWidth / 100), chartHeight, mouseInside[1] ? "#00FF00" : "#FF0000");
    drawTriangle(ctx, (padding + sliderPosition[0] * chartWidth / 100), chartHeight, mouseInside[0] ? "#00FF00" : "#0000FF");
    if (sliderPosition[0] !== sliderPosition[2]) {
      drawRectangle(ctx, (padding + sliderPosition[0] * chartWidth / 100), (padding + sliderPosition[2] * chartWidth / 100), chartHeight, chartHeight+20, "#006400A0");
    }
  }
  
  const drawRectangle = (ctx, x1, x2, y1, y2, color) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1, y2);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2, y1);
    ctx.lineTo(x1, y1);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x2, y1);
    ctx.lineTo(x2, 0);
    ctx.closePath();

    ctx.setLineDash([3, 10]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    ctx.setLineDash([10, 0]);
  }

  const drawTriangle = (ctx, x, y, color) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 15, y + 20);
    ctx.lineTo(x + 15, y + 20);
    ctx.closePath();

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, 0);
    ctx.closePath();

    ctx.setLineDash([3, 10]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    ctx.setLineDash([10, 0]);
  }

  const getEventCount = (eventList, start, end) => {
    return eventList.filter(a => a.T >= start && a.T < end).length;
  }

  useEffect(() => {
    const getTimeString = (time) => {
      let dt = new Date();
      dt.setTime(time * 1000);
      return dt.getUTCFullYear() + '/' + formatTime(dt.getUTCMonth() + 1) + '/' + formatTime(dt.getUTCDate()) + ' ' +
             formatTime(dt.getUTCHours()) + ':' + formatTime(dt.getUTCMinutes()) + ':' + formatTime(dt.getUTCSeconds());
    }

    if (eventData && eventData.DD_EventWellCollection_EE !== null ) {

      let stages = eventData.DD_EventWellCollection_EE[0].DD_StageCollection_EE;

      let histogramList = [];
      let histogramTableList = [];
      let fractureList = [];

      for (var i = 0; i < stages.length; i++) {
        let eventList = stages[i].DD_EventCollection_EE;
        let minMax = findMinMax(eventList)
        let start = minMax[0];
        let end = start + 3600;

        let fractureStart = histogramTableList.length;

        do {
          let eventCount = getEventCount(eventList, start, end);
          histogramList.push({
            name: stages[i].DD_Name_EE, 
            min: start, 
            max: end, 
            count: eventCount,
            colorR: Math.floor(stages[i].DD_Color_EE.X * 255),
            colorG: Math.floor(stages[i].DD_Color_EE.Y * 255),
            colorB: Math.floor(stages[i].DD_Color_EE.Z * 255)
          });

          let startTime = getTimeString(start);
          let endTime = getTimeString(end);

          histogramTableList.push({
            name: stages[i].DD_Name_EE, 
            min: startTime, 
            max: endTime, 
            count: eventCount,
            colorR: Math.floor(stages[i].DD_Color_EE.X * 255),
            colorG: Math.floor(stages[i].DD_Color_EE.Y * 255),
            colorB: Math.floor(stages[i].DD_Color_EE.Z * 255)
          });

          start = end;
          end = start + 3600;

        } while (end < minMax[1]);

        let fractureEnd = histogramTableList.length;
        fractureList.push({startPos: fractureStart, endPos: fractureEnd, timeStart: minMax[0], timeEnd: end});
      }

      if (fractureData !== null && fractureData !== undefined) {
        let fractureChartData = []
        fractureList.forEach(m => { m.startPos /= histogramList.length; m.endPos /= histogramList.length})
        fractureList.forEach(m => { 
          let fractureData = fractureData.DataList.filter(d => d.Time >= m.timeStart); 
          fractureData = fractureData.filter(d => d.Time <= m.timeEnd); 
          fractureData.forEach(p => {
            let xPos = m.startPos + (p.Time - m.timeStart) / (m.timeEnd - m.timeStart) * (m.endPos - m.startPos);
            fractureChartData.push({X: xPos, Press: p.PressData, Slurry: p.SlurryData, Proppant: p.ProppantData})
          })         
        })        
        setChartData(fractureChartData);
      }
      else
      {
        setChartData(null);
      }

      setHistogramList(histogramList);

      if (histogramList.length > 0) {
        setMSEventTime([histogramList[0].min, histogramList[histogramList.length - 1].max]);
      }
    }
  }, [eventData, fractureData])

  useEffect(() => {
    displayHistogram();
  })

  const StartPlay = () => {
    // setShowReset(isPlaying);
    if (!isPlaying && sliderPosition[1] === sliderPosition[2]) {
      setSliderPosition([sliderPosition[0], sliderPosition[1], sliderPosition[0]])
    }
    setIsPlaying(!isPlaying);
  }

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        if ((sliderPosition[2] + 0.2) > sliderPosition[1]) {
          setSliderPosition([sliderPosition[0], sliderPosition[1], sliderPosition[1]]);
          setMSEventTime([getEventTime(sliderPosition[0]), getEventTime(sliderPosition[1])]);
          setIsPlaying(false);
          // setShowReset(true);
        }
        else {
          setSliderPosition([sliderPosition[0], sliderPosition[1], sliderPosition[2] + 0.2]);
          setMSEventTime([getEventTime(sliderPosition[0]), getEventTime(sliderPosition[2])]);
          updateData(getEventTime(sliderPosition[2]))
        }
      }, 10)
    }
    else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isPlaying, sliderPosition])

  const onMouseUp = (e) => {
    if (isPlaying) return;
    
    setDownPosition([-1, -1]);
  }
  const onMouseDown = (e) => {
    if (isPlaying) return;

    e.preventDefault();

    let x = e.nativeEvent.offsetX;

    if (mouseInside[0] === true) {
      setDownPosition([x, downPosition[1]])
    }
    else if (mouseInside[1] === true) {
      setDownPosition([downPosition[0], x])
    }
  }

  const updateData = (time) => {
    histogramList.forEach(item => {
      if (time >= item.min && time <= item.max) {
        setCurrentHistogram(item.count);
        return;
      }
    })

    if (fractureData !== null && fractureData !== undefined) {
        let fractureData = fractureData.DataList; 
        let start = 0;
        let end = fractureData.length - 1;

        if (time < fractureData[start].Time || time > fractureData[end].Time) {
          setCurrentPress(-1);
          setCurrentSlurry(-1);
          setCurrentProppant(-1);
        }
        else {
          while ((end - start) > 1) {
            let middle = Math.floor((start + end) / 2);
            if (time < fractureData[middle].Time) {
              end = middle;
            }
            else {
              start = middle;
            }
          }

          if (time === fractureData[start].Time) {
            setCurrentPress(fractureData[start].Press);
            setCurrentSlurry(fractureData[start].Slurry);
            setCurrentProppant(fractureData[start].Proppant);  
          }
          else if (time === fractureData[end].Time) {
            setCurrentPress(fractureData[end].Press);
            setCurrentSlurry(fractureData[end].Slurry);
            setCurrentProppant(fractureData[end].Proppant);  
          }
          else if (fractureData[end].Time > fractureData[start].Time) {
            let ratio = (time - fractureData[start].Time) / (fractureData[end].Time - fractureData[start].Time);
            setCurrentPress((fractureData[start].Press + ratio * (fractureData[end].Press - fractureData[start].Press)));
            setCurrentSlurry((fractureData[start].Slurry + ratio * (fractureData[end].Slurry - fractureData[start].Slurry)));
            setCurrentProppant((fractureData[start].Proppant + ratio * (fractureData[end].Proppant -fractureData[start].Proppant)));  
          }
        }
    }
  }

  const onMouseMove = (e) => {
    if (isPlaying || histogramSize === null) return;

    e.preventDefault();

    let x = e.nativeEvent.offsetX;
    let y = e.nativeEvent.offsetY;

    let padding = 20;
    let chartWidth = histogramSize[0] - 2 * padding;

    if (downPosition[0] !== -1) {
      let sx = (x - downPosition[0]) * 100 / chartWidth + sliderPosition[0];
      if (sx < 0) { sx = 0 }
      else if (sx > 100) { sx = 100 }

      if (sx > sliderPosition[1]) {
        sx = sliderPosition[1];
      }

      setDownPosition([x, downPosition[1]])
      setSliderPosition([sx, sliderPosition[1], sx]);
      setMSEventTime([getEventTime(sliderPosition[0]), getEventTime(sliderPosition[1])]);
      updateData(getEventTime(sliderPosition[0]));
    }
    else if (downPosition[1] !== -1) {
      let ex = (x - downPosition[1]) * 100 / chartWidth + sliderPosition[1];
      if (ex < 0) { ex = 0 }
      else if (ex > 100) { ex = 100 }

      if (ex < sliderPosition[0]) {
        ex = sliderPosition[0];
      }

      setDownPosition([downPosition[0], x]);
      setSliderPosition([sliderPosition[0], ex, sliderPosition[0]]);
      setMSEventTime([getEventTime(sliderPosition[0]), getEventTime(sliderPosition[1])]);
      updateData(getEventTime(sliderPosition[1]));
    }
    else {
      let startX = padding + sliderPosition[0] * chartWidth / 100;
      let endX = padding + sliderPosition[1] * chartWidth / 100;

      let startIn = false;
      let endIn = false;

      let chartHeight = canvasHeight - 30;

      if (y >= chartHeight && y <= (chartHeight + 20)) {
        startIn = ptInTriangle(x, y, startX, chartHeight, startX - 15, chartHeight + 20, startX + 15, chartHeight + 20);
        endIn = ptInTriangle(x, y, endX, chartHeight, endX - 15, chartHeight + 20, endX + 15, chartHeight + 20);
      }

      setMouseInside([startIn, endIn]);
    }
  }

  const ptInTriangle = (x, y, x0, y0, x1, y1, x2, y2) => {
    let A = 1 / 2 * (-y1 * x2 + y0 * (-x1 + x2) + x0 * (y1 - y2) + x1 * y2);
    let sign = A < 0 ? -1 : 1;
    let s = (y0 * x2 - x0 * y2 + (y2 - y0) * x + (x0 - x2) * y) * sign;
    let t = (x0 * y1 - y0 * x1 + (y0 - y1) * x + (x1 - x0) * y) * sign;

    return s > 0 && t > 0 && (s + t) < 2 * A * sign;
  }

  const reset = () => {
    setIsPlaying(false);
    setSliderPosition([0, 100, 0]);
    setMSEventTime([getEventTime(0), getEventTime(100)]);
  }

  const setMSEventTime = (eventTime) => {
    dispatchAction({ type: 'SET_EVENTTIME', data: eventTime });
  }

  const getTimeString = (time) => {
    let dt = new Date();
    dt.setTime(time * 1000);
    return dt.getUTCFullYear() + '/' + formatTime(dt.getUTCMonth() + 1) + '/' + formatTime(dt.getUTCDate()) + ' ' +
           formatTime(dt.getUTCHours()) + ':' + formatTime(dt.getUTCMinutes()) + ':' + formatTime(dt.getUTCSeconds());
  }

  const formatTime = (time) => {
    return time < 10 ? '0' + time : time;
  }

  return (
    (histogramList !== undefined &&
      <div id="histogramContainer" style={{ width: '100%', background: "#FFFFFF", padding: '0px 0px' }}
        onMouseUp={onMouseUp} onMouseDown={onMouseDown} onMouseMove={onMouseMove} >
        <div style={{display:'flex', flexDirection:'row', justifyContent:'flex-start', alignItems:'center', flexWrap:'wrap', paddingTop:'4px', paddingBottom:'4px'}}>
          <div style={{marginLeft:'20px', minWidth:'180px'}}>
             <div className="timeText">{getTimeString(getEventTime(sliderPosition[2]))}</div>
          </div>
          <div style={{marginRight:'10px', minWidth:'150px'}}>
              <div className="treeCheckDiv" onClick={() => {setShowHistogram(!showHistogram)}}>
                    <img className="treeIcon" src={showHistogram? checkIcon : null} alt="" />
              </div>Histogram {currentHistogram !== -1 && currentHistogram}
            </div>
          {fractureData  &&
          <Fragment>
            <div style={{marginRight:'10px', minWidth:'150px'}}>
              <div className="treeCheckDiv" onClick={() => {setShowPress(!showPress)}}>
                  <img className="treeIcon" src={showPress? checkIcon : null} alt="" />
                  </div>Press {currentPress !== -1 && currentPress.toFixed(2)}
            </div>
            <div style={{marginRight:'10px', minWidth:'150px'}}>
              <div className="treeCheckDiv" onClick={() => {setShowSlurry(!showSlurry)}}>
                  <img className="treeIcon" src={showSlurry? checkIcon : null} alt="" />
                  </div>Slurry {currentSlurry !== -1 && currentSlurry.toFixed(2)}
            </div>
            <div style={{marginRight:'10px', minWidth:'150px'}}>
              <div className="treeCheckDiv" onClick={() => {setShowProppant(!showProppant)}}>
                  <img className="treeIcon" src={showProppant? checkIcon : null} alt="" />
                  </div>Proppant {currentProppant !== -1 && currentProppant.toFixed(2)}
            </div>
            </Fragment>}
        </div>

        <canvas id="histogramCanvas" width="2300" height="260" style={{ border: '1px solid #AAAAAA' }}>
        </canvas>

        <div className="flexContainer">
          <div className="flexLeft"><div className="timeText">{getTimeString(getEventTime(sliderPosition[0]))}</div></div>
          <div className="flexCenter">
            <Button style={{width: '90px', marginRight: '10px'}} variant="contained" color="default" size="small"
                    startIcon={<ReplayIcon />} onClick={reset} disabled={isPlaying} >Reset</Button>

            <Button style={{width: '90px'}} variant="contained" color="primary" size="small"
              startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              onClick={StartPlay}
            >
              {isPlaying ? "Pause" : "Play"}
            </Button>
          </div>
          <div className="flexRight"><div className="timeText">{getTimeString(getEventTime(sliderPosition[1]))}</div></div>
        </div>
      </div> 
    )
  )
}

export default HistogramComponent;
