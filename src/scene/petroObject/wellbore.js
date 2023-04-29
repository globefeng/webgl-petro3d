import * as mat4 from '../glMatrix/mat4';
import * as mat3 from '../glMatrix/mat3';
import * as vec3 from '../glMatrix/vec3';
import { ShaderType, HighlightColor, getUniqueID, ConvertIDToColor, invertNormalMatrix } from '../sceneConsts';
import { Cylinder } from '../shape/cylinder';

export function Wellbore(sceneInfo) {
    this.sceneInfo = sceneInfo;
    this.gl = sceneInfo.gl;
    this.visible = true;

    let renderableChildren = [];
    
    let matrixList = [];
    let normalMatrixList = [];
    this.distanceList = [];

    let jointMap = {};
    let cylinderMap = {};
    
    this.addChild = function(renderableObject) {
        renderableChildren.push(renderableObject);
    }

    this.init = function(name, id, radius, vList, color) {
        this.name = name;
        this.id = id;

        this.cylinder = new Cylinder(this.sceneInfo);
        this.cylinder.init(32);

        this.radius = radius;
        this.jointPoints = vList;
        this.color = color;

        this.distanceList = [];

        if (vList.length >= 2) {
            let curentDistance = 0;
            this.distanceList.push(curentDistance);

            for (var ii = 1; ii < vList.length; ii++) {
                let vertex = vec3.create();

                vec3.subtract(vertex, vList[ii], vList[ii - 1]);
                curentDistance += vec3.length(vertex);
                this.distanceList.push(curentDistance);
            }

            for (var i = 0; i < (vList.length - 1); i++) {
                let mMatrix = this.getMatrix(radius, vList[i], vList[i + 1]);
                cylinderMap[matrixList.length] = i;
                matrixList.push(mMatrix);
                mMatrix = this.getNormalMatrix(radius, vList[i], vList[i + 1]);
                normalMatrixList.push(invertNormalMatrix(mMatrix));

                if (i < (vList.length - 2)) {
                    let jointPoints = this.getJointPoints(radius, vList[i], vList[i + 1], vList[i + 2], 15 * Math.PI / 180);

                    if (jointPoints.length > 1) {
                        for (var j = 0; j < (jointPoints.length - 1); j += 2) {
                            mMatrix = this.getMatrix(radius, jointPoints[j], jointPoints[j + 1]);
                            jointMap[matrixList.length] = vList[i + 1];
                            matrixList.push(mMatrix);
                            mMatrix = this.getNormalMatrix(radius, jointPoints[j], jointPoints[j + 1]);
                            normalMatrixList.push(invertNormalMatrix(mMatrix));
                        }
                    }
                }
            };
        }

        this.pickingID = getUniqueID(matrixList.length);
        this.pickingEndID = this.pickingID + matrixList.length;
        this.pickingColor = ConvertIDToColor(this.pickingID);
    };

    this.pickFinal = function(depthRatio, pickResult) {
        if (depthRatio < 0) depthRatio = 0;
        else if (depthRatio > 0.998) depthRatio = 1;

        let vIndex = cylinderMap[pickResult.Position];
        let vPoint = this.jointPoints[vIndex];
        let v1 = this.jointPoints[vIndex + 1];

        let md0 = this.distanceList[vIndex];
        let md1 = this.distanceList[vIndex + 1];

        let vertex;

        if (depthRatio === 0) {
            vertex = vPoint;
            this.pickedMD = md0;
        }
        else if (depthRatio === 1) {
            vertex = v1;
            this.pickedMD = md1;
        }
        else {
            vertex = [vPoint[0] + (v1[0] - vPoint[0]) * depthRatio, vPoint[1] + (v1[1] - vPoint[1]) * depthRatio, vPoint[2] + (v1[2] - vPoint[2]) * depthRatio];
            this.pickedMD = md0 + (md1 - md0) * depthRatio;
        }
        pickResult.Status = 1;
        pickResult.Position = vertex;

        let Properties = [];
        if (pickResult.Position !== null && pickResult.Position !== undefined) {
            Properties.push({name: 'Object', value: ''});
            Properties.push({name: "Wellbore", value: this.name});
            Properties.push({name: "MD", value: this.pickedMD.toFixed(2)});
            
            Properties.push({name: 'Local coordinate', value: ''});
            Properties.push({name: 'East', value: pickResult.Position[0].toFixed(2)});
            Properties.push({name: 'North', value: -pickResult.Position[2].toFixed(2)});
            Properties.push({name: 'Depth', value: pickResult.Position[1].toFixed(2)});
        }

        pickResult.Properties = Properties;   
    }

    this.tryPicking = function(pickedID, pickResult) {
        this.pickedMD = -1;
        if (pickResult.Status !== 0) return;

        if (pickedID >= this.pickingID && pickedID < this.pickingEndID) {
            let pickIndex = pickedID - this.pickingID;
            if (jointMap[pickIndex] !== null && jointMap[pickIndex] !== undefined) {
                pickResult.Status = 1;
                pickResult.Position = jointMap[pickIndex];
                pickResult.Renderable = this;
                return;
            }
            else if (cylinderMap[pickIndex] !== null && cylinderMap[pickIndex] !== undefined) {
                // let vIndex = cylinderMap[pickIndex];
                pickResult.Status = 2;
                pickResult.Position = pickIndex;
                pickResult.Renderable = this;
                return;
            }
        }


        for (var i = 0; i < renderableChildren.length; i++) {
            renderableChildren[i].tryPicking(pickedID, pickResult);
        };

    }

    this.draw = function () { 
        if (!this.sceneInfo.isVisible(this.id))  return;

        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
        this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, this.color[0], this.color[1], this.color[2]);

        if (this.sceneInfo.pickingEnabled) {
            this.cylinder.setColorMode(ShaderType.shaderColorOnly, this.pickingColor);
        }
        else {
            this.cylinder.setColorMode(ShaderType.shaderColorLighting, this.color);
        }
        this.cylinder.beginDraw();

        for (var i = 0; i < matrixList.length; i++) {
            this.gl.uniformMatrix4fv(this.sceneInfo.mMatrixUniform, false, matrixList[i]);
            this.gl.uniformMatrix3fv(this.sceneInfo.nMatrixUniform, false, normalMatrixList[i]);

            if (this.sceneInfo.pickingEnabled) {
                var idColor = ConvertIDToColor(this.pickingID + i);
                this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, idColor[0], idColor[1], idColor[2]);
            }

            this.cylinder.draw();
            if (i === 0 || i === (matrixList.length - 1)) {
                this.cylinder.drawTopCaps();
                this.cylinder.drawBottomCaps();
            }
        }

        if (this.pickedMD >= 0 && !this.sceneInfo.pickingEnabled) {
            this.cylinder.setColorMode(ShaderType.shaderColorOnly, HighlightColor);
            this.cylinder.beginDraw();
            this.gl.disable(this.gl.CULL_FACE);

            if (this.pickedMD >= (this.distanceList[this.distanceList.length - 1] - 1)) {
                let topV = this.getPosition(this.distanceList[this.distanceList.length - 1] - 1);
                let bottomV = this.getPosition(this.distanceList[this.distanceList.length - 1]);

                let mMatrix = this.getMatrix(this.radius * 2, topV, bottomV);
                let nMatrix = invertNormalMatrix(this.getNormalMatrix(this.radius * 2, topV, bottomV));

                this.gl.uniformMatrix4fv(this.sceneInfo.mMatrixUniform, false, mMatrix);
                this.gl.uniformMatrix3fv(this.sceneInfo.nMatrixUniform, false, nMatrix);

                this.cylinder.drawBottomCaps();
            }
            else {
                let topV = this.getPosition(this.pickedMD);
                let bottomV = this.getPosition(this.pickedMD + 1);

                let mMatrix = this.getMatrix(this.radius * 2, topV, bottomV);
                let nMatrix = invertNormalMatrix(this.getNormalMatrix(this.radius * 2, topV, bottomV));

                this.gl.uniformMatrix4fv(this.sceneInfo.mMatrixUniform, false, mMatrix);
                this.gl.uniformMatrix3fv(this.sceneInfo.nMatrixUniform, false, nMatrix);

                this.cylinder.drawTopCaps();
            }
        }

        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
        this.cylinder.endDraw();

        for (var ii = 0; ii < renderableChildren.length; ii++) {
                renderableChildren[ii].draw();
        };
    }

    this.drawIndex = function(index) {
        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);

        this.cylinder.setColorMode(ShaderType.shaderColorRatio, this.color);
        this.cylinder.beginDraw();

        this.gl.uniformMatrix4fv(this.sceneInfo.mMatrixUniform, false, matrixList[index]);

        let normalMatrix = mat3.create();
        mat3.identity(normalMatrix);
        mat3.fromMat4(normalMatrix, normalMatrixList[index]);
        mat3.transpose(normalMatrix, normalMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        this.gl.uniformMatrix3fv(this.sceneInfo.nMatrixUniform, false, normalMatrix);

        this.cylinder.draw();
        if (index === 0 || index === (matrixList.length - 1)) {
            this.cylinder.drawTopCaps();
            this.cylinder.drawBottomCaps();
        }

        this.cylinder.endDraw();
    }

    this.getMatrix = function(radius, v1, v2) {
        let downDirection = [0, -1, 0];
        let goDirection = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
        let height = vec3.length(goDirection);

        vec3.normalize(goDirection, goDirection);
        let angle = vec3.dot(downDirection, goDirection);
        angle = Math.acos(angle);

        var mMatrix = mat4.create();
        mat4.identity(mMatrix);

        if (angle === 0) {
            mat4.translate(mMatrix, mMatrix, v1);
            mat4.scale(mMatrix, mMatrix, [radius, height, radius]);
            return mMatrix;
        }
        else if (angle === Math.PI) {
            mat4.translate(mMatrix, mMatrix, v1);
            mat4.rotate(mMatrix, mMatrix, Math.PI, [-1, 0, 0]);
            mat4.scale(mMatrix, mMatrix, [radius, height, radius]);
            return mMatrix;
        }
        else {
            let vCross = vec3.create();
            vec3.cross(vCross, downDirection, goDirection);

            mat4.translate(mMatrix, mMatrix, v1);
            mat4.rotate(mMatrix, mMatrix, angle, vCross);
            mat4.scale(mMatrix, mMatrix, [radius, height, radius]);
            return mMatrix;
        }
    };

    this.getRotateMatrix = function(radius, v1, v2, rotateAngle) {
        let downDirection = [0, -1, 0];
        let goDirection = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
        let height = vec3.length(goDirection);

        vec3.normalize(goDirection, goDirection);
        let angle = vec3.dot(downDirection, goDirection);
        angle = Math.acos(angle);

        var mMatrix = mat4.create();
        mat4.identity(mMatrix);

        if (angle === 0) {
            mat4.translate(mMatrix, mMatrix, v1);
            mat4.scale(mMatrix, mMatrix, [radius, height, radius]);
            mat4.rotate(mMatrix, mMatrix, rotateAngle, goDirection);
            return mMatrix;
        }
        else if (angle === Math.PI) {
            mat4.translate(mMatrix, mMatrix, v2);
            mat4.scale(mMatrix, mMatrix, [radius, height, radius]);
            mat4.rotate(mMatrix, mMatrix, rotateAngle, goDirection);
            return mMatrix;
        }
        else {
            let vCross = vec3.create();
            vec3.cross(vCross, downDirection, goDirection);

            mat4.translate(mMatrix, mMatrix, v1);
            mat4.rotate(mMatrix, mMatrix, angle, vCross);
            mat4.rotate(mMatrix, mMatrix, rotateAngle, goDirection);
            mat4.scale(mMatrix, mMatrix, [radius, height, radius]);
            return mMatrix;
        }
    };

    this.getNormalMatrix = function(radius, v1, v2) {
        let downDirection = [0, -1, 0];
        let goDirection = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
        // let height = vec3.length(goDirection);

        vec3.normalize(goDirection, goDirection);
        let angle = vec3.dot(downDirection, goDirection);
        angle = Math.acos(angle);

        var mMatrix = mat4.create();
        mat4.identity(mMatrix);

        if (angle === 0) {
            return mMatrix;
        }
        else if (angle === Math.PI) {
            mat4.rotate(mMatrix, mMatrix, Math.PI, [-1, 0, 0]);
            return mMatrix;
        }
        else {
            let vCross = vec3.create();
            vec3.cross(vCross, downDirection, goDirection);

            mat4.rotate(mMatrix, mMatrix, angle, vCross);

            return mMatrix;
        }
    };

    this.getRotateNormalMatrix = function(radius, v1, v2, rotateAngle) {
        let downDirection = [0, -1, 0];
        let goDirection = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
        // let height = vec3.length(goDirection);

        vec3.normalize(goDirection, goDirection);
        let angle = vec3.dot(downDirection, goDirection);
        angle = Math.acos(angle);

        var mMatrix = mat4.create();
        mat4.identity(mMatrix);

        if (angle === 0 || angle === Math.PI) {
            return mMatrix;
        }
        else {
            let vCross = vec3.create();
            vec3.cross(vCross, downDirection, goDirection);

            mat4.rotate(mMatrix, mMatrix, angle, vCross);
            mat4.rotate(mMatrix, mMatrix, rotateAngle, goDirection);

            return mMatrix;
        }
    };

    this.getJointPoints = function(radius, v1, v2, v3, minAngle) {
        let direction1 = [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
        let direction2 = [v2[0] - v3[0], v2[1] - v3[1], v2[2] - v3[2]];

        vec3.normalize(direction1, direction1);
        vec3.normalize(direction2, direction2);
        let angle = vec3.dot(direction1, direction2);
        angle = Math.acos(angle);

        let pointList = [];

        let deltaAngle = 0.1 * Math.PI / 180;
        if (angle > deltaAngle) {
            let vCross = vec3.create();
            vec3.cross(vCross, direction1, direction2);

            let vDirection = [direction1[0] * radius, direction1[1] * radius, direction1[2] * radius];

            var mMatrix = mat4.create();
            mat4.identity(mMatrix);
            mat4.rotate(mMatrix, mMatrix, Math.PI / 2, vCross);

            let vPoint = vec3.create();
            vec3.transformMat4(vPoint, vDirection, mMatrix);
            pointList.push(vPoint);

            let nextAngle = minAngle;

            do {
                if ((nextAngle + deltaAngle) > angle) {
                    nextAngle = angle;
                }

                mat4.identity(mMatrix);
                mat4.rotate(mMatrix, mMatrix, Math.PI / 2 + nextAngle, vCross);

                vPoint = vec3.create();
                vec3.transformMat4(vPoint, vDirection, mMatrix);
                pointList.push(vPoint);

                if (nextAngle === angle) {
                    break;
                }
                else {
                    nextAngle += minAngle;
                }
            } while (true);
        }

        let jointPoints = [];

        if (pointList.length > 1) {
            for (var i = 0; i < pointList.length - 1; i++) {
                let p1 = pointList[i];
                let p2 = pointList[i + 1];

                let vSide = [p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]];
                let sideLength = vec3.length(vSide) / 2;
                vec3.normalize(vSide, vSide);
                vec3.scale(vSide, vSide, sideLength);

                let pt1 = vec3.create();
                let pt2 = vec3.create();
                vec3.add(pt1, v2, vSide);
                vec3.subtract(pt2, v2, vSide);

                jointPoints.push(pt1);
                jointPoints.push(pt2);
            }
        }

        return jointPoints;
    };

    this.getPosition = function(distance) {
        let position = [];
        if (distance === 0) {
            position = [this.jointPoints[0][0], this.jointPoints[0][1], this.jointPoints[0][2]];
            return position;
        }
        else if (distance >= this.distanceList[this.distanceList.Length - 1]) {
            position = [this.jointPoints[this.distanceList.Length - 1][0], this.jointPoints[this.distanceList.Length - 1][1], this.jointPoints[this.distanceList.Length - 1][2]];
            return position;
        }

        for (var i = 0; i < this.distanceList.length - 1; i++) {
            if (distance === this.distanceList[i]) {
                position = [this.jointPoints[i][0], this.jointPoints[i][1], this.jointPoints[i][2]];
                return position;
            }
            else if (distance === this.distanceList[i + 1]) {
                position = [this.jointPoints[i + 1][0], this.jointPoints[i + 1][1], this.jointPoints[i + 1][2]];
                return position;
            }
            else if (distance > this.distanceList[i] && distance < this.distanceList[i + 1]) {
                var vertex = vec3.create();
                vec3.subtract(vertex, this.jointPoints[i + 1], this.jointPoints[i]);
                vec3.normalize(vertex, vertex);
                vec3.scale(vertex, vertex, distance - this.distanceList[i]);
                vec3.add(vertex, vertex, this.jointPoints[i]);
                return vertex;
            }
        }
        return position;
    };

}
