import * as mat4 from '../glMatrix/mat4';
import * as vec3 from '../glMatrix/vec3';

import { Cylinder } from '../shape/cylinder';
import { ShaderType, HighlightColor, getUniqueID, ConvertIDToColor, invertNormalMatrix } from '../sceneConsts';

export function Geophone(sceneInfo) {
    this.sceneInfo = sceneInfo;
    this.gl = sceneInfo.gl;
    this.color = [0.2, 0.8, 0.2];

    this.visible = true;

    let geophoneList = [];  

    let radius = 24;
    let smallRadius = 2;
    let height = 3;
    let angle = 0;
    let size = 1.5;

    let pickIndex = -1;
    
    this.init = function(wellbore, name) {
        this.cylinder = new Cylinder(this.sceneInfo);
        this.cylinder.init(6);

        this.name = name;
        this.wellbore = wellbore;
        radius = wellbore.radius * 1.8;

        this.pickingID = getUniqueID(1);
        this.pickingColor = ConvertIDToColor(this.pickingID);
    };

    this.tryPicking = function (pickedID, pickResult) {
        if (pickResult.Status !== 0) return;

        pickIndex = -1;
        for (var i = 0; i < geophoneList.length; i++) {
            if (pickedID === geophoneList[i].pickingID) {
                pickIndex = i;
                pickResult.Status = 1;
                pickResult.Renderable = this;
                pickResult.Position = geophoneList[i].Position;

                let Properties = [];
                if (pickResult.Position !== null && pickResult.Position !== undefined) {
                    Properties.push({name: 'Object', value: ''});
                    Properties.push({name: "Geophone", value: this.name});
                    Properties.push({name: "MD", value: geophoneList[i].distance.toFixed(2)});
                    Properties.push({name: 'Local coordinate', value: ''});
                    Properties.push({name: 'East', value: pickResult.Position[0].toFixed(2)});
                    Properties.push({name: 'North', value: -pickResult.Position[2].toFixed(2)});
                    Properties.push({name: 'Depth', value: pickResult.Position[1].toFixed(2)});
                }
    
                pickResult.Properties = Properties;                 
                return;
            }
        }
        pickResult.Status = 0;
    }

    this.setData = function (distanceList) {
        geophoneList = [];

        for (var i = 0; i < distanceList.length; i++) {
            var phoneTop = this.wellbore.getPosition(distanceList[i] - height);
            var phoneBottom = this.wellbore.getPosition(distanceList[i] + height);
            geophoneList.push(new GeophoneData(i, distanceList[i], phoneTop, phoneBottom));
        }
    }

    this.draw = function() {
        for (var i = 0; i < geophoneList.length; i++) {
            geophoneList[i].updateData(this.wellbore, radius, smallRadius, angle, size);
        }

        size -= 0.005;
        if (size < 1.0) {
            size = 1.5;
        }
        angle += Math.PI / 180;

        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
        this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, this.color[0], this.color[1], this.color[2]);

        if (this.sceneInfo.pickingEnabled) {
            this.cylinder.setColorMode(ShaderType.shaderColorOnly, this.pickingColor);
        }
        else {
            this.cylinder.setColorMode(ShaderType.shaderColorLighting, this.color);
        }

        this.cylinder.beginDraw();

        for (var j = 0; j < geophoneList.length; j++) {
            if (this.sceneInfo.pickingEnabled) {
                geophoneList[j].draw(this.gl, this.sceneInfo, this.cylinder, geophoneList[j].pickingColor);
            }
            else if (j === pickIndex) {
                geophoneList[j].draw(this.gl, this.sceneInfo, this.cylinder, HighlightColor);
            }
            else {
                geophoneList[j].draw(this.gl, this.sceneInfo, this.cylinder, this.color);
            }
        }

        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
        this.cylinder.endDraw();
    }
}

function GeophoneData(i, distance, top, bottom) {
    var phoneTop = top;
    var phoneBottom = bottom;

    this.distance = distance;    
    this.Position = [(phoneTop[0] + phoneBottom[0]) / 2, (phoneTop[1] + phoneBottom[1]) / 2, (phoneTop[2] + phoneBottom[2]) / 2];

    var smallHeight = 3;
    var matrixList = [];
    var normalMatrixList = [];
    
    this.pickingID = getUniqueID(1);
    this.pickingColor = ConvertIDToColor(this.pickingID);

    this.updateData = function (wellbore, radius, smallRadius, angle, size) {
        matrixList = [];
        normalMatrixList = [];

        matrixList.push(wellbore.getMatrix(radius, phoneTop, phoneBottom));
        var mNormal = wellbore.getNormalMatrix(radius, phoneTop, phoneBottom);

        let vNormal = vec3.create();
        vec3.transformMat4(vNormal, [0, 0, 1], mNormal);
        vec3.normalize(vNormal, vNormal);

        let vAxis = vec3.create();
        vec3.subtract(vAxis, phoneTop, phoneBottom);
        vec3.normalize(vAxis, vAxis);

        normalMatrixList.push(invertNormalMatrix(mNormal));

        for (var i = 0; i < 6; i++) {
            let mRotate = mat4.create();
            mat4.identity(mRotate);
            mat4.rotate(mRotate, mRotate, i * Math.PI / 3 + angle, vAxis);

            let vAngle = vec3.create();
            vec3.transformMat4(vAngle, vNormal, mRotate);
            vec3.normalize(vAngle, vAngle);

            let vSide1 = vec3.create();
            vec3.scale(vSide1, vAngle, radius);
            vec3.add(vSide1, vSide1, this.Position);

            let vHeight = vec3.create();
            vec3.scale(vHeight, vAxis, smallHeight);

            let vTop = vec3.create();
            vec3.add(vTop, vSide1, vHeight);

            let vBottom = vec3.create();
            vec3.subtract(vBottom, vSide1, vHeight);

            matrixList.push(wellbore.getMatrix(smallRadius, vTop, vBottom));
            normalMatrixList.push(invertNormalMatrix(wellbore.getNormalMatrix(smallRadius, vTop, vBottom)));
        }
    }

    this.draw = function(gl, sceneInfo, cylinder, color) {
        gl.vertexAttrib3f(sceneInfo.vertexColorAttribute, color[0], color[1], color[2]);
    
        for (var i = 0; i < matrixList.length; i++) {
            gl.uniformMatrix4fv(sceneInfo.mMatrixUniform, false, matrixList[i]);
            gl.uniformMatrix3fv(sceneInfo.nMatrixUniform, false, normalMatrixList[i]);

            cylinder.draw();
            cylinder.drawTopCaps();
            cylinder.drawBottomCaps();
        }
    }
}