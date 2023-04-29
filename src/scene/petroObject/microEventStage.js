import * as mat4 from '../glMatrix/mat4';
import * as vec3 from '../glMatrix/vec3';

import { ShaderType, HighlightColor, getUniqueID, ConvertIDToColor, textureType, getTimeString } from '../sceneConsts';

export function SE_StageEvents(inSceneInfo) {
    this.sceneInfo = inSceneInfo;
    this.gl = inSceneInfo.gl;
    this.pickedIndex = -1;

    var eventDataList = [];
    var stageColor = [1, 0, 0];

    this.init = function (name, id, color) {
        this.name = name;
        this.id = id;
        stageColor = color;
    }

    this.updateEventSize = function() {
        var vertexTextures = [];
        var indexTexture = 0;

        for (var i = 0; i < eventDataList.length; i++) {
            var eSize = GetEventSize(eventDataList[i]);
            vertexTextures[indexTexture] = eSize;
            vertexTextures[indexTexture + 1] = eSize;

            indexTexture += 2;

            vertexTextures[indexTexture] = eSize;
            vertexTextures[indexTexture + 1] = eSize;

            indexTexture += 2;

            vertexTextures[indexTexture] = eSize;
            vertexTextures[indexTexture + 1] = eSize;

            indexTexture += 2;
        }

        this.vertexTextureBuffer2 = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureBuffer2);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexTextures), this.gl.STATIC_DRAW);
        this.vertexTextureBuffer2.itemSize = 2;
        this.vertexTextureBuffer2.numItems = vertexTextures.length / 2;
    }
    
    this.updateEventVisible = function()
    {      
        var vertexTextures = [];
        var indexTexture = 0;

        for (var i = 0; i < eventDataList.length; i++) {
            var vSize = GetEventSize(eventDataList[i]);

            if (this.sceneInfo.StartTime !== 0 && this.sceneInfo.EndTime !== 0) {
                if (eventDataList[i].EventTime < this.sceneInfo.StartTime || 
                    eventDataList[i].EventTime > this.sceneInfo.EndTime ||
                    eventDataList[i].Magnitude < this.sceneInfo.Magnitude[0] ||
                    eventDataList[i].Magnitude > this.sceneInfo.Magnitude[1] ||
                    eventDataList[i].Confidence < this.sceneInfo.Confidence[0] ||
                    eventDataList[i].Confidence > this.sceneInfo.Confidence[1]
                    )
                    {
                        vSize = 0;
                    }
            }

            vertexTextures[indexTexture] = vSize;
            vertexTextures[indexTexture + 1] = vSize;

            indexTexture += 2;

            vertexTextures[indexTexture] = vSize;
            vertexTextures[indexTexture + 1] = vSize;

            indexTexture += 2;

            vertexTextures[indexTexture] = vSize;
            vertexTextures[indexTexture + 1] = vSize;

            indexTexture += 2;
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureBuffer2);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexTextures), this.gl.STATIC_DRAW);
    }

    this.setupEventBuffer = function(dataList) {
        var vertexPositions = [];
        var vertexNormals = [];
        var vertexColors = [];
        var vertexTextures = [];
        var indexPosition = 0;
        var indexTexture = 0;
        var indexColor = 0;

        eventDataList = dataList;

        this.pickingID = getUniqueID(dataList.length);
        this.pickingEndID = this.pickingID + dataList.length;

        for (var i = 0; i < dataList.length; i++) {
            vertexPositions[indexPosition] = -0.866025;
            vertexPositions[indexPosition + 1] = -0.5;
            vertexPositions[indexPosition + 2] = 0;

            vertexNormals[indexPosition] = dataList[i].Position[0];
            vertexNormals[indexPosition + 1] = dataList[i].Position[1];
            vertexNormals[indexPosition + 2] = dataList[i].Position[2];

            vertexTextures[indexTexture] = -0.366025;
            vertexTextures[indexTexture + 1] = 1;

            var color = ConvertIDToColor(this.pickingID + i);
            eventDataList[i].Color = color;

            vertexColors[indexColor] = color[0];
            vertexColors[indexColor + 1] = color[1];
            vertexColors[indexColor + 2] = color[2];

            indexPosition += 3;
            indexTexture += 2;
            indexColor += 3;

            vertexPositions[indexPosition] = 0;
            vertexPositions[indexPosition + 1] = 1;
            vertexPositions[indexPosition + 2] = 0;

            vertexNormals[indexPosition] = dataList[i].Position[0];
            vertexNormals[indexPosition + 1] = dataList[i].Position[1];
            vertexNormals[indexPosition + 2] = dataList[i].Position[2];

            vertexTextures[indexTexture] = 0.5;
            vertexTextures[indexTexture + 1] = -0.5;

            vertexColors[indexColor] = color[0];
            vertexColors[indexColor + 1] = color[1];
            vertexColors[indexColor + 2] = color[2];

            indexPosition += 3;
            indexTexture += 2;
            indexColor += 3;

            vertexPositions[indexPosition] = 0.866025;
            vertexPositions[indexPosition + 1] = -0.5;
            vertexPositions[indexPosition + 2] = 0;

            vertexNormals[indexPosition] = dataList[i].Position[0];
            vertexNormals[indexPosition + 1] = dataList[i].Position[1];
            vertexNormals[indexPosition + 2] = dataList[i].Position[2];

            vertexTextures[indexTexture] = 1.366025;
            vertexTextures[indexTexture + 1] = 1.0;

            vertexColors[indexColor] = color[0];
            vertexColors[indexColor + 1] = color[1];
            vertexColors[indexColor + 2] = color[2];

            indexPosition += 3;
            indexTexture += 2;
            indexColor += 3;
        }

        this.vertexPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexPositions), this.gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = vertexPositions.length / 3;

        this.vertexNormalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexNormals), this.gl.STATIC_DRAW);
        this.vertexNormalBuffer.itemSize = 3;
        this.vertexNormalBuffer.numItems = vertexNormals.length / 3;

        this.vertexTextureBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexTextures), this.gl.STATIC_DRAW);
        this.vertexTextureBuffer.itemSize = 2;
        this.vertexTextureBuffer.numItems = vertexTextures.length / 2;

        this.vertexColorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexColors), this.gl.STATIC_DRAW);
        this.vertexColorBuffer.itemSize = 3;
        this.vertexColorBuffer.numItems = vertexColors.length / 3;
        
        this.updateEventSize();
    }

    this.draw = function () {
        if (!this.sceneInfo.isVisible(this.id))  return;

        this.updateEventVisible();

        var forward = [0, 0, 1];

        var angle = vec3.dot(forward, this.sceneInfo.sceneCamera.lookAt);
        angle = Math.acos(angle);
        
        var cross = vec3.create();
        vec3.cross(cross, forward, this.sceneInfo.sceneCamera.lookAt);

        var mMatrix = mat4.create();
        mat4.identity(mMatrix);

        mat4.rotate(mMatrix, mMatrix, angle, cross);

        this.gl.uniformMatrix4fv(this.sceneInfo.mMatrixUniform, false, mMatrix);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.sceneInfo.textures[textureType.sphere]);
        this.gl.uniform1i(this.sceneInfo.samplerUniform, 0);

        this.gl.enableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);
        this.gl.enableVertexAttribArray(this.sceneInfo.textureCoordAttribute);
        this.gl.enableVertexAttribArray(this.sceneInfo.textureCoordAttribute2);
        this.gl.enableVertexAttribArray(this.sceneInfo.vertexColorAttribute);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexNormalAttribute, this.vertexNormalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.textureCoordAttribute, this.vertexTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureBuffer2);
        this.gl.vertexAttribPointer(this.sceneInfo.textureCoordAttribute2, this.vertexTextureBuffer2.itemSize, this.gl.FLOAT, false, 0, 0);

        if (this.sceneInfo.pickingEnabled) {
            this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderColorEventInstancing);
            this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderColorEventInstancing);

            this.gl.enableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexColorBuffer);
            this.gl.vertexAttribPointer(this.sceneInfo.vertexColorAttribute, this.vertexColorBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        }
        else 
        {
            this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderEventInstancing);
            this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderEventInstancing);

            this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
            this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, stageColor[0], stageColor[1], stageColor[2]);
        }

        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexPositionBuffer.numItems);

        if (!this.sceneInfo.pickingEnabled && this.pickedIndex !== -1) {
            this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderEventInstancing);
            this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderEventInstancing);

            this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);

            this.gl.depthFunc(this.gl.LEQUAL);
            this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, HighlightColor[0], HighlightColor[1], HighlightColor[2]);
            this.gl.drawArrays(this.gl.TRIANGLES, this.pickedIndex * 3, 3);
            this.gl.depthFunc(this.gl.LESS);
        }

        this.gl.disableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);
        this.gl.disableVertexAttribArray(this.sceneInfo.textureCoordAttribute);
        this.gl.disableVertexAttribArray(this.sceneInfo.textureCoordAttribute2);
        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);

        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderDefaut);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderDefaut);
    };

    this.tryPicking = function(pickedID, pickResult) {
        this.pickedIndex = -1;        
        if (pickResult.Status !== 0) return;

        if (pickedID >= this.pickingID && pickedID < this.pickingEndID) {
            this.pickedIndex = pickedID - this.pickingID;
            let selectedEvent = eventDataList[this.pickedIndex];

            pickResult.Status = 1;
            pickResult.Position = selectedEvent.Position;
            pickResult.Renderable = this;

            let Properties = [];
            if (pickResult.Position !== null && pickResult.Position !== undefined) {
                Properties.push({name: 'Object', value: ''});
                Properties.push({name: "SeismicEvent", value: this.name});
                Properties.push({name: "Magnitude", value: selectedEvent.Magnitude.toFixed(2)});
                Properties.push({name: "Confidence", value: selectedEvent.Confidence.toFixed(2)});
                Properties.push({name: "Time", value: getTimeString(selectedEvent.EventTime)});
                Properties.push({name: 'Local coordinate', value: ''});
                Properties.push({name: 'East', value: pickResult.Position[0].toFixed(2)});
                Properties.push({name: 'North', value: -pickResult.Position[2].toFixed(2)});
                Properties.push({name: 'Depth', value: pickResult.Position[1].toFixed(2)});
            }

            pickResult.Properties = Properties;              
            return;
        }
        pickResult.Status = 0;
    };    
}

export function EventItem(Position, Magnitude, Confidence, EventTime) {
    this.Position = Position;
    this.Magnitude = Magnitude;
    this.Confidence = Confidence;
    this.EventTime = EventTime;
};

var eventMaxSize = 40;
var eventMinSize = 4;

function GetEventSize(eData) {
    return eventMinSize + (eData.Magnitude + 5) / 10 * (eventMaxSize - eventMinSize);    
}