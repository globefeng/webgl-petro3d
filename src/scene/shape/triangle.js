
export function Triangle(sceneInfo) {
    this.gl = sceneInfo.gl;
    this.sceneInfo = sceneInfo;

    this.init = function() {
        this.vertexPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);

        let vertices = [
             -0.5, 0.0, 0.0,
             0.0, 0.866025, 0.0,
             0.5, 0.0, 0.0
        ];

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = 3;
    }

    this.draw = function(matrix, color) {
        this.gl.uniformMatrix4fv(this.sceneInfo.mMatrixUniform, false, matrix);
        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
        this.gl.vertexAttrib4f(this.sceneInfo.vertexColorAttribute, color[0], color[1], color[2], color[3]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 3);
    }
}
