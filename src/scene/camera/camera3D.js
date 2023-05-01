import * as mat4 from '../glMatrix/mat4';
import * as vec3 from '../glMatrix/vec3';

export function Camera3D(sceneInfo) {
    this.homeCameraPosition = [];
    this.homeCenterPosition = [];
    
    this.flyCenterPosition = [];
    this.endCenterPosition = [];
    this.flyDistance = 1;
    this.flyEndDistance = 1;

    this.flyLookAt = [];
    this.flyLookUp = [];
    this.flyEndLookAt = [];
    this.flyEndLookUp = [];
    
    this.gl = sceneInfo.gl;
    this.sceneInfo = sceneInfo;

    this.init = function(camPosition, viewCenter, maxDistance) {
        this.camPosition = camPosition;
        this.viewCenter = viewCenter;
        this.maxDistance = maxDistance;

        this.homeCameraPosition = [this.camPosition[0], this.camPosition[1], this.camPosition[2]];
        this.homeCenterPosition = [this.viewCenter[0], this.viewCenter[1], this.viewCenter[2]];

        var direction = vec3.create();
        vec3.subtract(direction, this.viewCenter, this.camPosition);

        this.updateLookDirection();
        this.pickDirection = this.lookAt;
        this.pickPosition = camPosition;
    };

    this.setPickDirection = function(mouseX, mouseY)
    {
        var viewWidth = this.gl.viewportWidth / 2.0;
        var viewHeight = this.gl.viewportHeight / 2.0;

        var ratio = viewWidth / viewHeight;
        var height = Math.tan(Math.PI / 8) * 1000.0;
        var width = height * ratio;

        var pickX = (mouseX - viewWidth) / viewWidth * width;
        var pickY = (viewHeight - mouseY) / viewHeight * height;

        this.pickDirection = vec3.create();
        vec3.scale(this.pickDirection, this.lookAt, 1000);

        var lookRightScale = vec3.create();
        vec3.scale(lookRightScale, this.lookRight, pickX);

        var lookUpScale = vec3.create();
        vec3.scale(lookUpScale, this.lookUp, pickY);

        vec3.add(this.pickDirection, this.pickDirection, lookRightScale);
        vec3.add(this.pickDirection, this.pickDirection, lookUpScale);
        vec3.normalize(this.pickDirection, this.pickDirection);

        this.pickPosition = [this.camPosition[0], this.camPosition[1], this.camPosition[2]];
    }

    this.setProjection = function () {
        var azimuth = this.getAzimuth() + Math.PI * 3 / 4;
        var lightDirection = [Math.cos(azimuth), 1, Math.sin(azimuth)];
        vec3.normalize(lightDirection, lightDirection);

        this.gl.uniform3fv(this.sceneInfo.lightDirectionUniform, lightDirection);

        var pMatrix = mat4.create();
        mat4.identity(pMatrix);

        mat4.perspective(pMatrix, Math.PI / 4.0, this.gl.viewportWidth / this.gl.viewportHeight, 1, this.maxDistance * 2.0);

        var vMatrix = mat4.create();
        mat4.identity(vMatrix);

        mat4.lookAt(vMatrix, this.camPosition, this.viewCenter, this.lookUp);
        var pvMatrix = mat4.create();
        mat4.identity(pvMatrix);
        mat4.multiply(pvMatrix, pMatrix, vMatrix);

        this.gl.uniformMatrix4fv(this.sceneInfo.pvMatrixUniform, false, pvMatrix);
    };

    this.updateLookDirection = function() {
        this.lookAt = vec3.create();
        vec3.subtract(this.lookAt, this.viewCenter, this.camPosition);
        vec3.normalize(this.lookAt, this.lookAt);

        if (this.lookAt[0] === 0 && this.lookAt[2] === 0 && (this.lookAt[1] === 1 || this.lookAt[1] === -1)) {
            this.lookUp = [0, 0, -1];
            this.lookRight = [1, 0, 0];
        }
        else {
            this.lookRight = vec3.create();
            vec3.cross(this.lookRight, this.lookAt, [0, 1, 0]);
            vec3.normalize(this.lookRight, this.lookRight);

            this.lookUp = vec3.create();
            vec3.cross(this.lookUp, this.lookRight, this.lookAt);
            vec3.normalize(this.lookUp, this.lookUp);
        }
    };

    this.beginFlyToHome = function() {
        this.beginFlyTo(this.homeCameraPosition, this.homeCenterPosition);
    }

    this.beginFlyTo = function(dstPosition, dstCenter) {
        this.flyDistance = vec3.distance(this.viewCenter, this.camPosition);
        this.flyEndDistance = vec3.distance(dstPosition, dstCenter);

        this.flyLookAt = [this.lookAt[0], this.lookAt[1], this.lookAt[2]];
        this.flyLookUp = [this.lookUp[0], this.lookUp[1], this.lookUp[2]];

        this.flyEndLookAt = vec3.create();
        vec3.subtract(this.flyEndLookAt, dstCenter, dstPosition);
        vec3.normalize(this.flyEndLookAt, this.flyEndLookAt);

        this.flyEndLookUp = vec3.create();
        if (this.flyEndLookAt[0] === 0 && this.flyEndLookAt[2] === 0 && (this.flyEndLookAt[1] === 1 || this.flyEndLookAt[1] === -1)) {
            vec3.cross(this.flyEndLookUp, this.lookRight, this.flyEndLookAt);
        }
        else {
            vec3.cross(this.flyEndLookUp, this.flyEndLookAt, [0, 1, 0]);
            vec3.normalize(this.flyEndLookUp, this.flyEndLookUp);
            vec3.cross(this.flyEndLookUp, this.flyEndLookUp, this.flyEndLookAt);
        }
        vec3.normalize(this.flyEndLookUp, this.flyEndLookUp);

        this.flyCenterPosition = [this.viewCenter[0], this.viewCenter[1], this.viewCenter[2]];
        this.endCenterPosition = [dstCenter[0], dstCenter[1], dstCenter[2]];
    };
   
    this.beginFlyToDirection = function(direction) {
        var vLookAt = vec3.create();
        vec3.subtract(vLookAt, this.viewCenter, this.camPosition);
        var currentLength = vec3.length(vLookAt);

        if (direction === 0) {
            this.beginFlyTo([this.viewCenter[0], this.viewCenter[1], this.viewCenter[2] + currentLength],
                            [this.viewCenter[0], this.viewCenter[1], this.viewCenter[2]]);
        }
        else if (direction === 1) {
            this.beginFlyTo([this.viewCenter[0] - currentLength, this.viewCenter[1], this.viewCenter[2]],
                            [this.viewCenter[0], this.viewCenter[1], this.viewCenter[2]]);
        }
        else if (direction === 2) {
            this.beginFlyTo([this.viewCenter[0], this.viewCenter[1], this.viewCenter[2] - currentLength],
                            [this.viewCenter[0], this.viewCenter[1], this.viewCenter[2]]);
        }
        else if (direction === 3) {
            this.beginFlyTo([this.viewCenter[0] + currentLength, this.viewCenter[1], this.viewCenter[2]],
                            [this.viewCenter[0], this.viewCenter[1], this.viewCenter[2]]);
        }
        else if (direction === 4) {
            this.beginFlyTo([this.viewCenter[0], this.viewCenter[1] + currentLength, this.viewCenter[2]],
                            [this.viewCenter[0], this.viewCenter[1], this.viewCenter[2]]);
        }
    };

    this.fly = function(ratio) {
        this.lookAt = [this.flyLookAt[0] + (this.flyEndLookAt[0] - this.flyLookAt[0]) * ratio,
                       this.flyLookAt[1] + (this.flyEndLookAt[1] - this.flyLookAt[1]) * ratio,
                       this.flyLookAt[2] + (this.flyEndLookAt[2] - this.flyLookAt[2]) * ratio];

        this.lookUp = [this.flyLookUp[0] + (this.flyEndLookUp[0] - this.flyLookUp[0]) * ratio,
                       this.flyLookUp[1] + (this.flyEndLookUp[1] - this.flyLookUp[1]) * ratio,
                       this.flyLookUp[2] + (this.flyEndLookUp[2] - this.flyLookUp[2]) * ratio];

        vec3.normalize(this.lookAt, this.lookAt);
        vec3.normalize(this.lookUp, this.lookUp);
        vec3.cross(this.lookRight, this.lookAt, this.lookUp);
        vec3.normalize(this.lookRight, this.lookRight);

        this.viewCenter = [this.flyCenterPosition[0] + (this.endCenterPosition[0] - this.flyCenterPosition[0]) * ratio,
                           this.flyCenterPosition[1] + (this.endCenterPosition[1] - this.flyCenterPosition[1]) * ratio,
                           this.flyCenterPosition[2] + (this.endCenterPosition[2] - this.flyCenterPosition[2]) * ratio];

        var distance = this.flyDistance + (this.flyEndDistance - this.flyDistance) * ratio;

        var scale = vec3.create();
        vec3.scale(scale, this.lookAt, -distance);
        vec3.add(this.camPosition, this.viewCenter, scale);
    };

    this.zoom = function(delta) {
        delta = delta > 0 ? 1 : -1;
        var direction;
        direction = vec3.create();
        vec3.subtract(direction, this.viewCenter, this.camPosition);

        var distance1 = this.maxDistance / 500.0;
        var distance2 = this.maxDistance / 10.0;
        var factor = vec3.length(direction) / this.maxDistance;

        distance1 = distance1 + (distance2 - distance1) * factor;
        var curretDistance = vec3.distance(this.viewCenter, this.camPosition);
        var newDistance = curretDistance - distance1 * delta;

        if (newDistance > this.maxDistance) return;

        if (delta > 0 && distance1 > vec3.distance(this.viewCenter, this.camPosition)) return;

        vec3.normalize(direction, direction);
        vec3.scale(direction, direction, delta * distance1 / 2);
        vec3.add(this.camPosition, this.camPosition, direction);
    };

    this.rotate = function (deltaX, deltaY) {
        deltaX = -deltaX * Math.PI / 180;
        deltaY = -deltaY * Math.PI / 180;
        
        var matrix = mat4.create();
        mat4.identity(matrix);

        var upDirection = [0, 1, 0];
        var mx = mat4.create();
        mat4.rotate(mx, matrix, deltaX, upDirection);

        mat4.identity(matrix);
        var my = mat4.create();
        mat4.rotate(my, matrix, deltaY, this.lookRight);

        var mRotate = mat4.create();
        mat4.multiply(mRotate, mx, my);

        var direction = vec3.create();
        vec3.subtract(direction, this.camPosition, this.viewCenter);
        vec3.transformMat4(direction, direction, mRotate); 

        vec3.add(this.camPosition, this.viewCenter, direction);

        vec3.transformMat4(this.lookAt, this.lookAt, mRotate);
        vec3.normalize(this.lookAt, this.lookAt);

        vec3.transformMat4(this.lookUp, this.lookUp, mRotate);
        vec3.normalize(this.lookUp, this.lookUp);

        vec3.cross(this.lookRight, this.lookAt, this.lookUp);
        vec3.normalize(this.lookRight, this.lookRight);
    };

    this.getAzimuth = function() {
        return Math.atan2(this.lookAt[0], -this.lookAt[2]);
    };

    this.getLookAngle = function() {
        var verticalAngle = 0;    
        if (this.lookAt.X === 0.0 && this.lookAt.Z === 0.0)
        {
            if (this.lookAt.Y < 0.0)
            {
                verticalAngle = Math.PI;
            }
        }
        else
        {
            verticalAngle = Math.PI / 2 - Math.atan2(-this.lookAt[1], Math.sqrt(this.lookAt[0] * this.lookAt[0] + this.lookAt[2] * this.lookAt[2]));
        }

        return verticalAngle;
    };


}