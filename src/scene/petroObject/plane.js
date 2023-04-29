import * as mat4 from '../glMatrix/mat4';
import * as vec3 from '../glMatrix/vec3';

import { ShaderType, getUniqueID, ConvertIDToColor, RayIntersectPlane } from '../sceneConsts';

export function Plane(sceneInfo) {
    this.sceneInfo = sceneInfo;
    this.gl = sceneInfo.gl;
    this.visible = true;

    this.init = function (name, id, vertices, indices) {
        this.name = name;
        this.id = id;
        this.pickingID = getUniqueID(1);

        this.pickingColor = ConvertIDToColor(this.pickingID);
        this.vertices = vertices;

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
    }

    this.setColor = function (minY, maxY, minColor, maxColor) {
        this.minY = minY;
        this.maxY = maxY;
        this.minColor = minColor;
        this.maxColor = maxColor;
    }

    this.tryPicking = function (pickedID, pickResult) {
        if (pickResult.Status !== 0) return;

        if (this.pickingID === pickedID) {
            pickResult.Status = 1;
            pickResult.Renderable = this;

            var pickV = vec3.create();

            var point1 = [this.vertices[0], this.vertices[1], this.vertices[2]];
            var point2 = [this.vertices[3], this.vertices[4], this.vertices[5]];
            var point3 = [this.vertices[6], this.vertices[7], this.vertices[8]];
            var point4 = [this.vertices[9], this.vertices[10], this.vertices[11]];

            pickV = RayIntersectPlane(this.sceneInfo.sceneCamera.pickPosition, this.sceneInfo.sceneCamera.pickDirection, point1, point2, point3);

            if (pickV == null)
            {
                pickV = RayIntersectPlane(this.sceneInfo.sceneCamera.pickPosition, this.sceneInfo.sceneCamera.pickDirection, point1, point3, point4);
            }

            pickResult.Position = pickV;

            let Properties = [];
            if (pickResult.Position !== null && pickResult.Position !== undefined) {
                Properties.push({name: 'Object', value: ''});
                Properties.push({name: "Plane", value: this.name});
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

        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
        this.gl.disableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);
        this.gl.disableVertexAttribArray(this.sceneInfo.textureCoordAttribute);

        if (this.sceneInfo.pickingEnabled) {
            this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderColorOnly);
            this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderColorOnly);
            this.gl.disableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);
            this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, this.pickingColor[0], this.pickingColor[1], this.pickingColor[2]);
        }
        else {
            this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderColorDepth);
            this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderColorDepth);
            this.gl.uniform3f(this.sceneInfo.lowColorFSUniform, this.minColor[0], this.minColor[1], this.minColor[2]);
            this.gl.uniform3f(this.sceneInfo.highColorFSUniform, this.maxColor[0], this.maxColor[1], this.maxColor[2]);

            this.gl.uniform1f(this.sceneInfo.sinLengthUniform, this.minY);
            this.gl.uniform1f(this.sceneInfo.cosLengthUniform, this.maxY);

            this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, 1, 0, 0);
        }

        var mMatrix = mat4.create();
        mat4.identity(mMatrix);

        this.gl.uniformMatrix4fv(this.sceneInfo.mMatrixUniform, false, mMatrix);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexPositionBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexPositionAttribute, this.cubeVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeVertexIndexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, this.cubeVertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);

        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderDefaut);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderDefaut);

        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
        this.gl.disableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);
        this.gl.disableVertexAttribArray(this.sceneInfo.textureCoordAttribute);

    }

}