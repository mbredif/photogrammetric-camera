import {Matrix4, Quaternion, Camera} from 'three';
import PhotogrammetricDistortion from '../cameras/PhotogrammetricDistortion';
import PhotogrammetricCamera from '../cameras/PhotogrammetricCamera';

function getText(xml, tagName) {
    var node = xml.getElementsByTagName(tagName)[0];
    return node && node.childNodes[0].nodeValue.trim();
}

function getNumber(xml, tagName) {
    return Number(getText(xml, tagName));
}

function getNumbers(xml, tagName, dims) {
    var node = xml.getElementsByTagName(tagName)[0];
    return dims.map(dim => getNumber(node, dim));
}

function parseSpheric(xml, size) {
    var camera = new Camera();
    camera.lambdaphi = getNumbers(xml, 'frame', ['lambda_min', 'lambda_max', 'phi_min', 'phi_max']);
    // patching the ori.MatisOrientationParser..
    camera.view.fullHeight = 718;
    camera.lambdaphi[2] = camera.lambdaphi[3] - camera.view.fullHeight * (camera.lambdaphi[1] - camera.lambdaphi[0]) / camera.view.fullWidth;
    // set the projection to the top face of the cube map
    camera.projectionMatrix = new Matrix4().set(
        camera.view.fullWidth, 0, camera.view.fullWidth * 0.5, 0,
        0, camera.view.fullHeight, camera.view.fullHeight * 0.5, 0,
        0, 0, 0, 1,
        0, 0, 1, 0);
    return camera;
}

function parseConic(xml, size) {
    var focal = getNumbers(xml, 'focale');
    var point = getNumbers(xml, 'ppa', ['c', 'l']);
    var skew = 0;
    var disto = {
        C: getNumbers(xml, 'pps', ['c', 'l']), // distortion center
        R: getNumbers(xml, 'distortion', ['r3', 'r5', 'r7']), // radial distortion coefficients
        project: RadialDistortion.project,
    };
    disto.r2max = PhotogrammetricDistortion.r2max(disto.R);
    var near = focal[0] * 0.035 / size[0]; // horizontal focal length in meters, assuming a 35mm-wide sensor
    var far = 1000; // 1km
    return new PhotogrammetricCamera(focal, size, point, skew, [disto], near, far);
}

function parseIntrinsics(xml) {
    var size = getNumbers(xml, 'image_size', ['width', 'height']);

    var spheric = xml.getElementsByTagName('spherique')[0];
    if (spheric) {
        return parseSpheric(spheric, size);
    }

    var sensor = xml.getElementsByTagName('sensor')[0];
    if (sensor) {
        return parseConic(sensor, size);
    }

    throw new Error('error parsing matis orientation');
}

function parseExtrinsics(xml) {
    xml = xml.getElementsByTagName('extrinseque')[0];
    var mat3d = xml.getElementsByTagName('mat3d')[0];
    var M = new Matrix4();

    if (mat3d) {
        var L1 = getNumbers(mat3d, 'l1', ['x', 'y', 'z']);
        var L2 = getNumbers(mat3d, 'l2', ['x', 'y', 'z']);
        var L3 = getNumbers(mat3d, 'l3', ['x', 'y', 'z']);
        M.set(
            L1[0], L1[1], L1[2], 0,
            L2[0], L2[1], L2[2], 0,
            L3[0], L3[1], L3[2], 0,
            0, 0, 0, 1);
    } else {
        var quat = getNumbers(xml, 'quaternion', ['x', 'y', 'z', 'w']);
        M.makeRotationFromQuaternion(new Quaternion().fromArray(quat));
    }

    if (!getText(xml, 'Image2Ground')) M.transpose();

    M.elements[12] = getNumber(xml, 'easting');
    M.elements[13] = getNumber(xml, 'northing');
    M.elements[14] = getNumber(xml, 'altitude');

    // go from photogrammetric convention (X right, Y down, Z front) to js conventions (X right, Y up, Z back)
    M.scale(new Vector3(1, -1, -1));
    return M;
}

export default {
    /** @module MatisOrientationParser */
    /** Parse an orientation using the IGN Matis internal XML format
     * @function parse
     * @param {string|XMLDocument} xml - the xml content of the orientation file.
     * @return {Camera} - a camera.
     *
     */
    parse: function parse(xml) {
        if (!(xml instanceof Node)) {
            xml = new window.DOMParser().parseFromString(xml, 'text/xml');
        }
        if (xml.children[0].tagName !== 'orientation') {
            return undefined;
        }
        var camera = parseIntrinsics(xml);

        camera.matrix = parseExtrinsics(xml);
        camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
        camera.updateMatrixWorld(true);

        return camera;
    },
    format: 'matis/orientation',
    extensions: ['xml'],
    mimetypes: ['application/xml'],
    fetchtype: 'xml',
};
