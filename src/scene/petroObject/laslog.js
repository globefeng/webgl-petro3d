import * as mat4 from '../glMatrix/mat4';
import * as vec3 from '../glMatrix/vec3';

import { ShaderType, HighlightColor, getUniqueID, ConvertIDToColor } from '../sceneConsts';

export function LasLog(sceneInfo) {
    this.sceneInfo = sceneInfo;
    this.gl = sceneInfo.gl;

    this.visible = true;

    this.lasData = null;
    this.lasDataArray = [];
    this.pickedMD = -1;
    this.pickIndex = -1;
    this.logBase = 10;
    this.logSize = 50;

    this.angle = 0;
    this.rotating = true;

    this.init = function (wellbore, lasData) {
        this.name = '';
        this.unit = '';
        this.wellbore = wellbore;
        this.id = lasData.id;
        this.lasData = lasData;
 
        this.pickingID = getUniqueID(1);
        this.pickingColor = ConvertIDToColor(this.pickingID);

        this.minMD = Number.MAX_VALUE;
        this.maxMD = Number.MIN_VALUE;
    };

    this.tryPicking = function (pickedID, pickResult) {
        if (pickResult.Status !== 0) return;

        this.pickedMD = -1;
        this.pickIndex = -1;
        
        if (this.pickingID === pickedID) {
            pickResult.Status = 2;
            pickResult.Renderable = this;
            return;
        }
    }

    this.pickFinal = function(ratio, pickResult) {
        this.pickedMD = this.minMD + (this.maxMD - this.minMD) * ratio;

        if (this.pickedMD < this.lasDataArray[0].MD || this.pickedMD > this.lasDataArray[this.lasDataArray.length - 1].MD) {
            return;
        }

        for (var i = 0; i < this.lasDataArray.length - 1; i++) {
            if (this.pickedMD === this.lasDataArray[i].MD) {
                this.pickIndex = i;
                break;
            }
            else if (this.pickedMD === this.lasDataArray[i + 1].MD) {
                this.pickIndex = i + 1;
                break;
            }
            else if (this.pickedMD > this.lasDataArray[i].MD && this.pickedMD < this.lasDataArray[i + 1].MD) {
                if ((this.pickedMD - this.lasDataArray[i].MD) < (this.lasDataArray[i + 1].MD - this.pickedMD)) {
                    this.pickIndex = i;
                }
                else {
                    this.pickIndex = i + 1;
                }
                break;
            }
        }

        pickResult.Status = 1;
        pickResult.Position = null;
        pickResult.Renderable = this;
        pickResult.IsLasLog = true;

        let Properties = [];

        Properties.push({name: 'Object', value: ''});
        Properties.push({name: "Las", value: this.name});
        Properties.push({name: "MD", value: this.lasDataArray[this.pickIndex].MD.toFixed(2)});
        Properties.push({name: "Data", value: this.lasDataArray[this.pickIndex].Data.toFixed(2) + ' ' + this.unit});

        pickResult.Properties = Properties; 
    }

    this.onMouseClick = function() {
        this.rotating = !this.rotating;
    }

    this.setData = function(lasData) {
        this.lasData = lasData;
    }

    this.addData = function(lasDataCollection) {
        this.lasDataArray = lasDataCollection;

        for (var i = 0; i < this.lasDataArray.length; i++) {
            if (this.lasDataArray[i].MD < this.minMD) this.minMD = this.lasDataArray[i].MD;
            if (this.lasDataArray[i].MD > this.maxMD) this.maxMD = this.lasDataArray[i].MD;
        }
    }

    this.changeChannel = function(name) {
        if (this.lasData === null || this.lasData === undefined ||
            this.lasData.CurveDataList === null || this.lasData.CurveDataList === undefined) return null;

        let curveData = null;  
        let curveName = ''; 
        for(var i = 0; i < this.lasData.CurveDataList.length; i++) {
            if (this.lasData.CurveDataList[i].Name === name) {
                curveData = this.lasData.CurveDataList[i];
                curveName = this.lasData.CurveDataList[i].Name;        
                break;
            }            
        }
        if (curveData === null) {
            curveData = this.lasData.CurveDataList[0];  
            curveName = this.lasData.CurveDataList[0].Name;        
        }

        var lasDataCollection = [];

        for (var kk = 0; kk < this.lasData.DepthList.length; kk++) {
            lasDataCollection.push(new LasData(this.lasData.DepthList[kk], curveData.DataList[kk]));
        }

        this.addData(lasDataCollection);
        this.updateBuffer(0, curveData.MaxValue);

        this.name = curveName;
        this.unit = curveData.Unit;
        return curveName;
    }

    this.disposeBuffer = function() {
        if (this.vertexPositionBuffer !== undefined && this.vertexPositionBuffer !== null) {
            this.gl.deleteBuffer(this.vertexPositionBuffer);
        }
        if (this.vertexNormalEastBuffer !== undefined && this.vertexNormalEastBuffer !== null) {
            this.gl.deleteBuffer(this.vertexNormalEastBuffer);
        }
        if (this.vertexNormalNorthBuffer !== undefined && this.vertexNormalNorthBuffer !== null) {
            this.gl.deleteBuffer(this.vertexNormalNorthBuffer);
        }
        if (this.vertexTextureBuffer !== undefined && this.vertexTextureBuffer !== null) {
            this.gl.deleteBuffer(this.vertexTextureBuffer);
        }
        if (this.vertexTextureBuffer2 !== undefined && this.vertexTextureBuffer2 !== null) {
            this.gl.deleteBuffer(this.vertexTextureBuffer2);
        }
    }

    this.updateBuffer = function(minData, maxData) {
        this.disposeBuffer();

        this.minData = minData;
        this.maxData = maxData;
        this.logFullSize = this.logBase + this.logSize;

        var vertexPositions = [];
        var vertexNormalsEast = [];
        var vertexNormalsNorth = [];
        var vertexTextures = [];
        var vertexTextures2 = [];
        var indexPosition = 0;
        var indexTexture = 0;

        for (var ii = 0; ii < this.lasDataArray.length; ii++) {
            this.lasDataArray[ii].position = this.wellbore.getPosition(this.lasDataArray[ii].MD);
        }

        for (var i = 0; i < this.lasDataArray.length - 1; i++) {
            if (this.lasDataArray[i].position === this.lasDataArray[i + 1].position) continue;

            var m = this.wellbore.getNormalMatrix(this.wellbore.radius, this.lasDataArray[i].position, this.lasDataArray[i + 1].position);

            let vNormalEast = vec3.create();
            vec3.transformMat4(vNormalEast, [1, 0, 0], m);
            vec3.normalize(vNormalEast, vNormalEast);
            this.lasDataArray[i].normalEast = vNormalEast;

            let vNormalNorth = vec3.create();
            vec3.transformMat4(vNormalNorth, [0, 0, -1], m);
            vec3.normalize(vNormalNorth, vNormalNorth);
            this.lasDataArray[i].normalNorth = vNormalNorth;

            if (i === 0) {
                vertexPositions[indexPosition] = this.lasDataArray[i].position[0];
                vertexPositions[indexPosition + 1] = this.lasDataArray[i].position[1];
                vertexPositions[indexPosition + 2] = this.lasDataArray[i].position[2];

                vertexNormalsEast[indexPosition] = vNormalEast[0];
                vertexNormalsEast[indexPosition + 1] = vNormalEast[1];
                vertexNormalsEast[indexPosition + 2] = vNormalEast[2];

                vertexNormalsNorth[indexPosition] = vNormalNorth[0];
                vertexNormalsNorth[indexPosition + 1] = vNormalNorth[1];
                vertexNormalsNorth[indexPosition + 2] = vNormalNorth[2];

                if (this.lasDataArray[i].Data < 0) {
                    vertexTextures[indexTexture] = -this.wellbore.radius / this.logFullSize;
                    vertexTextures[indexTexture + 1] = (-this.lasDataArray[i].Data - this.minData) / (this.maxData - this.minData);
                }
                else {
                    vertexTextures[indexTexture] = this.wellbore.radius / this.logFullSize;
                    vertexTextures[indexTexture + 1] = (this.lasDataArray[i].Data - this.minData) / (this.maxData - this.minData);
                }

                vertexTextures2[indexTexture] = (this.lasDataArray[i].MD - this.minMD) / (this.maxMD - this.minMD);
                vertexTextures2[indexTexture + 1] = (this.lasDataArray[i].MD - this.minMD) / (this.maxMD - this.minMD);

                indexPosition += 3;
                indexTexture += 2;

                vertexPositions[indexPosition] = this.lasDataArray[i].position[0];
                vertexPositions[indexPosition + 1] = this.lasDataArray[i].position[1];
                vertexPositions[indexPosition + 2] = this.lasDataArray[i].position[2];

                vertexNormalsEast[indexPosition] = vNormalEast[0];
                vertexNormalsEast[indexPosition + 1] = vNormalEast[1];
                vertexNormalsEast[indexPosition + 2] = vNormalEast[2];

                vertexNormalsNorth[indexPosition] = vNormalNorth[0];
                vertexNormalsNorth[indexPosition + 1] = vNormalNorth[1];
                vertexNormalsNorth[indexPosition + 2] = vNormalNorth[2];

                var tu;
                if (this.lasDataArray[i].Data < 0) {
                    tu = (-this.lasDataArray[i].Data - this.minData) / (this.maxData - this.minData);
                    vertexTextures[indexTexture] = -(tu * this.logSize + this.logBase) / this.logFullSize;
                }
                else {
                    tu = (this.lasDataArray[i].Data - this.minData) / (this.maxData - this.minData);
                    vertexTextures[indexTexture] = (tu * this.logSize + this.logBase) / this.logFullSize;
                }
                vertexTextures[indexTexture + 1] = tu;

                vertexTextures2[indexTexture] = (this.lasDataArray[i].MD - this.minMD) / (this.maxMD - this.minMD);
                vertexTextures2[indexTexture + 1] = (this.lasDataArray[i].MD - this.minMD) / (this.maxMD - this.minMD);

                indexPosition += 3;
                indexTexture += 2;
            }
            vertexPositions[indexPosition] = this.lasDataArray[i + 1].position[0];
            vertexPositions[indexPosition + 1] = this.lasDataArray[i + 1].position[1];
            vertexPositions[indexPosition + 2] = this.lasDataArray[i + 1].position[2];

            vertexNormalsEast[indexPosition] = vNormalEast[0];
            vertexNormalsEast[indexPosition + 1] = vNormalEast[1];
            vertexNormalsEast[indexPosition + 2] = vNormalEast[2];

            vertexNormalsNorth[indexPosition] = vNormalNorth[0];
            vertexNormalsNorth[indexPosition + 1] = vNormalNorth[1];
            vertexNormalsNorth[indexPosition + 2] = vNormalNorth[2];

            if (this.lasDataArray[i + 1].Data < 0) {
                vertexTextures[indexTexture] = -this.wellbore.radius / this.logFullSize;
                vertexTextures[indexTexture + 1] = (-this.lasDataArray[i + 1].Data - this.minData) / (this.maxData - this.minData);
            }
            else {
                vertexTextures[indexTexture] = this.wellbore.radius / this.logFullSize;
                vertexTextures[indexTexture + 1] = (this.lasDataArray[i + 1].Data - this.minData) / (this.maxData - this.minData);
            }

            vertexTextures2[indexTexture] = (this.lasDataArray[i + 1].MD - this.minMD) / (this.maxMD - this.minMD);
            vertexTextures2[indexTexture + 1] = (this.lasDataArray[i + 1].MD - this.minMD) / (this.maxMD - this.minMD);

            indexPosition += 3;
            indexTexture += 2;

            vertexPositions[indexPosition] = this.lasDataArray[i + 1].position[0];
            vertexPositions[indexPosition + 1] = this.lasDataArray[i + 1].position[1];
            vertexPositions[indexPosition + 2] = this.lasDataArray[i + 1].position[2];

            vertexNormalsEast[indexPosition] = vNormalEast[0];
            vertexNormalsEast[indexPosition + 1] = vNormalEast[1];
            vertexNormalsEast[indexPosition + 2] = vNormalEast[2];

            vertexNormalsNorth[indexPosition] = vNormalNorth[0];
            vertexNormalsNorth[indexPosition + 1] = vNormalNorth[1];
            vertexNormalsNorth[indexPosition + 2] = vNormalNorth[2];

            var tu2;
            if (this.lasDataArray[i + 1].Data < 0) {
                tu2 = (-this.lasDataArray[i + 1].Data - this.minData) / (this.maxData - this.minData);
                vertexTextures[indexTexture] = -(tu2 * this.logSize + this.logBase) / this.logFullSize;;
            }
            else {
                tu2 = (this.lasDataArray[i + 1].Data - this.minData) / (this.maxData - this.minData);
                vertexTextures[indexTexture] = (tu2 * this.logSize + this.logBase) / this.logFullSize;;
            }
            vertexTextures[indexTexture + 1] = tu2;

            vertexTextures2[indexTexture] = (this.lasDataArray[i + 1].MD - this.minMD) / (this.maxMD - this.minMD);
            vertexTextures2[indexTexture + 1] = (this.lasDataArray[i + 1].MD - this.minMD) / (this.maxMD - this.minMD);

            indexPosition += 3;
            indexTexture += 2;
        }

        this.vertexPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexPositions), this.gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = vertexPositions.length / 3;

        this.vertexNormalEastBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexNormalEastBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexNormalsEast), this.gl.STATIC_DRAW);
        this.vertexNormalEastBuffer.itemSize = 3;
        this.vertexNormalEastBuffer.numItems = vertexNormalsEast.length / 3;

        this.vertexNormalNorthBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexNormalNorthBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexNormalsNorth), this.gl.STATIC_DRAW);
        this.vertexNormalNorthBuffer.itemSize = 3;
        this.vertexNormalNorthBuffer.numItems = vertexNormalsNorth.length / 3;

        this.vertexTextureBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexTextures), this.gl.STATIC_DRAW);
        this.vertexTextureBuffer.itemSize = 2;
        this.vertexTextureBuffer.numItems = vertexTextures.length / 2;

        this.vertexTextureBuffer2 = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureBuffer2);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexTextures2), this.gl.STATIC_DRAW);
        this.vertexTextureBuffer2.itemSize = 2;
        this.vertexTextureBuffer2.numItems = vertexTextures2.length / 2;
    };

    this.draw = function () {
        if (!this.sceneInfo.isVisible(this.id))  return;

        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderLasLog);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderLasLog);
        if (this.sceneInfo.pickingEnabled) {
            this.gl.uniform3f(this.sceneInfo.lowColorFSUniform, this.pickingColor[0], this.pickingColor[1], this.pickingColor[2]);
            this.gl.uniform3f(this.sceneInfo.highColorFSUniform, this.pickingColor[0], this.pickingColor[1], this.pickingColor[2]);
        }
        else {
            this.gl.uniform3f(this.sceneInfo.lowColorFSUniform, 0, 0, 1);
            this.gl.uniform3f(this.sceneInfo.highColorFSUniform, 1, 0, 0);
        }

        this.drawLasScene();

        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderDefaut);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderDefaut);

        if (this.pickedMD > 0 && !this.sceneInfo.pickingEnabled) {
            this.drawPickingInfo(this.pickedMD);
        }
    };

    this.drawIndex = function(index) {
        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderLasLogDetail);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderColorRatio);

        this.drawLasScene();

        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderDefaut);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderDefaut);
    }

    this.drawLasScene = function() {
        if (this.rotating) {
            this.angle += Math.PI / 180;
        }
        
        var mMatrix = mat4.create();
        mat4.identity(mMatrix);
        this.gl.uniformMatrix4fv(this.sceneInfo.mMatrixUniform, false, mMatrix);

        this.gl.uniform1f(this.sceneInfo.cosLengthUniform, this.logFullSize * Math.cos(this.angle));
        this.gl.uniform1f(this.sceneInfo.sinLengthUniform, this.logFullSize * Math.sin(this.angle));

        this.gl.enableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);
        this.gl.enableVertexAttribArray(this.sceneInfo.vertexNormalAttribute2);
        this.gl.enableVertexAttribArray(this.sceneInfo.textureCoordAttribute);
        this.gl.enableVertexAttribArray(this.sceneInfo.textureCoordAttribute2);
        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexNormalEastBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexNormalAttribute, this.vertexNormalEastBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexNormalNorthBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexNormalAttribute2, this.vertexNormalNorthBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.textureCoordAttribute, this.vertexTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureBuffer2);
        this.gl.vertexAttribPointer(this.sceneInfo.textureCoordAttribute2, this.vertexTextureBuffer2.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertexPositionBuffer.numItems);

        this.gl.disableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);
        this.gl.disableVertexAttribArray(this.sceneInfo.vertexNormalAttribute2);
        this.gl.disableVertexAttribArray(this.sceneInfo.textureCoordAttribute);
        this.gl.disableVertexAttribArray(this.sceneInfo.textureCoordAttribute2);
    };

    this.drawPickingInfo = function(distance) {
        if (distance < this.lasDataArray[0].MD || distance > this.lasDataArray[this.lasDataArray.length - 1].MD) {
            return;
        }

        var pPosition;
        var pData;
        var pNormalEast;
        var pNormalNorth;
        var pNormalDirection;

        for (var i = 0; i < this.lasDataArray.length - 1; i++) {
            if (distance === this.lasDataArray[i].MD) {
                pPosition = this.lasDataArray[i].position;
                pData = this.lasDataArray[i].Data;
                pNormalEast = this.lasDataArray[i].normalEast;
                pNormalNorth = this.lasDataArray[i].normalNorth;
                pNormalDirection = vec3.create();
                vec3.subtract(pNormalDirection, this.lasDataArray[i + 1].position, this.lasDataArray[i].position);
                vec3.normalize(pNormalDirection, pNormalDirection);
                break;
            }
            else if (distance === this.lasDataArray[i + 1].MD) {
                pPosition = this.lasDataArray[i + 1].position;
                pData = this.lasDataArray[i + 1].Data;
                pNormalEast = this.lasDataArray[i].normalEast;
                pNormalNorth = this.lasDataArray[i].normalNorth;
                pNormalDirection = vec3.create();
                vec3.subtract(pNormalDirection, this.lasDataArray[i + 1].position, this.lasDataArray[i].position);
                vec3.normalize(pNormalDirection, pNormalDirection);
                break;
            }
            else if (distance > this.lasDataArray[i].MD && distance < this.lasDataArray[i + 1].MD) {
                if ((distance - this.lasDataArray[i].MD) < (this.lasDataArray[i + 1].MD - distance)) {
                    pPosition = this.lasDataArray[i].position;
                    pData = this.lasDataArray[i].Data;
                }
                else {
                    pPosition = this.lasDataArray[i + 1].position
                    pData = this.lasDataArray[i + 1].Data;
                }
                pNormalEast = this.lasDataArray[i].normalEast;
                pNormalNorth = this.lasDataArray[i].normalNorth;
                pNormalDirection = vec3.create();
                vec3.subtract(pNormalDirection, this.lasDataArray[i + 1].position, this.lasDataArray[i].position);
                vec3.normalize(pNormalDirection, pNormalDirection);
                break;
            }
        }

        var length;
        if (pData < 0) {
            length = (-pData - this.minData) / (this.maxData - this.minData);
            length = -(length * this.logSize + this.logBase);
        }
        else {
            length = (pData - this.minData) / (this.maxData - this.minData);
            length = length * this.logSize + this.logBase;
        }


        var nEast = vec3.create();
        vec3.scale(nEast, pNormalEast, Math.cos(this.angle));

        var nNorth = vec3.create();
        vec3.scale(nNorth, pNormalNorth, Math.sin(this.angle));

        vec3.add(nEast, nEast, nNorth);
        vec3.normalize(nEast, nEast);

        var v1 = vec3.create();
        vec3.scale(v1, nEast, length);
        vec3.add(v1, pPosition, v1);

        var v2 = vec3.create();
        if (length > 0) {
            vec3.scale(v2, nEast, length + 40);
        }
        else {
            vec3.scale(v2, nEast, length - 40);
        }
        vec3.add(v2, pPosition, v2);

        var v3 = vec3.create();
        vec3.scale(v3, pNormalDirection, -10);
        vec3.add(v3, v2, v3);

        var v4 = vec3.create();
        vec3.scale(v4, pNormalDirection, 10);
        vec3.add(v4, v2, v4);

        var vPositions = [];

        vPositions[0] = v1[0];
        vPositions[1] = v1[1];
        vPositions[2] = v1[2];

        vPositions[3] = v3[0];
        vPositions[4] = v3[1];
        vPositions[5] = v3[2];

        vPositions[6] = v4[0];
        vPositions[7] = v4[1];
        vPositions[8] = v4[2];

        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderColorOnly);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderColorOnly);
        this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, HighlightColor[0], HighlightColor[1], HighlightColor[2]);

        if (this.vPositionBuffer === undefined) {
            this.vPositionBuffer = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vPositions), this.gl.STATIC_DRAW);
        this.vPositionBuffer.itemSize = 3;
        this.vPositionBuffer.numItems = vPositions.length / 3;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vPositionBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexPositionAttribute, this.vPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vPositionBuffer.numItems);

        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderDefaut);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderDefaut);
    };
}

export function LasData(md, data) {
    this.MD = md;
    this.Data = data;
};