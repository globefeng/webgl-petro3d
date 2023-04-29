import * as mat4 from '../glMatrix/mat4';
import * as vec3 from '../glMatrix/vec3';
import { getUniqueID, ConvertIDToColor, RayIntersectPlane } from '../sceneConsts';

export function GridPlane(sceneInfo, name) {
    this.sceneInfo = sceneInfo;
    this.gl = sceneInfo.gl;
    this.Name = name;

    this.init = function(v1, v2, v3, v4, backColor, lineColor, gridSize) {
        this.gridSize = gridSize;
        this.backColor = backColor;
        this.lineColor = lineColor;

        this.pickingID = getUniqueID(1);
        this.GP_pickingColor = ConvertIDToColor(this.pickingID);

        this.vertexPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);

        this.vertices = [
             v1[0], v1[1], v1[2],
             v2[0], v2[1], v2[2],
             v3[0], v3[1], v3[2],
             v4[0], v4[1], v4[2]
        ];

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = 4;

        let xNumber = vec3.distance(v3, v2) / gridSize;
        let yNumber = vec3.distance(v2, v1) / gridSize;

        this.linePositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.linePositionBuffer);

        let lineVertices = [];

        let count = 0;
        for (var i = 0; i <= xNumber; i++) {
            let x1 = vec3.create();
            vec3.subtract(x1, v3, v2);
            vec3.scale(x1, x1, i / xNumber);
            vec3.add(x1, x1, v2);

            let x2 = vec3.create();
            vec3.subtract(x2, v4, v1);
            vec3.scale(x2, x2, i / xNumber);
            vec3.add(x2, x2, v1);

            lineVertices[count++] = x1[0];
            lineVertices[count++] = x1[1];
            lineVertices[count++] = x1[2];
            lineVertices[count++] = x2[0];
            lineVertices[count++] = x2[1];
            lineVertices[count++] = x2[2];
        }

        for (var j = 0; j <= yNumber; j++) {
            let y1 = vec3.create();
            vec3.subtract(y1, v1, v2);
            vec3.scale(y1, y1, j / yNumber);
            vec3.add(y1, y1, v2);

            let y2 = vec3.create();
            vec3.subtract(y2, v4, v3);
            vec3.scale(y2, y2, j / yNumber);
            vec3.add(y2, y2, v3);

            lineVertices[count++] = y1[0];
            lineVertices[count++] = y1[1];
            lineVertices[count++] = y1[2];
            lineVertices[count++] = y2[0];
            lineVertices[count++] = y2[1];
            lineVertices[count++] = y2[2];
        }

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(lineVertices), this.gl.STATIC_DRAW);
        this.linePositionBuffer.itemSize = 3;
        this.linePositionBuffer.numItems = 2 * (xNumber + 1) + 2 * (yNumber + 1);

        let line1 = vec3.create();
        vec3.subtract(line1, v3, v2);
        vec3.normalize(line1, line1);

        let line2 = vec3.create();
        vec3.subtract(line2, v2, v1);
        vec3.normalize(line2, line2);

        this.normal = vec3.create();
        vec3.cross(this.normal, line1, line2);
        vec3.normalize(this.normal, this.normal);
    }

    this.draw = function() {
        if (vec3.dot(this.normal, this.sceneInfo.sceneCamera.lookAt) >= 0) return;

        var mMatrix = mat4.create();
        mat4.identity(mMatrix);
        this.gl.uniformMatrix4fv(this.sceneInfo.mMatrixUniform, false, mMatrix);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        this.gl.vertexAttribPointer(this.sceneInfo.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);

        if (this.sceneInfo.pickingEnabled) {
            this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, this.GP_pickingColor[0], this.GP_pickingColor[1], this.GP_pickingColor[2]);
        }
        else {
            this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, this.backColor[0], this.backColor[1], this.backColor[2]);
        }

        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
        
        if (!this.sceneInfo.pickingEnabled) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.linePositionBuffer);
            this.gl.vertexAttribPointer(this.sceneInfo.vertexPositionAttribute, this.linePositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
            this.gl.vertexAttrib3f(this.sceneInfo.vertexColorAttribute, this.lineColor[0], this.lineColor[1], this.lineColor[2]);
            this.gl.depthFunc(this.gl.ALWAYS);
            this.gl.drawArrays(this.gl.LINES, 0, this.linePositionBuffer.numItems);
            this.gl.depthFunc(this.gl.LEQUAL);
        }
    }

    this.tryPicking = function (pickedID, pickResult) {
        if (vec3.dot(this.normal, this.sceneInfo.sceneCamera.lookAt) >= 0 || pickResult.Status !== 0) return;

        if (this.pickingID === pickedID) {
            var pickV = vec3.create();

            var p1 = [this.vertices[0], this.vertices[1], this.vertices[2]];
            var p2 = [this.vertices[3], this.vertices[4], this.vertices[5]];
            var p3 = [this.vertices[6], this.vertices[7], this.vertices[8]];
            var p4 = [this.vertices[9], this.vertices[10], this.vertices[11]];

            pickV = RayIntersectPlane(this.sceneInfo.sceneCamera.pickPosition, this.sceneInfo.sceneCamera.pickDirection, p1, p2, p3);

            if (pickV == null) {
                pickV = RayIntersectPlane(this.sceneInfo.sceneCamera.pickPosition, this.sceneInfo.sceneCamera.pickDirection, p1, p3, p4);
            }

            if (pickV != null)
            {
                pickResult.Status = 1;
                pickResult.Renderable = this;
                pickResult.Position = pickV;
            }

            return;
        }
        pickResult.Status = 0;
    }

    // this.getOutputText = function (GP_pResult) {
    //     var GP_propertyText = CC_getTableStart() +
    //                        CC_getTableHeadRow(CC_StrXor("GjpkalkbGj}", 5)) +
    //                        CC_getTableRow(CC_StrXor("Kdh`", 5), this.GP_Name) +
    //                        CC_getTableRow(CC_StrXor("Bwla%vl`", 5), CC_FormatNumber(this.gridSize) + CC_StrXor("%h", 5)) + 
    //                        CC_getTableRow("", CC_FormatNumber(MeterToFoot(this.gridSize)) + CC_StrXor("%cq", 5));

    //     GP_propertyText += CC_getPositionRows(this.sceneInfo.SI_ltp, GP_pResult.Position);
    //     GP_propertyText += CC_getTableEnd();

    //     return GP_propertyText;
    // }
}
