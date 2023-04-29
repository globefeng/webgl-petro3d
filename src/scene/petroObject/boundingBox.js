import { GridPlane } from './gridPlane';

export function BoundingBox(sceneInfo) {
    this.sceneInfo = sceneInfo;
    this.gl = sceneInfo.gl;
    this.backColor = [0.02, 0.02, 0.02];
    this.lineColor = [0.4, 0.4, 0.4];
    this.visible = true;
    
    var gridPlanes = [];

    this.init = function (minX, minY, minZ, maxX, maxY, maxZ, gridSize) {
        this.gridSize = gridSize;

        this.minX = minX; this.minY = minY; this.minZ = minZ;
        this.maxX = maxX; this.maxY = maxY; this.maxZ = maxZ;

        let leftPlane = new GridPlane(this.sceneInfo, 'West');
        leftPlane.init([this.minX, this.minY, this.maxZ],
                       [this.minX, this.maxY, this.maxZ],
                       [this.minX, this.maxY, this.minZ],
                       [this.minX, this.minY, this.minZ],
                       this.backColor,
                       this.lineColor,
                       this.gridSize);
        gridPlanes.push(leftPlane);

        let backPlane = new GridPlane(this.sceneInfo, 'North');
        backPlane.init([this.minX, this.minY, this.minZ],
                       [this.minX, this.maxY, this.minZ],
                       [this.maxX, this.maxY, this.minZ],
                       [this.maxX, this.minY, this.minZ],
                       this.backColor,
                       this.lineColor,
                       this.gridSize);
        gridPlanes.push(backPlane);

        let rightPlane = new GridPlane(this.sceneInfo, 'East');
        rightPlane.init([this.maxX, this.minY, this.minZ],
                        [this.maxX, this.maxY, this.minZ],
                        [this.maxX, this.maxY, this.maxZ],
                        [this.maxX, this.minY, this.maxZ],
                        this.backColor,
                        this.lineColor,
                        this.gridSize);
        gridPlanes.push(rightPlane);

        let frontPlane = new GridPlane(this.sceneInfo, 'South');
        frontPlane.init([this.maxX, this.minY, this.maxZ],
                       [this.maxX, this.maxY, this.maxZ],
                       [this.minX, this.maxY, this.maxZ],
                       [this.minX, this.minY, this.maxZ],
                       this.backColor,
                       this.lineColor,
                       this.gridSize);
        gridPlanes.push(frontPlane);

        let topPlane = new GridPlane(this.sceneInfo, 'Top');
        topPlane.init([this.minX, this.maxY, this.minZ],
                      [this.minX, this.maxY, this.maxZ],
                      [this.maxX, this.maxY, this.maxZ],
                      [this.maxX, this.maxY, this.minZ],
                      this.backColor,
                      this.lineColor,
                      this.gridSize);
        gridPlanes.push(topPlane);

        let bottomPlane = new GridPlane(this.sceneInfo, 'Bottom');
        bottomPlane.init([this.minX, this.minY, this.maxZ],
                         [this.minX, this.minY, this.minZ],
                         [this.maxX, this.minY, this.minZ],
                         [this.maxX, this.minY, this.maxZ],
                         this.backColor,
                         this.lineColor,
                         this.gridSize);
        gridPlanes.push(bottomPlane);

        var xSize = this.maxX - this.minX;
        var zSize = this.maxZ - this.minZ;

        var xzSize = Math.sqrt(xSize * xSize + zSize * zSize);
        var numGrid = Math.floor(xzSize / this.gridSize);
        numGrid = Math.floor(numGrid / 2);
        if (numGrid < 1) numGrid = 1;
        xzSize = numGrid * this.gridSize;
    };

    this.draw = function () {
        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, 1);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, 1);

        for (var i = 0; i < gridPlanes.length; i++) {
            gridPlanes[i].draw();
        }

        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, 0);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, 0);
    };

}



