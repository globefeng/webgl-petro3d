import { StringXor } from '../sceneConsts';

const vsSource = `
attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec3 aVertexNormal;
attribute vec3 aVertexNormal2;
attribute vec2 aTextureCoord;
attribute vec2 aTextureCoord2;

uniform int uDrawModeVS;
uniform mat4 uModelMatrix;
uniform mat4 uPVMatrix;
uniform mat3 uNormalMatrix;
uniform vec3 uLightDirection;
uniform float uCosLength;
uniform float uSinLength;
const vec4 ambientColor = vec4(0.4, 0.4, 0.4, 1.0);

varying vec4 vColor;
varying vec2 vTextureCoord;

void main(void)
{
    if (uDrawModeVS == 5)
    {
        float x = aVertexPosition.x + aVertexNormal.x * uCosLength * aTextureCoord.x + aVertexNormal2.x * uSinLength * aTextureCoord.x;
        float y = aVertexPosition.y + aVertexNormal.y * uCosLength * aTextureCoord.x + aVertexNormal2.y * uSinLength * aTextureCoord.x;
        float z = aVertexPosition.z + aVertexNormal.z * uCosLength * aTextureCoord.x + aVertexNormal2.z * uSinLength * aTextureCoord.x;

        gl_Position = uPVMatrix * uModelMatrix * vec4(x, y, z, 1.0);

        vTextureCoord = aTextureCoord;
    }
    else if (uDrawModeVS == 6)
    {
        float x = aVertexPosition.x + aVertexNormal.x * uCosLength * aTextureCoord.x + aVertexNormal2.x * uSinLength * aTextureCoord.x;
        float y = aVertexPosition.y + aVertexNormal.y * uCosLength * aTextureCoord.x + aVertexNormal2.y * uSinLength * aTextureCoord.x;
        float z = aVertexPosition.z + aVertexNormal.z * uCosLength * aTextureCoord.x + aVertexNormal2.z * uSinLength * aTextureCoord.x;

        gl_Position = uPVMatrix * uModelMatrix * vec4(x, y, z, 1.0);

        vTextureCoord = aTextureCoord2;
    }
    else if (uDrawModeVS == 7 || uDrawModeVS == 8)
    {
        float x = aVertexPosition.x * aTextureCoord2.s;
        float y = aVertexPosition.y * aTextureCoord2.s;
        float z = aVertexPosition.z;

        mat4 m = mat4(1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        aVertexNormal.x, aVertexNormal.y, aVertexNormal.z, 1.0);

        gl_Position = uPVMatrix * m * uModelMatrix * vec4(x, y, z, 1.0);

        vTextureCoord = aTextureCoord;
        vColor = aVertexColor;
    }
    else
    {
        gl_Position = uPVMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
    }

    if (uDrawModeVS == 1 || uDrawModeVS == 5)
    {
        vColor = aVertexColor;
    }
    else if (uDrawModeVS == 2)
    {
        vTextureCoord = aTextureCoord;
    }
    else if (uDrawModeVS == 3)
    {
        vec3 transformedNormal = uNormalMatrix * aVertexNormal;
        float directionalLightWeighting = max(dot(transformedNormal, uLightDirection), 0.0);
        vColor = ambientColor + aVertexColor * directionalLightWeighting;
    }
    else if (uDrawModeVS == 4)
    {
        vTextureCoord = aTextureCoord;
    }
    else if (uDrawModeVS == 9)
    {
        float y = (aVertexPosition.y - uSinLength) / (uCosLength - uSinLength);
        vTextureCoord = vec2(y, y);
    }
    else
    {
        vColor = aVertexColor;
    }
}
`;

const fsSource = `
precision mediump float;

uniform int uDrawModeFS;
uniform vec3 uLowColorFS;
uniform vec3 uHighColorFS;
varying vec4 vColor;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void)
{
    if (uDrawModeFS == 1)
    {
        gl_FragColor = vColor;
    }
    else if (uDrawModeFS == 2)
    {
        gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        if (gl_FragColor.a < 0.001) discard;
    }
    else if (uDrawModeFS == 7)
    {
        gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)) * vColor;
        if (gl_FragColor.a < 0.95) discard;
    }
    else if (uDrawModeFS == 8)
    {
        gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        if (gl_FragColor.a < 0.95) discard;
        else
        {
            gl_FragColor = vColor;
        }
    }
    else if (uDrawModeFS == 4)
    {
        float m = vTextureCoord.t;
        float r = floor(m * 100.0);
        m -= r / 100.0;
        float g = floor(m * 10000.0);
        m -= g / 10000.0;
        float b = floor(m * 1000000.0);
        gl_FragColor = vec4(r / 100.0, g / 100.0, b / 100.0, 1);
    }
    else if (uDrawModeFS == 5)
    {
        vec3 c = mix(uLowColorFS, uHighColorFS, vTextureCoord.t);
        gl_FragColor = vec4(c, 1);
    }
    else if (uDrawModeFS == 9)
    {
        vec3 c = mix(uLowColorFS, uHighColorFS, vTextureCoord.t);
        gl_FragColor = vec4(c, 1);
    }
    else
    {
        gl_FragColor = vColor;
    }
}
  `;

  export function initShaderProgram(gl) {  
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
    
    gl.useProgram(shaderProgram); 

    return shaderProgram;
  }
  
  function loadShader(gl, atype, source) {
    const shader = gl.createShader(atype);
  
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
    }
  
    return shader;
  }