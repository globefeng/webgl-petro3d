import * as mat4 from '../glMatrix/mat4';
import * as vec3 from '../glMatrix/vec3';

import { Cylinder } from '../shape/cylinder';
import { ShaderType, HighlightColor, getUniqueID, ConvertIDToColor, invertNormalMatrix } from '../sceneConsts';

export function Perf(sceneInfo) {
    this.sceneInfo = sceneInfo;
    this.gl = sceneInfo.gl;
    this.color = [0.2, 0.8, 0.2];

    this.visible = true;

    this.perfList = [];
    this.pickIndex = -1;
    
    this.matrixList = [];
    this.normalMatrixList = [];
    this.distanceList = [];
    
    this.radius = 24;
    this.smallRadius = 2;
    this.angle = 0;
    this.size = 1.5;

    this.init = function(wellbore, name, color) {
        this.cylinder = new Cylinder(this.sceneInfo);
        this.cylinder.init(32);

        this.color[0] = color.X;
        this.color[1] = color.Y;
        this.color[2] = color.Z;

        this.name = name;
        this.wellbore = wellbore;
        this.radius = wellbore.radius * 1.2;

        this.pickingID = getUniqueID(1);
        this.pickingColor = ConvertIDToColor(this.pickingID);
    };

    this.tryPicking = function(pickedID, pickResult) {
        if (pickResult.Status !== 0) return;

        this.pickIndex = -1;
        for (var i = 0; i < this.perfList.length; i++) {
            if (pickedID === this.perfList[i].pickingID) {
                this.pickIndex = i;
                pickResult.Status = 1;
                pickResult.Renderable = this;
                pickResult.Position = this.perfList[i].Position;
                pickResult.TopMD = this.perfList[i].mdTop;
                pickResult.BottomMD = this.perfList[i].mdBottom;
                pickResult.TopPosition = this.perfList[i].topPosition;
                pickResult.BottomPosition = this.perfList[i].bottomPosition;

                let Properties = [];
                if (pickResult.Position !== null && pickResult.Position !== undefined) {
                    Properties.push({name: 'Object', value: ''});
                    Properties.push({name: "Perf", value: this.name});
                    Properties.push({name: "MD top", value: this.perfList[i].mdTop.toFixed(2)});
                    Properties.push({name: "MD bottom", value: this.perfList[i].mdBottom.toFixed(2)});
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

    this.setData = function(distanceList) {
        this.perfList = [];

        for (var i = 0; i < distanceList.length; i += 2) {
            this.perfList.push(new PerfData(distanceList[i],distanceList[i + 1],
                             this.wellbore.getPosition(distanceList[i]),
                             this.wellbore.getPosition(distanceList[i + 1])));
        }
    };

    this.draw = function() {
        for (var i = 0; i < this.perfList.length; i++) {
            this.perfList[i].updateData(this.wellbore, this.radius, this.smallRadius, this.angle);
        }

        this.angle -= 0.005;
        if (this.angle < 1.0) {
            this.angle = 1.5;
        }

        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
        this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, this.color[0], this.color[1], this.color[2]);

        if (this.sceneInfo.pickingEnabled) {
            this.cylinder.setColorMode(ShaderType.shaderColorOnly, this.pickingColor);
        }
        else {
            this.cylinder.setColorMode(ShaderType.shaderColorLighting, this.color);
        }

        this.cylinder.beginDraw();

        for (var j = 0; j < this.perfList.length; j++) {
            if (this.sceneInfo.pickingEnabled) {
                this.perfList[j].draw(this.gl, this.sceneInfo, this.cylinder, this.perfList[j].pickingColor);
            }
            else if (j === this.pickIndex) {
                this.perfList[j].draw(this.gl, this.sceneInfo, this.cylinder, HighlightColor);
            }
            else {
                this.perfList[j].draw(this.gl, this.sceneInfo, this.cylinder, this.color);
            }
        }

        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
        this.cylinder.endDraw();
    }

}

function PerfData(mdTop, mdBottom, topPosition, bottomPosition) {
    this.mdTop = mdTop;
    this.mdBottom = mdBottom;

    this.topPosition = topPosition;
    this.bottomPosition = bottomPosition;

    this.Position = [(this.topPosition[0] + this.bottomPosition[0]) / 2, (this.topPosition[1] + this.bottomPosition[1]) / 2, (this.topPosition[2] + this.bottomPosition[2]) / 2];

    this.matrixList = [];
    this.normalMatrixList = [];

    this.pickingID = getUniqueID(1);
    this.pickingColor = ConvertIDToColor(this.pickingID);

    this.updateData = function (wellbore, radius, smallRadius, angle) {
        this.matrixList = [];
        this.normalMatrixList = [];

        this.matrixList.push(wellbore.getMatrix(radius, this.topPosition, this.bottomPosition));
        var normalMatrix = wellbore.getNormalMatrix(radius, this.topPosition, this.bottomPosition);
        this.normalMatrixList.push(invertNormalMatrix(normalMatrix));

        let vNormal = vec3.create();
        vec3.transformMat4(vNormal, [0, 0, 1], normalMatrix);
        vec3.normalize(vNormal, vNormal);

        let vAxis = vec3.create();
        vec3.subtract(vAxis, this.topPosition, this.bottomPosition);
        vec3.normalize(vAxis, vAxis);

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

            let vSide2 = vec3.create();
            vec3.scale(vSide2, vAngle, radius * angle);
            vec3.add(vSide2, vSide2, this.Position);

            let mMatrix = wellbore.getMatrix(smallRadius, vSide1, vSide2);
            this.matrixList.push(mMatrix);
            let nMatrix = wellbore.getNormalMatrix(smallRadius, vSide1, vSide2);
            this.normalMatrixList.push(invertNormalMatrix(nMatrix));
        }
    }

    this.draw = function(gl, sceneInfo, cylinder, color) {
        gl.vertexAttrib3f(sceneInfo.vertexColorAttribute, color[0], color[1], color[2]);

        for (var i = 0; i < this.matrixList.length; i++) {
            gl.uniformMatrix4fv(sceneInfo.mMatrixUniform, false, this.matrixList[i]);
            gl.uniformMatrix3fv(sceneInfo.nMatrixUniform, false, this.normalMatrixList[i]);

            cylinder.draw();
            cylinder.drawTopCaps();
            cylinder.drawBottomCaps();
        }
    }
}