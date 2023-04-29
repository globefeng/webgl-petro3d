import { ShaderType } from '../sceneConsts';

export function Cylinder(sceneInfo) {
    this.sceneInfo = sceneInfo;
    this.gl = sceneInfo.gl;
    this.shaderMode = ShaderType.shaderColorLighting;
    this.color = [1, 0, 0];    
    this.segmentNum = 32;

    this.init = function(segmentNum) {
        this.segmentNum = segmentNum;
        this.initCylinder();
        this.initCaps();
    } 

    this.initCylinder = function() {
        let vertexPositions = [];
        let countPosition = 0;

        let vertexNormals = [];
        let countNormal = 0;

        let vertexTextures = [];
        let countTexture = 0;

        for (let i = 0; i <= this.segmentNum; i++) {
            let angle = -i * 2 * Math.PI / this.segmentNum;
            let x = Math.cos(angle);
            let z = Math.sin(angle);
            vertexPositions[countPosition++] = x;
            vertexPositions[countPosition++] = 0;
            vertexPositions[countPosition++] = z;
            vertexPositions[countPosition++] = x;
            vertexPositions[countPosition++] = -1;
            vertexPositions[countPosition++] = z;

            vertexNormals[countNormal++] = x;
            vertexNormals[countNormal++] = 0;
            vertexNormals[countNormal++] = z;
            vertexNormals[countNormal++] = x;
            vertexNormals[countNormal++] = 0;
            vertexNormals[countNormal++] = z;

            vertexTextures[countTexture++] = 0;
            vertexTextures[countTexture++] = 0;
            vertexTextures[countTexture++] = 1;
            vertexTextures[countTexture++] = 1;
        };

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
    }

    this.initCaps = function() {
        let capPositions = [];
        let countPosition = 0;

        let capNormals = [];
        let countNormal = 0;

        let capTextures = [];
        let countTexture = 0;

        for (let i = 0; i <= this.segmentNum; i++) {
            let angle = -i * 2 * Math.PI / this.segmentNum;
            let x = Math.cos(angle);
            let z = Math.sin(angle);
            capPositions[countPosition++] = x;
            capPositions[countPosition++] = 0;
            capPositions[countPosition++] = z;
            capPositions[countPosition++] = x;
            capPositions[countPosition++] = -1;
            capPositions[countPosition++] = z;

            capNormals[countNormal++] = 0;
            capNormals[countNormal++] = 1;
            capNormals[countNormal++] = 0;
            capNormals[countNormal++] = 0;
            capNormals[countNormal++] = -1;
            capNormals[countNormal++] = 0;

            capTextures[countTexture++] = 0;
            capTextures[countTexture++] = 0;
            capTextures[countTexture++] = 1;
            capTextures[countTexture++] = 1;
        };

        capPositions[countPosition++] = 0;
        capPositions[countPosition++] = 0;
        capPositions[countPosition++] = 0;

        capPositions[countPosition++] = 0;
        capPositions[countPosition++] = -1;
        capPositions[countPosition++] = 0;

        capNormals[countNormal++] = 0;
        capNormals[countNormal++] = 1;
        capNormals[countNormal++] = 0;
        capNormals[countNormal++] = 0;
        capNormals[countNormal++] = -1;
        capNormals[countNormal++] = 0;

        capTextures[countTexture++] = 0;
        capTextures[countTexture++] = 0;
        capTextures[countTexture++] = 1;
        capTextures[countTexture++] = 1;

        this.capPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.capPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(capPositions), this.gl.STATIC_DRAW);
        this.capPositionBuffer.itemSize = 3;
        this.capPositionBuffer.numItems = capPositions.length / 3;

        this.capNormalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.capNormalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(capNormals), this.gl.STATIC_DRAW);
        this.capNormalBuffer.itemSize = 3;
        this.capNormalBuffer.numItems = capNormals.length / 3;

        this.capTextureBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.capTextureBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(capTextures), this.gl.STATIC_DRAW);
        this.capTextureBuffer.itemSize = 2;
        this.capTextureBuffer.numItems = capTextures.length / 2;

        this.topIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.topIndexBuffer);

        let topVertexIndices = [];
        let count = 0;

        topVertexIndices[count++] = this.capPositionBuffer.numItems - 2;

        for (var j = 0; j <= this.segmentNum; j++) {
            topVertexIndices[count++] = 2 * j;
        };

        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(topVertexIndices), this.gl.STATIC_DRAW);
        this.topIndexBuffer.itemSize = 1;
        this.topIndexBuffer.numItems = topVertexIndices.length;

        this.bottomIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.bottomIndexBuffer);

        let bottomVertexIndices = [];
        count = 0;

        bottomVertexIndices[count++] = this.capPositionBuffer.numItems - 1;

        for (var ii = this.segmentNum; ii >= 0; ii--) {
            bottomVertexIndices[count++] = 2 * ii + 1;
        };

        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bottomVertexIndices), this.gl.STATIC_DRAW);
        this.bottomIndexBuffer.itemSize = 1;
        this.bottomIndexBuffer.numItems = bottomVertexIndices.length;
    }

    this.setColorMode = function(shaderMode, color) {
        this.shaderMode = shaderMode;
        this.color = color;
    }

    this.beginDraw = function() {
        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);

        if (this.shaderMode === ShaderType.shaderColorLighting) {
            this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderColorLighting);
            this.gl.enableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);
            this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, this.color[0], this.color[1], this.color[2]);
        }
        else if (this.shaderMode === ShaderType.shaderColorOnly) {
            this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderColorOnly);
            this.gl.disableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);
            this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, this.color[0], this.color[1], this.color[2]);
        }
        else if (this.shaderMode === ShaderType.shaderColorRatio) {
            this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderColorRatio);
            this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderColorRatio);
            this.gl.disableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);
            this.gl.enableVertexAttribArray(this.sceneInfo.textureCoordAttribute);
        }

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
    };

    this.endDraw = function() {
        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderDefaut);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderDefaut);
        this.gl.disableVertexAttribArray(this.sceneInfo.vertexNormalAttribute);
        this.gl.disableVertexAttribArray(this.sceneInfo.textureCoordAttribute);
        this.gl.disable(this.gl.CULL_FACE);
    };
    
    this.draw = function() {
         this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        if (this.shaderMode === ShaderType.shaderColorLighting) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexNormalBuffer);
            this.gl.vertexAttribPointer(this.sceneInfo.vertexNormalAttribute, this.vertexNormalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        }
        else if (this.shaderMode === ShaderType.shaderColorRatio) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureBuffer);
            this.gl.vertexAttribPointer(this.sceneInfo.textureCoordAttribute, this.vertexTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        }

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertexPositionBuffer.numItems);
    };

    this.drawTopCaps = function() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.capPositionBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexPositionAttribute, this.capPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        if (this.shaderMode === ShaderType.shaderColorLighting) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.capNormalBuffer);
            this.gl.vertexAttribPointer(this.sceneInfo.vertexNormalAttribute, this.vertexNormalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        }
        else if (this.shaderMode === ShaderType.shaderColorRatio) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.capTextureBuffer);
            this.gl.vertexAttribPointer(this.sceneInfo.textureCoordAttribute, this.capTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        }

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.topIndexBuffer);
        this.gl.drawElements(this.gl.TRIANGLE_FAN, this.segmentNum + 2, this.gl.UNSIGNED_SHORT, 0);
    };

    this.drawBottomCaps = function() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.capPositionBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexPositionAttribute, this.capPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        if (this.shaderMode === ShaderType.shaderColorLighting) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.capNormalBuffer);
            this.gl.vertexAttribPointer(this.sceneInfo.vertexNormalAttribute, this.vertexNormalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        }
        else if (this.shaderMode === ShaderType.shaderColorRatio) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.capTextureBuffer);
            this.gl.vertexAttribPointer(this.sceneInfo.textureCoordAttribute, this.capTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        }

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.bottomIndexBuffer);
        this.gl.drawElements(this.gl.TRIANGLE_FAN, this.segmentNum + 2, this.gl.UNSIGNED_SHORT, 0);
    };
    
};