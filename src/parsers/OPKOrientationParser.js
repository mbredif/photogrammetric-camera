import { Vector3, Euler, Math } from 'three';
import PhotogrammetricCamera from '../cameras/PhotogrammetricCamera';

export default {
    /** @module OPKOrientationParser */
    /** Parse an orientation using the IGN Matis internal XML format
     * @function parse
     * @param {string} text - the text content of the OPK file.
     * @return {Camera[]} - an array of cameras.
     *
     */
    parse: function parse(text, source, name) {
			  const lines = text.split(/\n/);
				const header = [
					"CHANTIER : ",
					"PROJECTION : ",
					"REFERENTIEL ALTIMETRIQUE : ",
					"UNITE ANGLE  : ",
					"NOM	X	Y	Z	O	P	K	CAMERA"
				];
				for(var l=0; l<header.length; ++l)
				{
					if(!lines[l].startsWith(header[l]))
					{
						console.error("Error parsing OPT file line ",l," : ",lines[l]," should start with ",header[l], source);
						return null;
					}
				}
				const chantier = lines[0].substr(header[0].length);
				const projection = lines[1].substr(header[1].length); console.warn("projection not used ", projection);
				const alti = lines[2].substr(header[2].length); console.warn("alti not used ", alti);
				const angleInDegrees = lines[3].substr(header[3].length).trim() == "degre";
				const cameras = [];

				const euler = new Euler(0, 0, 0, 'XYZ');

				for(var l=5;l<lines.length && lines[l].trim()!="";++l)
				{
					const data = lines[l].split(/\s+/);
					const image = data[0];
					const x = Number(data[1]);
					const y = Number(data[2]);
					const z = Number(data[3]);
					var o = Number(data[4]);
					var p = Number(data[5]);
					var k = Number(data[6]);
					const cam = source.cameras[data[7]].clone();
					if(angleInDegrees) {
						o = Math.degToRad(o);
						p = Math.degToRad(p);
						k = Math.degToRad(k);
					}
					euler.set(o, p, k);
					cam.position.set(x, y, z);
					cam.quaternion.setFromEuler(euler);
					cam.name = image;
					cam.near = 100;
					cam.far = 10000;
					cameras.push(cam);
				}
        return cameras;
    },

		parseXYZ(text, filename) {
			const lines = text.split(/\n/);
			if(!lines[0].startsWith("ID\tX\tY\tZ\tMult\tStrip")) {
				console.error("Error parsing XYZ file line 0", lines[0], filename);
				return null;
			}
			if(lines[lines.length-1].trim() == "") lines.length = lines.length -1;
			const n = lines.length -1
			const position = new Float32Array(3*n);
			const multi =  new Uint16Array(n);
			const strip =  new Uint16Array(n);
			const name = [];
			for(var l=0; l<n; ++l) {
				const data = lines[1+l].split(/\s+/);
				name[l] = data[0];
				position[3*l+0] = Number(data[1]);
				position[3*l+1] = Number(data[2]);
				position[3*l+2] = Number(data[3]);
				multi[l] = Number(data[4]);
				strip[l] = Number(data[5]);
			}
			return {size : n, position, multi, strip, name};
		},

		parseMES(text, filename) {
			const lines = text.split(/\n/);
			if(lines[0].trim() !== "") {
				console.error("Error parsing MES file line 0", filename);
				return null;
			}
			if(lines[lines.length-1].trim() == "") lines.length = lines.length -1;
			const n = lines.length -1
			const position = new Float32Array(2*n);
			const name = [];
			const image = [];
			for(var l=0; l<n; ++l) {
				const data = lines[1+l].split(/\s+/);
				name[l] = data[0];
				image[l] = data[1];
				position[2*l+0] = Number(data[2]);
				position[2*l+1] = Number(data[3]);
			}
			return {size : n, position, name, image};
		},

    format: 'OPK/orientation',
    extensions: ['opk'],
    mimetypes: ['application/text'],
    fetchtype: 'text',
};
