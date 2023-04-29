import * as mat4 from './glMatrix/mat4';
import * as mat3 from './glMatrix/mat3';
import * as vec3 from './glMatrix/vec3';

export const textureType = {
    camera2DEast: 0,
    camera2DNorth: 1,
    camera2DOrtho: 2,
    camera2DSouth: 3,
    camera2DTop: 4,
    camera2DWest: 5,
    camera3DOrtho: 6,
    camera3D: 7,
    compassHome: 8,
    compassTop: 9,
    compassNorth: 10,
    compassSouth: 11,
    compassEast: 12,
    compassWest: 13,
    compassRaw: 14,
    compassDip: 15,
    sphere: 16,
    white: 17
}

export const controlType = {
    None: -1,
    CameraNormal3D: 0,
    CameraOrtho3D: 1,
    CameraOrtho2D: 2,
    CameraNorth: 3,
    CameraEast: 4,
    CameraSouth: 5,
    CameraWest: 6,
    CameraTop: 7,
    CampassNorth: 8,
    CampassEast: 9,
    CampassSouth: 10,
    CampassWest: 11,
    CampassTop: 12,
    NavigationTop: 13,
    NavigationRight: 14,
    NavigationBottom: 15,
    NavigationLeft: 16,
    NavigationZoomIn: 17,
    NavigationZoomOut: 18,
    NavigationHome: 19
};

export const ShaderType = {
    shaderDefaut: 0,
    shaderColorOnly: 1,
    shaderTextureOnly: 2,
    shaderColorLighting: 3,
    shaderColorRatio: 4,
    shaderLasLog: 5,
    shaderLasLogDetail: 6,
    shaderEventInstancing: 7,
    shaderColorEventInstancing: 8,
    shaderColorDepth: 9   
}

export const HighlightColor = [1, 1, 1];

let uniqueID = 1;

export function getUniqueID(num) {
    let id = uniqueID + 1;
    uniqueID += num;
    return id;
}

export function ConvertIDToColor(id)
{
    var color0 = Math.floor(id % 256);
    id = id / 256;

    var color1 = Math.floor(id % 256);
    id = id / 256;

    var color2 = Math.floor(id % 256);

    return [color0 / 255.0, color1 / 255.0, color2 / 255.0, 1.0];
}


export function ConvertColorToFloat(red, green, blue) {
    return (red / 255.0) + (green / 255.0) / 100.0 + (blue / 255.0) / 10000;
}

export function ConvertRGBToID(red, green, blue) {
    return red + green * 256 + blue * 256 * 256;
}

export function invertNormalMatrix(mNormal) {
    var normalMatrix = mat3.create();
    mat3.identity(normalMatrix);
    mat3.fromMat4(normalMatrix, mNormal);
    mat3.transpose(normalMatrix, normalMatrix);
    mat3.invert(normalMatrix, normalMatrix);

    return normalMatrix;
}

export function RayIntersectPlane(rayPosition, rayDirection, p1, p2, p3) {
    let planeNormal = vec3.create();
    vec3.subtract(planeNormal, p1, p2);
    let P3P2 = vec3.create();
    vec3.subtract(P3P2, p3, p2);
    vec3.cross(planeNormal, planeNormal, P3P2);
    vec3.normalize(planeNormal, planeNormal);

    let dot = vec3.dot(planeNormal, rayDirection);

    if (Math.abs(dot) > 0.000001) {
        var v3 = vec3.create();
        vec3.subtract(v3, p2, rayPosition);
        let t = vec3.dot(v3, planeNormal) / dot;
        if (t < 0) {
            return null;
        }
        else if (t === 0) {
            return [rayPosition[0], rayDirection[1], rayDirection[2]];
        }
        else {
            vec3.scale(v3, rayDirection, t);
            vec3.add(v3, v3, rayPosition);

            if (IsPointInsideTriangle(v3, p1, p2, p3)) {
                return v3;
            }
        }
    }
    else return null;
}

export function PickingResult(status, position, renderable, control) {
    this.Status = status;
    this.Position = position;
    this.Renderable = renderable;
    this.Control = control;
    this.TopMD = null;
    this.BottomMD = null;
    this.TopPosition = null;
    this.BottomPosition = null;
    this.PickedID = 0;
    this.IsLasLog = false;
    this.Properties = [];
}

function IsPointInsideTriangle(p, a, b, c) {
    let v0 = vec3.create();
    let v1 = vec3.create();
    let v2 = vec3.create();
    vec3.subtract(v0, c, a);
    vec3.subtract(v1, b, a);
    vec3.subtract(v2, p, a);

    let dot00 = vec3.dot(v0, v0);
    let dot01 = vec3.dot(v0, v1);
    let dot02 = vec3.dot(v0, v2);
    let dot11 = vec3.dot(v1, v1);
    let dot12 = vec3.dot(v1, v2);

    let invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    let u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    let v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0 && v >= 0 && (u + v) < 1);
}

export function getScaleTranslationMatrix(width, height, position) {
    var mMatrix = mat4.create();
    mat4.identity(mMatrix);

    mat4.translate(mMatrix, mMatrix, position);
    mat4.scale(mMatrix, mMatrix, [width, height, 1]);

    return mMatrix;
}

export function getCircleMatrix(position, scale) {
    var mMatrix = mat4.create();
    mat4.identity(mMatrix);

    mat4.translate(mMatrix, mMatrix, position);
    mat4.scale(mMatrix, mMatrix, [scale, scale, 1]);
    return mMatrix;
};

export function getCompassMatrix(width, height, radius, angle) {
    var mMatrix = mat4.create();
    mat4.identity(mMatrix);
    mat4.rotateZ(mMatrix, mMatrix, angle);
    
    var position = vec3.create();
    vec3.transformMat4(position, [0, radius, 0], mMatrix);

    mat4.identity(mMatrix);
    mat4.translate(mMatrix, mMatrix, position);
    mat4.rotateZ(mMatrix, mMatrix, angle);
    mat4.scale(mMatrix, mMatrix, [width, height, 1]);

    return mMatrix;
}

export function getTriangleMatrix(position, width, height, angle) {
    var mMatrix = mat4.create();
    mat4.identity(mMatrix);

    mat4.translate(mMatrix, mMatrix, position);
    mat4.rotateZ(mMatrix, mMatrix, angle);
    mat4.scale(mMatrix, mMatrix, [width, height, 1]);
    return mMatrix;
};

export function getQuadMatrix(position, width, height) {
    var mMatrix = mat4.create();
    mat4.identity(mMatrix);

    mat4.translate(mMatrix, mMatrix, position);
    mat4.scale(mMatrix, mMatrix, [width, height, 1]);
    return mMatrix;
};

export function setTextToTexture(gl, textCanvasID, text, texture) {
    var image = document.getElementById(textCanvasID);
    if (image === undefined || image === null || image.getContext === null) return;

    var ctx = image.getContext('2d');
    ctx.beginPath();
    ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = "12px Arial";
    ctx.textAlign = 'center';
    ctx.fillText(text, ctx.canvas.width / 2, ctx.canvas.height / 2 + 4);
    ctx.restore();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

export function StringXor(str, num)
{
    var Result = '';
    for (var i = 0; i < str.length; i++)
    {
        Result += String.fromCharCode(num ^ str.charCodeAt(i));
    }
    return Result;
}

const formatTime = (time) => {
    return time < 10 ? '0' + time : time;
  }
  
export function getTimeString(time) {
    let dt = new Date();
    dt.setTime(time * 1000);
    return dt.getUTCFullYear() + '/' + formatTime(dt.getUTCMonth() + 1) + '/' + formatTime(dt.getUTCDate()) + ' ' +
           formatTime(dt.getUTCHours()) + ':' + formatTime(dt.getUTCMinutes()) + ':' + formatTime(dt.getUTCSeconds());
  }

export function LocalTangentPlane() {
    this.LT_init = function (IN_longitude, IN_latitude, IN_altitude)
    {
        IN_longitude = IN_longitude * Math.PI / 180;
        IN_latitude = IN_latitude * Math.PI / 180;

        this.LT_longitudeOrig = IN_longitude;
        this.LT_latitudeOrig = IN_latitude;

        this.LT_eSquare = 0.081819191 * 0.081819191;
        this.LT_earthSemiMajor = 6378137.0;
        this.LT_earthSemiMinor = 6356752.3142;

        this.LT_eccentricityMajor = (this.LT_earthSemiMajor * this.LT_earthSemiMajor - this.LT_earthSemiMinor * this.LT_earthSemiMinor) / (this.LT_earthSemiMajor * this.LT_earthSemiMajor);
        this.LT_eccentricityMinor = (this.LT_earthSemiMajor * this.LT_earthSemiMajor - this.LT_earthSemiMinor * this.LT_earthSemiMinor) / (this.LT_earthSemiMinor * this.LT_earthSemiMinor);

        this.LT_ltpOrig = this.LT_LLAToECEF(IN_longitude, IN_latitude, IN_altitude);
        var LP_ltpOrigTop = this.LT_LLAToECEF(IN_longitude, IN_latitude, IN_altitude + 1000);

        this.LT_normalUp = vec3.create();
        vec3.subtract(this.LT_normalUp, LP_ltpOrigTop, this.LT_ltpOrig);
        vec3.normalize(this.LT_normalUp, this.LT_normalUp);

        this.LT_normalEast = vec3.create();
        vec3.cross(this.LT_normalEast, [0, 0, 1], this.LT_normalUp);
        vec3.normalize(this.LT_normalEast, this.LT_normalEast);

        this.LT_normalNorth = vec3.create();
        vec3.cross(this.LT_normalNorth, this.LT_normalUp, this.LT_normalEast);
        vec3.normalize(this.LT_normalNorth, this.LT_normalNorth);

        this.LT_altitudeOrig = IN_altitude;
    }

    this.LT_LTP2LLA = function (IN_east, IN_north, IN_height) {
        let LT_east = vec3.create();
        vec3.scale(LT_east, this.LT_normalEast, IN_east);

        let LT_north = vec3.create();
        vec3.scale(LT_north, this.LT_normalNorth, IN_north);

        let LT_height = vec3.create();
        vec3.scale(LT_height, this.LT_normalUp, IN_height);

        vec3.add(LT_east, this.LT_ltpOrig, LT_east);
        vec3.add(LT_east, LT_north, LT_east);
        vec3.add(LT_east, LT_height, LT_east);

        LT_east = this.LT_ECEFToLLA(LT_east[0], LT_east[1], LT_east[2]);

        LT_east[0] *= 180 / Math.PI;
        LT_east[1] *= 180 / Math.PI;

        var LT_accuracy = 100000000;
        LT_east[0] = Math.floor(LT_east[0] * LT_accuracy) / LT_accuracy;
        LT_east[1] = Math.floor(LT_east[1] * LT_accuracy) / LT_accuracy;

        let LT_dmsLongitude = this.LT_RadianToDMS(LT_east[0], false);
        let LT_dmsLatitude = this.LT_RadianToDMS(LT_east[1], true);
        return [LT_east[0], LT_east[1], this.LT_altitudeOrig + IN_height, LT_dmsLongitude, LT_dmsLatitude];
    }

    this.LT_RadianToDegree = function (IN_radian) {
        let LT_degree = IN_radian * 180 / Math.PI;

        var LT_accuracy = 100000000;
        LT_degree = Math.floor(LT_degree * LT_accuracy) / LT_accuracy;
        return LT_degree;
    }

    this.LT_RadianToDMS = function(IN_radian, IN_isLatitude) {
        let LT_degree = 0;
        let LT_minute = 0;
        let LT_second = 0;

        let d = Math.abs(IN_radian);
    
        LT_degree = Math.floor(d);
    
        LT_second = (d - LT_degree) * 3600;
    
        LT_minute = Math.floor(LT_second / 60);
    
        LT_second = Math.floor((LT_second - (LT_minute * 60)) * 100) / 100;

        if (IN_radian < 0)
        {
            if (IN_isLatitude)
            {
                return LT_degree + '°' + LT_minute + '′' + LT_second + '" S';
            }
            else
            {
                return LT_degree + '°' + LT_minute + '′' + LT_second + '" W';
            }
        }
        else
        {
            if (IN_isLatitude) {
                return LT_degree + '°' + LT_minute + '′' + LT_second + '" N';
            }
            else {
                return LT_degree + '°' + LT_minute + '′' + LT_second + '" E';
            }
        }
    }

    this.LT_LLAToECEF = function(IN_longitude, IN_latitude, IN_height)
    {
        var n = this.LT_earthSemiMajor / Math.sqrt(1 - this.LT_eSquare * Math.sin(IN_latitude) * Math.sin(IN_latitude));
        let IN_x = (n + IN_height) * Math.cos(IN_latitude) * Math.cos(IN_longitude);
        let IN_y = (n + IN_height) * Math.cos(IN_latitude) * Math.sin(IN_longitude);
        let IN_z = (IN_height + (1 - this.LT_eSquare) * n) * Math.sin(IN_latitude);

        return [IN_x, IN_y, IN_z];
    }

    this.LT_ECEFToLLA = function (IN_x, IN_y, IN_z)
    {
        var IN_longitude = Math.atan2(IN_y, IN_x);

        var LT_p = Math.sqrt(IN_x * IN_x + IN_y * IN_y);
        var LT_theta = Math.atan2(IN_z * this.LT_earthSemiMajor, LT_p * this.LT_earthSemiMinor);

        var LT_sinTheta = Math.sin(LT_theta);
        var LT_cosTheta = Math.cos(LT_theta);

        var d = Math.atan2(IN_z + this.LT_eccentricityMinor * this.LT_earthSemiMinor * LT_sinTheta * LT_sinTheta * LT_sinTheta,
                         LT_p - this.LT_eccentricityMajor * this.LT_earthSemiMajor * LT_cosTheta * LT_cosTheta * LT_cosTheta);

        var IN_latitude = d;
        d = Math.sin(d);

        var IN_altitude = LT_p / Math.cos(IN_latitude) - this.LT_earthSemiMajor / Math.sqrt(1 - this.LT_eccentricityMajor * d * d);

        return [IN_longitude, IN_latitude, IN_altitude];
    }


}