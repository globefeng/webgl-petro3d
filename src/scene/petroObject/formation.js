import * as mat4 from '../glMatrix/mat4';
import * as vec3 from '../glMatrix/vec3';

import { ShaderType, getUniqueID, ConvertIDToColor, RayIntersectPlane } from '../sceneConsts';

export function Formation(sceneInfo) {
    this.sceneInfo = sceneInfo;
    this.gl = sceneInfo.gl;

    this.init = function (name, id, vertices, indices) {
        this.name = name;
        this.id = id;
        this.vertices = vertices;
        this.indices = indices;

        this.cubeVertexPositionBuffer = this.gl.createBuffer();

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexPositionBuffer);

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        this.cubeVertexPositionBuffer.itemSize = 3;
        this.cubeVertexPositionBuffer.numItems = vertices.length;

        this.cubeVertexIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeVertexIndexBuffer);

        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
        this.cubeVertexIndexBuffer.itemSize = 1;
        this.cubeVertexIndexBuffer.numItems = indices.length;

        this.groupNumber = 3000;

        this.groupCount = Math.floor(this.cubeVertexIndexBuffer.numItems / this.groupNumber);
        if (this.cubeVertexIndexBuffer.numItems > this.groupNumber * this.groupCount) {
            this.groupCount++;
        }

        this.pickingID = getUniqueID(this.groupCount);
        this.pickingColor = {};
        for (var i = 0; i < this.groupCount; i++) {
            this.pickingColor[i] = ConvertIDToColor(this.pickingID + i);
        }
    }

    this.setColor = function (minY, maxY, minColor, maxColor) {
        this.minY = minY;
        this.maxY = maxY;
        this.minColor = minColor;
        this.maxColor = maxColor;
    }

    this.tryPicking = function (pickedID, pickResult) {
        //if (!CC_IsVisible(this.TH_id) || pickResult.Status != 0) return;
        if (pickResult.Status !== 0) return;

        if (pickedID >= this.pickingID && pickedID < (this.pickingID + this.groupCount)) {
            pickResult.Status = 1;
            pickResult.Renderable = this;

            var groupId = pickedID - this.pickingID;
            var itemStart = groupId * this.groupNumber;
            var itemNumber =  this.groupNumber;

            if (groupId === (this.groupCount - 1)) {
                itemNumber = this.cubeVertexIndexBuffer.numItems - groupId * this.groupNumber;
            }

            let pickV = null;
            let minD = Number.MAX_VALUE;

            for (var t = 0; t < itemNumber; t += 3)
            {
                let p1 = this.indices[itemStart + t] * 3;
                let p2 = this.indices[itemStart + t + 1] * 3;
                let p3 = this.indices[itemStart + t + 2] * 3;

                let v1 = [this.vertices[p1], this.vertices[p1 + 1], this.vertices[p1 + 2]];
                let v2 = [this.vertices[p2], this.vertices[p2 + 1], this.vertices[p2 + 2]];
                let v3 = [this.vertices[p3], this.vertices[p3 + 1], this.vertices[p3 + 2]];

                var vIntersect = RayIntersectPlane(this.sceneInfo.sceneCamera.pickPosition, this.sceneInfo.sceneCamera.pickDirection, v1, v2, v3);
                if (vIntersect != null)
                {
                    let d = vec3.distance(vIntersect, this.sceneInfo.sceneCamera.pickPosition);
                    if (d < minD)
                    {
                        minD = d;
                        pickV = vIntersect;
                    }
                }
            }
            pickResult.Position = pickV;

            let Properties = [];
            if (pickResult.Position !== null && pickResult.Position !== undefined) {
                Properties.push({name: 'Object', value: ''});
                Properties.push({name: "Formation", value: this.name});
                Properties.push({name: 'Local coordinate', value: ''});
                Properties.push({name: 'East', value: pickResult.Position[0].toFixed(2)});
                Properties.push({name: 'North', value: -pickResult.Position[2].toFixed(2)});
                Properties.push({name: 'Depth', value: pickResult.Position[1].toFixed(2)});
            }

            pickResult.Properties = Properties;            
            return;
        }
        pickResult.Status = 0;
    }

    this.draw = function () {
        if (!this.sceneInfo.isVisible(this.id))  return;
        
        this.gl.disable(this.gl.CULL_FACE);

        var mMatrix = mat4.create();
        mat4.identity(mMatrix);

        this.gl.uniformMatrix4fv(this.sceneInfo.mMatrixUniform, false, mMatrix);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexPositionBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexPositionAttribute, this.cubeVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeVertexIndexBuffer);

        if (this.sceneInfo.pickingEnabled) {
            this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderColorOnly);
            this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderColorOnly);
            this.gl.disableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);

            for (var i = 0; i < this.groupCount; i++) {
                this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, this.pickingColor[i][0], this.pickingColor[i][1], this.pickingColor[i][2]);

                if (i === (this.groupCount - 1)) {
                    this.gl.drawElements(this.gl.TRIANGLES, this.cubeVertexIndexBuffer.numItems - i * this.groupNumber, this.gl.UNSIGNED_SHORT, i * this.groupNumber * 2);
                }
                else {
                    this.gl.drawElements(this.gl.TRIANGLES, this.groupNumber, this.gl.UNSIGNED_SHORT, i * this.groupNumber * 2);
                }
            }
        }
        else {
            this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
            this.gl.disableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);
            this.gl.disableVertexAttribArray(this.sceneInfo.textureCoordAttribute);

            this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderColorDepth);
            this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderColorDepth);
            this.gl.uniform3f(this.sceneInfo.lowColorFSUniform, this.minColor[0], this.minColor[1], this.minColor[2]);
            this.gl.uniform3f(this.sceneInfo.highColorFSUniform, this.maxColor[0], this.maxColor[1], this.maxColor[2]);

            this.gl.uniform1f(this.sceneInfo.sinLengthUniform, this.minY);
            this.gl.uniform1f(this.sceneInfo.cosLengthUniform, this.maxY);

            this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, 1, 0, 0);

            this.gl.drawElements(this.gl.TRIANGLES, this.cubeVertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
        }

        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderDefaut);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderDefaut);

        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
        this.gl.disableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);
        this.gl.disableVertexAttribArray(this.sceneInfo.textureCoordAttribute);
    }

}

