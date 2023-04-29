
export function Circle(sceneInfo) {
    this.sceneInfo = sceneInfo;
    this.gl = sceneInfo.gl;
    this.segmentNum = 64;

    this.init = function(segmentNum) {
        this.segmentNum = segmentNum;

        let capPositions = [];
        let countPosition = 0;

        for (var i = 0; i <= this.segmentNum; i++) {
            let angle = -i * 2 * Math.PI / this.segmentNum;
            capPositions[countPosition++] = Math.cos(angle);
            capPositions[countPosition++] = Math.sin(angle);
            capPositions[countPosition++] = 0;
        };

        capPositions[countPosition++] = 0;
        capPositions[countPosition++] = 0;
        capPositions[countPosition++] = 0;

        this.capPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.capPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(capPositions), this.gl.STATIC_DRAW);
        this.capPositionBuffer.itemSize = 3;
        this.capPositionBuffer.numItems = capPositions.length / 3;

        this.topIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.topIndexBuffer);

        let topVertexIndices = [];
        let count = 0;

        topVertexIndices[count++] = this.capPositionBuffer.numItems - 1;

        for (var ii = 0; ii <= this.segmentNum; ii++) {
            topVertexIndices[count++] = ii;
        };

        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(topVertexIndices), this.gl.STATIC_DRAW);
        this.topIndexBuffer.itemSize = 1;
        this.topIndexBuffer.numItems = topVertexIndices.length;
    }

    this.draw = function(matrix, color) {
        this.gl.uniformMatrix4fv(this.sceneInfo.mMatrixUniform, false, matrix);
    
        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
        this.gl.vertexAttrib4f(this.sceneInfo.vertexColorAttribute, color[0], color[1], color[2], color[3]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.capPositionBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexPositionAttribute, this.capPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.topIndexBuffer);
        this.gl.drawElements(this.gl.TRIANGLE_FAN, this.segmentNum + 2, this.gl.UNSIGNED_SHORT, 0);
    };
};