import { textureType } from './sceneConsts';
import { ColorQuad } from './shape/colorQuad';
import { TextureQuad } from './shape/textureQuad';
import { Circle } from './shape/circle';
import { Triangle } from './shape/triangle';

import Sphere512PNG from '../textures/Sphere512.png';
import CompassHomePNG from '../textures/CompassHome.png';
import CompassTopPNG from '../textures/CompassTop.png';
import CompassNorthPNG from '../textures/CompassNorth.png';
import CompassSouthPNG from '../textures/CompassSouth.png';
import CompassEastPNG from '../textures/CompassEast.png';
import CompassWestPNG from '../textures/CompassWest.png';
import CompassRawPNG from '../textures/CompassRaw.png';
import CompassDipPNG from '../textures/CompassDip.png';

export function SceneInfo() {
    this.pickingEnabled = false;
    this.sceneCamera = null;
    this.textures = {};
    this.shaderProgram = null;
    this.textCanvasID='textCanvas1';
    this.visibleNodes = [];
    this.Magnitude = [0, 5];
    this.Confidence = [-5, 5];
    this.StartTime = 0;
    this.EndTime = 0;

    this.setEventMagnitude = function(eventMagnitude) {
      if (eventMagnitude !== null && eventMagnitude !== undefined) {
        this.Magnitude = eventMagnitude;
      }
    }

    this.setEventConfidence = function(eventConfidence) {
      if (eventConfidence !== null && eventConfidence !== undefined) {
        this.Confidence = eventConfidence;
      }
    }

    this.setVisibleNodes = function(visibleNodes) {
      if (visibleNodes !== null && visibleNodes !== undefined) {
        this.visibleNodes = visibleNodes;
      }
    }

    this.setEventTime = function(startTime, EndTime) {
      this.StartTime = startTime;
      this.EndTime = EndTime;
    }

    this.isVisible = function(id) {
      if (this.visibleNodes === null || this.visibleNodes === undefined || this.visibleNodes.length === 0) return true;
      return this.visibleNodes.find(a => a === id) !== undefined;
    }

    this.init = function(gl, shaderProgram, localTangentPlane) {
      this.gl = gl;
      this.shaderProgram = shaderProgram;
      this.localTangentPlane = localTangentPlane;

      this.vertexPositionAttribute = this.gl.getAttribLocation(shaderProgram, "aVertexPosition");
      this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
  
      this.vertexColorAttribute = this.gl.getAttribLocation(shaderProgram, "aVertexColor");
      this.vertexNormalAttribute = this.gl.getAttribLocation(shaderProgram, "aVertexNormal");
      this.vertexNormalAttribute2 = this.gl.getAttribLocation(shaderProgram, "aVertexNormal2");
      this.textureCoordAttribute = this.gl.getAttribLocation(shaderProgram, "aTextureCoord");
      this.textureCoordAttribute2 = this.gl.getAttribLocation(shaderProgram, "aTextureCoord2");
  
      this.pvMatrixUniform = this.gl.getUniformLocation(shaderProgram, "uPVMatrix");
      this.mMatrixUniform = this.gl.getUniformLocation(shaderProgram, "uModelMatrix");
      this.nMatrixUniform = this.gl.getUniformLocation(shaderProgram, "uNormalMatrix");
      this.lightDirectionUniform = this.gl.getUniformLocation(shaderProgram, "uLightDirection");
      this.drawModeVSUniform = this.gl.getUniformLocation(shaderProgram, "uDrawModeVS");
      this.drawModeFSUniform = this.gl.getUniformLocation(shaderProgram, "uDrawModeFS");
      this.lowColorFSUniform = this.gl.getUniformLocation(shaderProgram, "uLowColorFS");
      this.highColorFSUniform = this.gl.getUniformLocation(shaderProgram, "uHighColorFS");
      this.cosLengthUniform = this.gl.getUniformLocation(shaderProgram, "uCosLength");
      this.sinLengthUniform = this.gl.getUniformLocation(shaderProgram, "uSinLength"); 

      this.samplerUniform = shaderProgram.samplerUniform;

      this.initTextures();

      this.colorQuad = new ColorQuad(this);
      this.colorQuad.init();

      this.textureQuad = new TextureQuad(this);
      this.textureQuad.init();

      this.colorCircle = new Circle(this);
      this.colorCircle.init(64);

      this.colorTriangle = new Triangle(this);
      this.colorTriangle.init();
    }

    this.createSceneTexture = function(source, name) {
        let aTexture = this.gl.createTexture();
        aTexture.ready = false;
        aTexture.image = new Image();

        aTexture.image.onload = () => {
            this.handleLoadedTexture(this.gl, aTexture);
        }

        aTexture.image.src = source;
        this.textures[name] = aTexture;
    }

    this.handleLoadedTexture = function(gl, texture) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);    
      gl.bindTexture(gl.TEXTURE_2D, null);
      texture.ready = true;
  }    

  this.initTextures = function () {
      this.createSceneTexture(CompassHomePNG, textureType.compassHome); 
      this.createSceneTexture(CompassTopPNG, textureType.compassTop);
      this.createSceneTexture(CompassNorthPNG, textureType.compassNorth); 
      this.createSceneTexture(CompassSouthPNG, textureType.compassSouth);
      this.createSceneTexture(CompassEastPNG, textureType.compassEast); 
      this.createSceneTexture(CompassWestPNG, textureType.compassWest); 
      this.createSceneTexture(CompassRawPNG, textureType.compassRaw); 
      this.createSceneTexture(CompassDipPNG, textureType.compassDip); 
      this.createSceneTexture(Sphere512PNG, textureType.sphere); 

      let whiteTexture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, whiteTexture);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 64, 16, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);
      whiteTexture.ready = true;
      this.textures[textureType.white] = whiteTexture;
  }

}