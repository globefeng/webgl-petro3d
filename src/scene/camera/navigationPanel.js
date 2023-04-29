import * as mat4 from '../glMatrix/mat4';
import { getScaleTranslationMatrix, getCircleMatrix, getTriangleMatrix, getQuadMatrix,  getUniqueID, ConvertIDToColor, textureType, controlType, ShaderType } from '../sceneConsts';

export function NavigationPanel(sceneInfo) {
    this.sceneInfo = sceneInfo;
    this.gl = sceneInfo.gl;

    var pickedControl = controlType.None;

    var navigationPanelOffsetY = 260;
    var navigationPanelOffsetX = 60;

    var colorButton = [0.7, 0.7, 0.7, 1.0];
    var colorHighLight = [1.0, 1.0, 1.0, 1.0];

    var panelRadius = 45;
    var colorSmallCircle = [0.2, 0.2, 0.2, 1];
    var colorLargeCircle = [0.6, 0.6, 0.6, 1];
    
    var arrowUp;
    var arrowRight;
    var arrowBottom;
    var arrowLeft;

    var mHome;
    var mHomeCircle;
    
    var mSmallCircle;
    var mLargeCircle;
    
    var mZoomInSmallCircle;
    var mZoomInLargeCircle;
    var mZoomOutSmallCircle;
    var mZoomOutLargeCircle;

    var mZoomInBoxX;
    var mZoomInBoxY;
    var mZoomOutBox;

    var pickColorHome;
    var pickColorZoomIn;
    var pickColorZoomOut;
    var pickColorTop;
    var pickColorRight;
    var pickColorBottom;
    var pickColorLeft;

    this.init = function() {
        var tScale = 18;
        var tOffset = 24;

        arrowUp = getTriangleMatrix([0, tOffset, 0], tScale, tScale, 0);
        arrowRight = getTriangleMatrix([tOffset, 0, 0], tScale, tScale, -Math.PI / 2.0);
        arrowBottom = getTriangleMatrix([0, -tOffset, 0], tScale, tScale, Math.PI);
        arrowLeft = getTriangleMatrix([-tOffset, 0, 0], tScale, tScale, Math.PI / 2.0);
        
        mHome = getScaleTranslationMatrix(64, 64, [0, 0, 0]);
        
        mSmallCircle = getCircleMatrix([0, 0, 0], panelRadius - 2);
        mLargeCircle = getCircleMatrix([0, 0, 0], panelRadius + 2);
        mHomeCircle = getCircleMatrix([0, 0, 0], 18);

        mZoomInSmallCircle = getCircleMatrix([0, -80, 0], 16);
        mZoomInLargeCircle = getCircleMatrix([0, -80, 0], 18);
        mZoomOutSmallCircle = getCircleMatrix([0, -130, 0], 16);
        mZoomOutLargeCircle = getCircleMatrix([0, -130, 0], 18);

        mZoomInBoxX = getQuadMatrix([0, -80, 0], 20, 4);
        mZoomInBoxY = getQuadMatrix([0, -80, 0], 4, 20);
        mZoomOutBox = getQuadMatrix([0, -130, 0], 20, 4);

        this.pickingID = getUniqueID(8);

        pickColorTop = ConvertIDToColor(this.pickingID);
        pickColorRight = ConvertIDToColor(this.pickingID + 1);
        pickColorBottom = ConvertIDToColor(this.pickingID + 2);
        pickColorLeft = ConvertIDToColor(this.pickingID + 3);

        pickColorZoomIn = ConvertIDToColor(this.pickingID + 4);
        pickColorZoomOut = ConvertIDToColor(this.pickingID + 5);
        pickColorHome = ConvertIDToColor(this.pickingID + 6);
    };

    this.tryPicking = function (pickedID, pickResult) {

        if (pickResult.Status !== 0) return;
        
        pickedControl = controlType.None;

        if (pickedID === this.pickingID) {
            pickedControl = controlType.NavigationTop;
            pickResult.Control = controlType.NavigationTop;
            pickResult.Status = 1;
            return;
        }
        if (pickedID === (this.pickingID + 1)) {
            pickedControl = controlType.NavigationRight;
            pickResult.Control = controlType.NavigationRight;
            pickResult.Status = 1;
            return;
        }
        if (pickedID === (this.pickingID + 2)) {
            pickedControl = controlType.NavigationBottom;
            pickResult.Control = controlType.NavigationBottom;
            pickResult.Status = 1;
            return;
        }
        if (pickedID === (this.pickingID + 3)) {
            pickedControl = controlType.NavigationLeft;
            pickResult.Control = controlType.NavigationLeft;
            pickResult.Status = 1;
            return;
        }
        if (pickedID === (this.pickingID + 4)) {
            pickedControl = controlType.NavigationZoomIn;
            pickResult.Control = controlType.NavigationZoomIn;
            pickResult.Status = 1;
            return;
        }
        if (pickedID === (this.pickingID + 5)) {
            pickedControl = controlType.NavigationZoomOut;
            pickResult.Control = controlType.NavigationZoomOut;
            pickResult.Status = 1;
            return;
        }
        if (pickedID === (this.pickingID + 6)) {
            pickedControl = controlType.NavigationHome;
            pickResult.Control = controlType.NavigationHome;
            pickResult.Status = 1;
            return;
        }
        pickResult.Status = 0;
    };

    this.draw = function() {
        var pMatrix = mat4.create();
        mat4.identity(pMatrix);

        var vMatrix = mat4.create();
        mat4.identity(vMatrix);

        var pvMatrix = mat4.create();
        mat4.identity(pvMatrix);

        mat4.identity(pMatrix);
        mat4.ortho(pMatrix, -this.gl.viewportWidth / 2, this.gl.viewportWidth / 2, -this.gl.viewportHeight / 2, this.gl.viewportHeight / 2, -500, 500);

        var pickX = -this.gl.viewportWidth / 2 + navigationPanelOffsetX;
        var pickY = -this.gl.viewportHeight / 2 + navigationPanelOffsetY;

        mat4.identity(vMatrix);
        mat4.lookAt(vMatrix, [pickX, pickY, 100], [pickX, pickY, -100], [0, 1, 0]);

        mat4.identity(pvMatrix);
        mat4.multiply(pvMatrix, pMatrix, vMatrix);
        this.gl.uniformMatrix4fv(this.sceneInfo.pvMatrixUniform, false, pvMatrix);

        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderColorOnly);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderColorOnly);
        this.gl.depthFunc(this.gl.ALWAYS);

        this.gl.enable(this.gl.BLEND);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        if (this.sceneInfo.pickingEnabled) {
                this.sceneInfo.colorCircle.draw(mZoomInLargeCircle, pickColorZoomIn);
                this.sceneInfo.colorCircle.draw(mZoomOutLargeCircle, pickColorZoomOut);

                this.sceneInfo.colorTriangle.draw(arrowUp, pickColorTop);
                this.sceneInfo.colorTriangle.draw(arrowRight, pickColorRight);
                this.sceneInfo.colorTriangle.draw(arrowBottom, pickColorBottom);
                this.sceneInfo.colorTriangle.draw(arrowLeft, pickColorLeft);

                this.sceneInfo.colorQuad.draw(mHomeCircle, pickColorHome);
        }
        else {
                this.sceneInfo.colorCircle.draw(mLargeCircle, colorLargeCircle);
                this.sceneInfo.colorCircle.draw(mSmallCircle, colorSmallCircle);

                this.sceneInfo.colorCircle.draw(mZoomInLargeCircle, colorLargeCircle);
                this.sceneInfo.colorCircle.draw(mZoomInSmallCircle, colorSmallCircle);

                this.sceneInfo.colorCircle.draw(mZoomOutLargeCircle, colorLargeCircle);
                this.sceneInfo.colorCircle.draw(mZoomOutSmallCircle, colorSmallCircle);

                this.sceneInfo.colorTriangle.draw(arrowUp, pickedControl === controlType.NavigationTop ? colorHighLight : colorButton);
                this.sceneInfo.colorTriangle.draw(arrowRight, pickedControl === controlType.NavigationRight ? colorHighLight : colorButton);
                this.sceneInfo.colorTriangle.draw(arrowBottom, pickedControl === controlType.NavigationBottom ? colorHighLight : colorButton);
                this.sceneInfo.colorTriangle.draw(arrowLeft, pickedControl === controlType.NavigationLeft ? colorHighLight : colorButton);

                this.sceneInfo.colorQuad.draw(mZoomInBoxX, pickedControl === controlType.NavigationZoomIn ? colorHighLight : colorButton);
                this.sceneInfo.colorQuad.draw(mZoomInBoxY, pickedControl === controlType.NavigationZoomIn ? colorHighLight : colorButton);
                this.sceneInfo.colorQuad.draw(mZoomOutBox, pickedControl === controlType.NavigationZoomOut ? colorHighLight : colorButton);


            if (pickedControl === controlType.NavigationHome) {
                this.sceneInfo.colorCircle.draw(mHomeCircle, colorHighLight);
            }

            this.sceneInfo.textureQuad.beginDraw();

            if (!this.sceneInfo.TH_pickingEnabled) {
                this.sceneInfo.textureQuad.drawQuad(mHome, this.sceneInfo.textures[textureType.compassHome]);
            }

            this.sceneInfo.textureQuad.endDraw();            
        }


        this.gl.disable(this.gl.BLEND);
        this.gl.enable(this.gl.DEPTH_TEST);

        this.gl.depthFunc(this.gl.LESS);
        this.gl.disableVertexAttribArray(this.sceneInfo.vertexColorAttribute);
        this.gl.uniform1i(this.sceneInfo.drawModeVSUniform, ShaderType.shaderDefaut);
        this.gl.uniform1i(this.sceneInfo.drawModeFSUniform, ShaderType.shaderDefaut);
    }
   
}
