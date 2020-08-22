precision mediump float;

#define PI 3.1415926535897932384626433832795

uniform float uStrength;

varying vec2 scale; 

varying vec2 vUv;

void main() {
  vUv =  uv;
  vec3 pos = position;
  
  pos.x = pos.x + (sin(uv.y * PI)) * uStrength;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}