import React, { useContext, Fragment } from "react";
import { Scene } from './scene';
import * as vec3 from './glMatrix/vec3';
import { controlType, LocalTangentPlane } from "./sceneConsts";
import { PetroContext } from '../context/petroContext';
import checkIcon from "./checkWhite.svg";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

class SceneComponent extends React.Component {
  static contextType = PetroContext;
  
  constructor(props) {
    super(props);

    this.containerRef = React.createRef();
    this.canvasRef = React.createRef();  

    this.initialized = false;
    this.pickedResult = null;
    this.isCameraFlying = false;
    this.flyStartTime = 0;
    this.LocalTangentPlane = null;

    this.state = { isMouseDown: -1, delta: 0, x: 0, y: 0, xDown: 0, yDown: 0, xUp: 0, yUp: 0,
                   pickedID : 0, pickObject: undefined,
                   clientWidth: 0, clientHeight: 0, showInfo: true, unit: 'foot' };

    this.handleMouseWheel = this.handleMouseWheel.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.onUnitChange = this.onUnitChange.bind(this);
  }

  updateCanvas() {
    const { dispatchAction } = this.context;

    if (!this.initialized && this.sceneData) {
      this.gl = this.canvasRef.current.getContext("webgl");
      if (!this.gl) {
        alert(
          "Unable to initialize WebGL. Your browser or machine may not support it."
        );
        return;
      }
  
      this.scene = new Scene();
      this.scene.init(this.gl, this.sceneData);

      this.LocalTangentPlane = new LocalTangentPlane();
      this.LocalTangentPlane.LT_init(this.scene.geoLocation.X, 
                                           this.scene.geoLocation.Y,
                                           this.scene.geoLocation.Z)

      dispatchAction({type:'SET_GEOLOCATION', data: this.scene.geoLocation});
      dispatchAction({type:'SET_TREEVIEW', data: this.scene.treeViewItems});
      dispatchAction({type:'SET_EVENTDATA', data: this.sceneData.EventGroup});
      
      this.initialized = true;      
    }

    if (this.initialized) {
        let width = this.containerRef.current.clientWidth;
        let height = this.containerRef.current.clientHeight;
        var canvas = this.canvasRef.current;
        canvas.width = width;
        canvas.height = height-4;

        if (this.state.showInfo) {
          var output = document.getElementById('sceneOutput');
          output.style.height = height-4;  
        }

        this.pickedResult = this.scene.pickObject(width, height-4, this.state.x, this.state.y);
        this.setState({ pickedID : this.pickedResult.PickedID,
                       pickObject: this.pickedResult.Renderable});
        
        if (this.pickedResult.Renderable !== null && this.pickedResult.Renderable !== undefined) {
          let output = [];
          this.pickedResult.Properties.forEach(m => {
            if (m.name === "MD" || m.name === "MD top" || m.name === "MD bottom" ||
                m.name === "East" || m.name === "North" || m.name === "Depth" || m.name === "Altitude") {
                  if (this.state.unit === 'meter') {
                    output.push({name: m.name, value: m.value + ' m'});
                  }
                  else {
                    output.push({name: m.name, value: (m.value * 3.2808399).toFixed(2) + ' ft'});
                  }
                }
            else {
              output.push({name: m.name, value: m.value});
            }
          })
          if (this.LocalTangentPlane !== null &&
            this.pickedResult.Position !== null && this.pickedResult.Position !== undefined) {
            let geoCoordinates = this.LocalTangentPlane.LT_LTP2LLA(this.pickedResult.Position[0], 
              -this.pickedResult.Position[2], 
              this.pickedResult.Position[1]);
              output.push({name: "Geo coordinate", value: ''});
              output.push({name: "Longitude", value: geoCoordinates[0].toFixed(8)});
              output.push({name: "Latitude", value: geoCoordinates[1].toFixed(8)});
              output.push({name: "Longitude", value: geoCoordinates[3]});
              output.push({name: "Latitude", value: geoCoordinates[4]});
              if (this.state.unit === 'meter') {
                output.push({name: "Altitude", value: geoCoordinates[2].toFixed(2) + ' m'});
              }
              else {
                output.push({name: "Altitude", value: (geoCoordinates[2] * 3.2808399).toFixed(2) + ' ft'});
              }
            }
          dispatchAction({type:'SET_OBJECTINFO_DATA', data: output})
        }
        else {
          dispatchAction({type:'SET_OBJECTINFO_DATA', data: []})
        }

        if (this.isCameraFlying) {
          let currentTime = new Date().getTime();
          if ((currentTime - this.flyStartTime) >= 1000) {
              this.isCameraFlying = false;
              this.scene.camera3D.fly(1.0);
          }
          else {
            this.scene.camera3D.fly((currentTime - this.flyStartTime) / 1000);
          }
        } 
        else if (this.state.isMouseDown === 1) {
          if (this.pickedResult.Control === controlType.NavigationZoomIn) {
            this.scene.camera3D.zoom(1);
          }
          else if (this.pickedResult.Control === controlType.NavigationZoomOut) {
            this.scene.camera3D.zoom(-1);
          }  
          else if (this.pickedResult.Control === controlType.NavigationLeft) {
            this.scene.camera3D.rotate(-2, 0);
          }
          else if (this.pickedResult.Control === controlType.NavigationRight) {
            this.scene.camera3D.rotate(2, 0);
          }
          else if (this.pickedResult.Control === controlType.NavigationBottom) {
            this.scene.camera3D.rotate(0, 2);
          }
          else if (this.pickedResult.Control === controlType.NavigationTop) {
            this.scene.camera3D.rotate(0, -2);
          }
        }     

        let { StartTime, EndTime, visibleItems, Magnitude, Confidence } = this.context;

        this.scene.sceneInfo.setEventTime(StartTime, EndTime);
        this.scene.sceneInfo.setVisibleNodes(visibleItems);
        this.scene.sceneInfo.setEventMagnitude(Magnitude);
        this.scene.sceneInfo.setEventConfidence(Confidence);
        this.scene.draw(width, height-4, this.state.unit === 'meter');      
    }
  }  
  
  componentDidUpdate(prevProps) {
    if (this.props.sceneData === prevProps.sceneData ) return;

    this.initialized = false;
    this.sceneData = this.props.sceneData;
    this.updateCanvas();

    this.timer = setInterval(() => {
      this.updateCanvas();
    }, 50);      
  }

  handleDoubleClick(evt) {
    if (this.pickedResult !== null && this.pickedResult.PickedID > 0 && this.pickedResult.Position !== null && this.pickedResult.Position !== undefined) {
      let flyDirection = vec3.create();
      vec3.sub(flyDirection, this.pickedResult.Position, this.scene.camera3D.camPosition);

      var flyDistance = vec3.length(flyDirection) / 2.0;

      vec3.normalize(flyDirection, flyDirection);
      vec3.scale(flyDirection, flyDirection, flyDistance);
      vec3.add(flyDirection, flyDirection, this.scene.camera3D.camPosition);

      this.flyStartTime = new Date().getTime();
      this.scene.camera3D.beginFlyTo(flyDirection, this.pickedResult.Position);
      this.isCameraFlying = true;      
    }
  }

  handleMouseWheel(evt) {
    this.setState({ delta: evt.deltaY });
    this.scene.camera3D.zoom(evt.deltaY);
  }

  handleMouseMove(evt) {
    let sceneRect = this.containerRef.current.getBoundingClientRect();
    let clientX = evt.clientX - sceneRect.left;
    let clientY = evt.clientY - sceneRect.top;
    
    if (this.state.isMouseDown === 1) {
      this.scene.camera3D.rotate(clientX - this.state.x, clientY - this.state.y);
    }
    this.setState({ x: clientX, y: clientY });
  }

  handleMouseDown(evt) {
    let sceneRect = this.containerRef.current.getBoundingClientRect();
    let clientX = evt.clientX - sceneRect.left;
    let clientY = evt.clientY - sceneRect.top;

    this.setState({ isMouseDown: 1, xDown: clientX, yDown: clientY, x: clientX, y: clientY });

    if (this.pickedResult !== null) {
      if (this.pickedResult.Control != null) {
        if (this.pickedResult.Control === controlType.CampassNorth) {
          this.scene.camera3D.beginFlyToDirection(0);
          this.flyStartTime = new Date().getTime();
          this.isCameraFlying = true; 
        }
        else if (this.pickedResult.Control === controlType.CampassEast) {
          this.scene.camera3D.beginFlyToDirection(1);
          this.flyStartTime = new Date().getTime();
          this.isCameraFlying = true; 
        }
        else if (this.pickedResult.Control === controlType.CampassSouth) {
          this.scene.camera3D.beginFlyToDirection(2);
          this.flyStartTime = new Date().getTime();
          this.isCameraFlying = true; 
        }
        else if (this.pickedResult.Control === controlType.CampassWest) {
          this.scene.camera3D.beginFlyToDirection(3);
          this.flyStartTime = new Date().getTime();
          this.isCameraFlying = true; 
        }
        else if (this.pickedResult.Control === controlType.CampassTop) {
          this.scene.camera3D.beginFlyToDirection(4);
          this.flyStartTime = new Date().getTime();
          this.isCameraFlying = true; 
        }
        else if (this.pickedResult.Control === controlType.NavigationHome) {
          this.scene.camera3D.beginFlyToHome();
          this.flyStartTime = new Date().getTime();
          this.isCameraFlying = true; 
        }
      }
      else if (this.pickedResult.Renderable !== null && this.pickedResult.IsLasLog === true ) {
        this.pickedResult.Renderable.onMouseClick();
      }
    }
  }

  handleMouseUp(evt) {
    let sceneRect = this.containerRef.current.getBoundingClientRect();
    let clientX = evt.clientX - sceneRect.left;
    let clientY = evt.clientY - sceneRect.top;

    this.setState({ isMouseDown: -1, xUp: clientX, yUp: clientY });
  }

  onUnitChange(evt) {
    this.setState({unit: evt.target.value});
    this.context.dispatchAction({type:'SET_UNIT', data:evt.target.value})
  }

  render() {
    const {isLoading, loadingError, objectInfo } = this.context;     

    return (
      <div ref={this.containerRef} style={{background:'#DDDDDD', height:'100%', position:'relative'}} >
        <canvas ref={this.canvasRef}
          onDoubleClick={this.handleDoubleClick}
          onWheel={this.handleMouseWheel}
          onMouseMove={this.handleMouseMove}
          onMouseDown={this.handleMouseDown}
          onMouseUp={this.handleMouseUp}         
        />

        { this.state.showInfo && 
        <div id="sceneOutput" ref="sceneOutput" style={{position:'absolute', top:'42px', left: '0px', color:'white', width:'200px', backgroundColor:'#44444488'}} 
            onWheel={this.handleMouseWheel} onMouseMove={this.handleMouseMove} onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp} >
            <div style={{paddingTop:'0px'}}>
            { objectInfo !== null &&
                objectInfo.map((item, index) => {
                  return <Fragment key={index}>{item.value === '' ? 
                    <div style={{backgroundColor:'#0000FF88'}}>{item.name}</div> : 
                    <div>{item.name} {item.value}</div>
                  }</Fragment>
                })
            }
            </div>
        </div>
        }

        <div style={{position:'absolute', top:'0px', left: '0px', color:'white'}} 
            onWheel={this.handleMouseWheel} onMouseMove={this.handleMouseMove} onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp} >
            <canvas id="textCanvas1" style={{border: "none", display: "none"}} width="64" height="24"></canvas>
            <div style={{margin:'1px', color: "#FFFFFF", display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#929292a2'}}>
                <div style={{ width: '20px', height: '20px', padding: '0px', display: 'inline-block', border: '1px solid #FFFFFF'}} onClick={() => {this.setState({showInfo: !this.state.showInfo})}}>
                    {this.state.showInfo ? <img style={{width: '18px', height: '18px'}} src={checkIcon} alt="icon" /> : null}
                </div>
                <RadioGroup
                  row
                  aria-labelledby="demo-row-radio-buttons-group-label"
                  name="row-radio-buttons-group"
                  value={this.state.unit}
                  onChange={this.onUnitChange}
                >
                  <FormControlLabel value="foot" control={<Radio />} label="Feet" />
                  <FormControlLabel value="meter" control={<Radio />} label="Meters" />
                </RadioGroup>
            </div>
        </div>

        <div style={{position:'absolute', bottom:'0px', left: '0px', color:'white'}} 
            onWheel={this.handleMouseWheel} onMouseMove={this.handleMouseMove} onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp} >
              <div style={{margin:'4px'}}>
                { this.sceneData !== null && this.sceneData !== undefined && this.state.unit === 'meter' &&
                    <span>Grid size: {this.sceneData.GridSizeMeter} m</span>
                }
                { this.sceneData !== null && this.sceneData !== undefined && this.state.unit !== 'meter' &&
                    <span>Grid size: {this.sceneData.GridSizeFoot} ft</span>
                }
              </div>
        </div>

        { isLoading &&
        <div style={{position:'absolute', top:'0px', left: '0px', width: "100%", height: "100%",
                    color:'white', backgroundColor: "#000000", display: "flex", 
                    justifyContent: "center", alignItems: "center"}} >
             <div>
             <h2>Loading</h2>
             </div>
        </div>
        }
        { loadingError &&
        <div style={{position:'absolute', top:'0px', left: '0px', width: "100%", height: "100%",
                    color:'white', backgroundColor: "#000000", display: "flex", 
                    justifyContent: "center", alignItems: "center"}} >
             <div>
             <h2>Fail to load the data</h2>
             </div>
        </div>
        } 
      </div>
    );
  }
}

const SceneComponentEx = () => {
  const { sceneData } = useContext(PetroContext)

  return (
    <SceneComponent sceneData={sceneData} />
  )
}

export default SceneComponentEx;


