precision mediump float;

uniform vec2 uRes;
uniform sampler2D uTexture;

uniform vec2 uMeshScale;

varying vec2 vUv;
varying vec2 scale;

vec2 sizeFit(vec2 uv, vec2 planeSize, vec2 imageSize ){
  
    vec2 ratio = vec2(
        min((planeSize.x / planeSize.y) / (imageSize.x / imageSize.y), 1.0),
        min((planeSize.y / planeSize.x) / (imageSize.y / imageSize.x), 1.0)
    );
    
    vec2 result = vec2(
        uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        uv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
    return result;
}

void main() {

    vec2 scaledPlane = uMeshScale * scale;
	vec2 imgUV = sizeFit(vUv, scaledPlane, uRes);

	gl_FragColor = mix(texture2D(uTexture, imgUV), vec4(1.0), 0.0);

}
