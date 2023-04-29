import * as mat4 from '../glMatrix/mat4';

import { HighlightColor, getScaleTranslationMatrix, getCircleMatrix, getCompassMatrix, setTextToTexture, ConvertIDToColor, getUniqueID, textureType, controlType, ShaderType } from '../sceneConsts';

export function CompassPanel(sceneInfo) {
    this.sceneInfo = sceneInfo;
    this.gl = sceneInfo.gl;
    
    var compassPanelOffsetY = 100;
    var compassPanelOffsetX = 60;

    var compassRadius = 45;

    var matrixTop;
    var matrixLookNorth;
    
    var matrixAzimuth;
    var matrixDip;

    var mTopCircle;

    this.colorSmallCircle = [0.2, 0.2, 0.2, 1];
    this.colorLargeCircle = [0.6, 0.6, 0.6, 1];

    this.pickColorNorth = [1,1,1];
    var pickColorSouth;
    var pickColorEast;
    var pickColorWest;
    var pickColorTop;

    var pickedControl = controlType.None;

    this.init = function() {
        matrixTop = getScaleTranslationMatrix(64, 64, [0, 0, 0]);
        matrixLookNorth = getScaleTranslationMatrix(32, 32, [0, compassRadius + 10, 0]);

        matrixAzimuth = getScaleTranslationMatrix(64, 16, [0, 80, 0]);
        matrixDip = getScaleTranslationMatrix(64, 16, [0, -80, 0]);

        this.mSmallCircle = getCircleMatrix([0, 0, 0], compassRadius - 2);
        this.mLargeCircle = getCircleMatrix([0, 0, 0], compassRadius + 2);
        mTopCircle = getCircleMatrix([0, 0, 0], 18);
        
        this.pickingID = getUniqueID(6);

        this.pickColorNorth = ConvertIDToColor(this.pickingID);
        pickColorEast = ConvertIDToColor(this.pickingID + 1);
        pickColorSouth = ConvertIDToColor(this.pickingID + 2);
        pickColorWest = ConvertIDToColor(this.pickingID + 3);
        pickColorTop = ConvertIDToColor(this.pickingID + 4);
    };

    this.tryPicking = function (pickedID, pickResult) {
        if (pickResult.Status !== 0) return;
        
        pickedControl = controlType.None;

        if (pickedID === this.pickingID) {
            pickedControl = controlType.CampassNorth;
            pickResult.Control = controlType.CampassNorth;
            pickResult.Status = 1;
            return;
        }
        if (pickedID === (this.pickingID + 1)) {
            pickedControl = controlType.CampassEast;
            pickResult.Control = controlType.CampassEast;
            pickResult.Status = 1;
            return;
        }
        if (pickedID === (this.pickingID + 2)) {
            pickedControl = controlType.CampassSouth;
            pickResult.Control = controlType.CampassSouth;
            pickResult.Status = 1;
            return;
        }
        if (pickedID === (this.pickingID + 3)) {
            pickedControl = controlType.CampassWest;
            pickResult.Control = controlType.CampassWest;
            pickResult.Status = 1;
            return;
        }
        if (pickedID === (this.pickingID + 4)) {
            pickedControl = controlType.CampassTop;
            pickResult.Control = controlType.CampassTop;
            pickResult.Status = 1;
            return;
        }
        pickResult.Status = 0;
    };

    this.draw = function() {
        var azimuth = this.sceneInfo.sceneCamera.getAzimuth();
        var lookAngle = this.sceneInfo.sceneCamera.getLookAngle();

        var pMatrix = mat4.create();
        mat4.identity(pMatrix);

        var vMatrix = mat4.create();
        mat4.identity(vMatrix);

        var pvMatrix = mat4.create();
        mat4.identity(pvMatrix);

        mat4.identity(pMatrix);
        mat4.ortho(pMatrix, -this.gl.viewportWidth / 2, this.gl.viewportWidth / 2, -this.gl.viewportHeight / 2, this.gl.viewportHeight / 2, -500, 500);

        var pickX = -this.gl.viewportWidth / 2 + compassPanelOffsetX;
        var pickY = -this.gl.viewportHeight / 2 + compassPanelOffsetY;

        mat4.identity(vMatrix);
        mat4.lookAt(vMatrix, [pickX, pickY, 500], [pickX, pickY, -500], [0, 1, 0]);

        mat4.identity(pvMatrix);
        mat4.multiply(pvMatrix, pMatrix, vMatrix);
        this.gl.uniformMatrix4fv(this.sceneInfo.pvMatrixUniform, false, pvMatrix);

        this.gl.depthFunc(this.gl.ALWAYS);

        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderColorOnly);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderColorOnly);

        if (this.sceneInfo.pickingEnabled) {
            this.sceneInfo.colorQuad.draw(getCompassMatrix(12, 14, compassRadius, azimuth), this.pickColorNorth);
            this.sceneInfo.colorQuad.draw(getCompassMatrix(12, 14, compassRadius, azimuth - Math.PI / 2.0), pickColorEast);
            this.sceneInfo.colorQuad.draw(getCompassMatrix(12, 14, compassRadius, azimuth + Math.PI), pickColorSouth);
            this.sceneInfo.colorQuad.draw(getCompassMatrix(12, 14, compassRadius, azimuth + Math.PI / 2.0), pickColorWest);
            this.sceneInfo.colorQuad.draw(mTopCircle, pickColorTop);
        }
        else {
            this.sceneInfo.colorCircle.draw(this.mLargeCircle, this.colorLargeCircle);
            this.sceneInfo.colorCircle.draw(this.mSmallCircle, this.colorSmallCircle);

            if (pickedControl === controlType.CampassNorth) {
                this.sceneInfo.colorQuad.draw(getCompassMatrix(16, 18, compassRadius, azimuth), HighlightColor);
            }
            if (pickedControl === controlType.CampassEast) {
                this.sceneInfo.colorQuad.draw(getCompassMatrix(16, 18, compassRadius, azimuth - Math.PI / 2.0), HighlightColor);
            }
            if (pickedControl === controlType.CampassSouth) {
                this.sceneInfo.colorQuad.draw(getCompassMatrix(16, 18, compassRadius, azimuth + Math.PI), HighlightColor);
            }
            if (pickedControl === controlType.CampassWest) {
                this.sceneInfo.colorQuad.draw(getCompassMatrix(16, 18, compassRadius, azimuth + Math.PI / 2.0), HighlightColor);
            }
            if (pickedControl === controlType.CampassTop) {
                this.sceneInfo.colorCircle.draw(mTopCircle, HighlightColor);
            }
        }

        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderDefaut);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderDefaut);

        if (!this.sceneInfo.pickingEnabled) {
            this.sceneInfo.textureQuad.beginDraw();

            setTextToTexture(this.gl, this.sceneInfo.textCanvasID, this.getAzimuthText(azimuth), this.sceneInfo.textures[textureType.white]);
            this.sceneInfo.textureQuad.drawQuad(matrixAzimuth, this.sceneInfo.textures[textureType.white]);

            setTextToTexture(this.gl, this.sceneInfo.textCanvasID, this.getLookAngleText(lookAngle), this.sceneInfo.textures[textureType.white]);
            this.sceneInfo.textureQuad.drawQuad(matrixDip, this.sceneInfo.textures[textureType.white]);

            this.sceneInfo.textureQuad.drawQuad(matrixTop, this.sceneInfo.textures[textureType.compassTop]);
            this.sceneInfo.textureQuad.drawQuad(matrixLookNorth, this.sceneInfo.textures[textureType.compassRaw]);

            var PP_matrixNorth = getCompassMatrix(12, 14, compassRadius, azimuth);
            this.sceneInfo.textureQuad.drawQuad(PP_matrixNorth, this.sceneInfo.textures[textureType.compassNorth]);

            var PP_matrixSouth = getCompassMatrix(12, 14, compassRadius, azimuth + Math.PI);
            this.sceneInfo.textureQuad.drawQuad(PP_matrixSouth, this.sceneInfo.textures[textureType.compassSouth]);

            var PP_matrixEast = getCompassMatrix(12, 14, compassRadius, azimuth - Math.PI / 2.0);
            this.sceneInfo.textureQuad.drawQuad(PP_matrixEast, this.sceneInfo.textures[textureType.compassEast]);

            var PP_matrixWest = getCompassMatrix(12, 14, compassRadius, azimuth + Math.PI / 2.0);
            this.sceneInfo.textureQuad.drawQuad(PP_matrixWest, this.sceneInfo.textures[textureType.compassWest]);

            var lookAngle2 = -this.sceneInfo.sceneCamera.getLookAngle();
            var PP_matrixLookDown = getCompassMatrix(32, 32, compassRadius - 22, lookAngle2);
            this.sceneInfo.textureQuad.drawQuad(PP_matrixLookDown, this.sceneInfo.textures[textureType.compassDip]);
            this.sceneInfo.textureQuad.endDraw();
        }

        this.gl.depthFunc(this.gl.LESS);
    };

    this.getAzimuthText = function(azimuth) {
        var angle = -Math.floor(azimuth * 180 / Math.PI);
        var ss = '';

        if (angle === 0) {
            ss = 'North';
        }
        else if (angle === -90) {
            ss = 'East';
        }
        else if (angle === 90) {
            ss = 'West';
        }
        else if (angle === -180 || angle === 180) {
            ss = 'South';
        }
        else if (angle < 0 && angle > -90) {
            ss = 'N ' + (-angle) + ' E';
        }
        else if (angle < -90 && angle > -180) {
            ss = 'S ' + (180 + angle) + ' E';
        }
        else if (angle < 90 && angle > 0) {
            ss = 'N ' + angle + ' W';
        }
        else if (angle < 180 && angle > 90) {
            ss = 'S ' + (180 - angle) + ' W';
        }

        return ss;
    };

    this.getLookAngleText = function(lookAngle) {
        var angle = Math.floor(lookAngle * 180 / Math.PI);
        var ss = '';

        if (angle > 90) {
            ss = 'Up ' + (angle - 90);
        }
        else {
            ss = 'Down ' + (90-angle);
        }
        return ss;
    }    
}
