import { Uniform, ShaderMaterial, ShaderLib, ShaderChunk, Matrix4, Vector3, Vector4, Color } from 'three';
import { default as RadialDistortion } from '../cameras/distortions/RadialDistortion';

function pop(options, property, defaultValue) {
    if (options[property] === undefined) return defaultValue;
    const value = options[property];
    delete options[property];
    return value;
}

function popUniform(options, property, defaultValue) {
    const value = pop(options, property, defaultValue);
    if (options.uniforms[property])
        return options.uniforms[property];
    return new Uniform(value);
}

ShaderChunk.common = `
${ShaderChunk.common}
#ifdef USE_MAP4
varying highp vec3 vPosition;
#undef USE_MAP
#endif
`;

ShaderChunk.worldpos_vertex = `
${ShaderChunk.worldpos_vertex}
#ifdef USE_MAP4
  vPosition = transformed;
#endif
`;

ShaderChunk.color_pars_fragment = `
${ShaderChunk.color_pars_fragment}
${RadialDistortion.chunks.radial_pars_fragment}
uniform bool diffuseColorGrey;
#ifdef USE_MAP4
  uniform mat4 modelMatrix;
  uniform vec3 uvwPosition;
  uniform mat4 uvwPreTransform;
  uniform mat4 uvwPostTransform;
  uniform RadialDistortion uvDistortion;
  uniform sampler2D map;
  uniform float borderSharpness;
  uniform float debugOpacity;
#endif
`;

ShaderChunk.color_fragment = `
${ShaderChunk.color_fragment}
  if (diffuseColorGrey) {
    diffuseColor.rgb = vec3(dot(diffuseColor.rgb, vec3(0.333333)));
  }
#ifdef USE_MAP4
  // "uvwPreTransform * m" is equal to "camera.preProjectionMatrix * camera.matrixWorldInverse * modelMatrix"
  // but more stable when both the texturing and viewing cameras have large coordinate values
  mat4 m = modelMatrix;
  m[3].xyz -= uvwPosition;
  vec4 uvw = uvwPreTransform * m * vec4(vPosition, 1.);
  if( uvw.w > 0. && distort_radial(uvw, uvDistortion))
  {
    uvw = uvwPostTransform * uvw;
    uvw.xyz /= 2. * uvw.w;
    uvw.xyz += vec3(0.5);
    vec3 border = min(uvw.xyz, 1. - uvw.xyz);
    if (all(greaterThan(border,vec3(0.))))
    {
      vec4 color = texture2D(map, uvw.xy);
      color.a *= min(1., borderSharpness*min(border.x, border.y));
      diffuseColor.rgb = mix(diffuseColor.rgb, color.rgb, color.a);
    } else {
      diffuseColor.rgb = mix(diffuseColor.rgb, fract(uvw.xyz), debugOpacity);
    }
  }

#endif
`;

function definePropertyUniform(object, property, defaultValue) {
    object.uniforms[property] = new Uniform(object[property] || defaultValue);
    Object.defineProperty(object, property, {
        get: () => object.uniforms[property].value,
        set: (value) => {
            if (object.uniforms[property].value != value) {
                object.uniformsNeedUpdate = true;
                object.uniforms[property].value = value;
            }
        }
    });
}

class OrientedImageMaterial extends ShaderMaterial {
    constructor(options = {}) {
        const size = pop(options, 'size', 1);
        const diffuse = pop(options, 'diffuse', new Color(0xeeeeee));
        const uvwPosition = pop(options, 'uvwPosition', new Vector3());
        const uvwPreTransform = pop(options, 'uvwPreTransform', new Matrix4());
        const uvwPostTransform = pop(options, 'uvwPostTransform', new Matrix4());
        const uvDistortion = pop(options, 'uvDistortion', {R: new Vector4(), C: new Vector3()});
        const map = pop(options, 'map', null);
        const alphaMap = pop(options, 'alphaMap', null);
        const scale = pop(options, 'scale', 1);
        const borderSharpness = pop(options, 'borderSharpness', 10000);
        const diffuseColorGrey = pop(options, 'diffuseColorGrey', true);
        const debugOpacity = pop(options, 'debugOpacity', 0);
        options.vertexShader = options.vertexShader || ShaderLib.points.vertexShader;
        options.fragmentShader = options.fragmentShader || ShaderLib.points.fragmentShader;
        options.defines = options.defines || {};
        if (map) {
            options.defines.USE_MAP4 = '';
        }
        if (alphaMap) options.defines.USE_ALPHAMAP = '';
        if (options.vertexColors) options.defines.USE_COLOR = '';
        if (options.logarithmicDepthBuffer) options.defines.USE_LOGDEPTHBUF = '';
        if (pop(options, 'sizeAttenuation')) options.defines.USE_SIZEATTENUATION = '';
        super(options);
        definePropertyUniform(this, 'size', size);
        definePropertyUniform(this, 'diffuse', diffuse);
        definePropertyUniform(this, 'uvwPosition', uvwPosition);
        definePropertyUniform(this, 'uvwPreTransform', uvwPreTransform);
        definePropertyUniform(this, 'uvwPostTransform', uvwPostTransform);
        definePropertyUniform(this, 'uvDistortion', uvDistortion);
        definePropertyUniform(this, 'opacity', this.opacity);
        definePropertyUniform(this, 'map', map);
        definePropertyUniform(this, 'alphaMap', alphaMap);
        definePropertyUniform(this, 'scale', scale);
        definePropertyUniform(this, 'borderSharpness', borderSharpness);
        definePropertyUniform(this, 'diffuseColorGrey', diffuseColorGrey);
        definePropertyUniform(this, 'debugOpacity', debugOpacity);
    }

    setCamera(camera) {
        camera.getWorldPosition(this.uvwPosition);
        this.uvwPreTransform.copy(camera.matrixWorldInverse);
        this.uvwPreTransform.setPosition(0, 0, 0);
        this.uvwPreTransform.premultiply(camera.preProjectionMatrix);
        this.uvwPostTransform.copy(camera.postProjectionMatrix);

        // TODO: handle other distorsion types and arrays of distortions
        if (camera.distos && camera.distos.length == 1 && camera.distos[0].type === 'ModRad') {
            this.uvDistortion = camera.distos[0];
        } else {
            this.uvDistortion = { C: new THREE.Vector2(), R: new THREE.Vector4() };
            this.uvDistortion.R.w = Infinity;
        }
    }
}

export default OrientedImageMaterial;
