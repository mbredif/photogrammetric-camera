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

ShaderChunk.common = `${ShaderChunk.common}
#ifdef USE_WORLDPOS
varying vec3 vWorldPosition;
#endif
#ifdef USE_MAP4
#undef USE_MAP
#endif
`

ShaderChunk.worldpos_vertex = `
#if defined( USE_WORLDPOS ) || defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )
  vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
#endif
#ifdef USE_WORLDPOS
  vWorldPosition = worldPosition.xyz;
#endif
`

ShaderChunk.color_pars_fragment = `${ShaderChunk.color_pars_fragment}
${RadialDistortion.chunks.radial_pars_fragment}
uniform bool diffuseColorGrey;
#ifdef USE_MAP4
  uniform mat4 uvwPreTransform;
  uniform mat4 uvwPostTransform;
  uniform RadialDistortion uvDistortion;
  uniform sampler2D map;
  uniform float borderSharpness;
#endif
`

ShaderChunk.color_fragment = `${ShaderChunk.color_fragment}
  if (diffuseColorGrey) {
    diffuseColor.rgb = vec3(dot(diffuseColor.rgb, vec3(0.333333)));
  }
#ifdef USE_MAP4
	vec4 uvw = uvwPreTransform * vec4(vWorldPosition, 1);
  distort_radial(uvw, uvDistortion);
  uvw = uvwPostTransform * uvw;
  uvw.xyz /= 2. * uvw.w;
  uvw.xyz += vec3(0.5);
  vec3 border = min(uvw.xyz, 1. - uvw.xyz);
  if (all(greaterThan(border,vec3(0.))))
  {
    vec4 color = texture2D(map, uvw.xy);
    color.a *= min(1., borderSharpness*min(border.x, border.y));
    diffuseColor.rgb = mix(diffuseColor.rgb, color.rgb, color.a);
  }
#endif
`

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
        const diffuse = pop(options, 'color', new Color(0xeeeeee));
        const uvwPreTransform = pop(options, 'uvwPreTransform', new Matrix4());
        const uvwPostTransform = pop(options, 'uvwPostTransform', new Matrix4());
        const uvDistortion = pop(options, 'uvDistortion', {R: new Vector4(), C: new Vector3()});
        const map = pop(options, 'map', null);
        const alphaMap = pop(options, 'alphaMap', null);
        const scale = pop(options, 'scale', 1);
        const borderSharpness = pop(options, 'borderSharpness', 100);
        const diffuseColorGrey = pop(options, 'diffuseColorGrey', true);
        options.vertexShader = options.vertexShader || ShaderLib.points.vertexShader;
        options.fragmentShader = options.fragmentShader || ShaderLib.points.fragmentShader;
        options.defines = options.defines || {};
        if (map) {
            options.defines.USE_MAP4 = '';
            options.defines.USE_WORLDPOS = '';
        }
        if (alphaMap) options.defines.USE_ALPHAMAP = '';
        if (options.vertexColors) options.defines.USE_COLOR = '';
        if (options.logarithmicDepthBuffer) options.defines.USE_LOGDEPTHBUF = '';
        if (pop(options, 'sizeAttenuation')) options.defines.USE_SIZEATTENUATION = '';
        super(options);
        definePropertyUniform(this, 'size', size);
        definePropertyUniform(this, 'diffuse', diffuse);
        definePropertyUniform(this, 'uvwPreTransform', uvwPreTransform);
        definePropertyUniform(this, 'uvwPostTransform', uvwPostTransform);
        definePropertyUniform(this, 'uvDistortion', uvDistortion);
        definePropertyUniform(this, 'opacity', this.opacity);
        definePropertyUniform(this, 'map', map);
        definePropertyUniform(this, 'alphaMap', alphaMap);
        definePropertyUniform(this, 'scale', scale);
        definePropertyUniform(this, 'borderSharpness', borderSharpness);
        definePropertyUniform(this, 'diffuseColorGrey', diffuseColorGrey);
    }
}

export default OrientedImageMaterial;
