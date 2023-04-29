import { ShaderType } from '../sceneConsts';

export function TextureQuad(sceneInfo) {
    this.sceneInfo = sceneInfo;
    this.gl = sceneInfo.gl;

    this.init = function() {
        this.vertexPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);

        let vertices = [
             -0.5, 0.5, 0.0,
             0.5, 0.5, 0.0,
             0.5, -0.5, 0.0,
             -0.5, -0.5, 0.0
        ];

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = 4;

        this.vertexTextureBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureBuffer);
        var textureCoords = [
          0.0, 1.0,
          1.0, 1.0,
          1.0, 0.0,
          0.0, 0.0
        ];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
        this.vertexTextureBuffer.itemSize = 2;
        this.vertexTextureBuffer.numItems = 4;
    }

    this.setTexture = function(texture) {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.uniform1i(this.sceneInfo.samplerUniform, 0);
    };
    
    this.beginDraw = function() {
        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderTextureOnly);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderTextureOnly);
        this.gl.enableVertexAttribArray(this.sceneInfo.textureCoordAttribute);

        this.gl.enable(this.gl.BLEND);
        this.gl.disable(this.gl.DEPTH_TEST);        
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.textureCoordAttribute, this.vertexTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    };

    this.drawQuad = function(matrix, texture) {
        this.gl.uniformMatrix4fv(this.sceneInfo.mMatrixUniform, false, matrix);
        
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.uniform1i(this.sceneInfo.samplerUniform, 0);
        
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
    }
    
    
    this.draw = function() {
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
    }

    this.endDraw = function() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.enable(this.gl.DEPTH_TEST);        
        this.gl.disable(this.gl.BLEND);
        this.gl.disableVertexAttribArray(this.sceneInfo.textureCoordAttribute);
        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderDefaut);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderDefaut);
    }
}
