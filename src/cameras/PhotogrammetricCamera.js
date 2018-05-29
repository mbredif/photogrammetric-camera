import * as THREE from 'three';

class PhotogrammetricCamera extends THREE.PerspectiveCamera {
    /**
     * @Constructor
     * @param {number|Vector2} focal - focal length in pixels (default: equal focal length in x and y)
     * @param {Vector2} size - image size in pixels
     * @param {Vector2} point - principal point in pixels (default: center)
     * @param {number} skew - shear transform parameter (default: 0)
     * @param {Distortion[]} distos - array of distortions, in the order of application used during projection (default: [])
     * @param {number} near - Camera frustum near plane (default: see THREE.PerspectiveCamera).
     * @param {number} far - Camera frustum far plane (default: see THREE.PerspectiveCamera).
     * @param {number} aspect - aspect ratio of the camera (default: computed from size).
     */
    constructor(focal, size, point, skew, distos, near, far, aspect) {
        focal = Array.isArray(focal) ? new THREE.Vector2().fromArray(focal) : (focal || 1024);
        point = Array.isArray(point) ? new THREE.Vector2().fromArray(point) : point;
        size = Array.isArray(size) ? new THREE.Vector2().fromArray(size) : (size || 1024);
        focal = focal.isVector2 ? focal : new THREE.Vector2(focal, focal);
        size = size.isVector2 ? size : new THREE.Vector2(size, size);
        skew = skew || 0;
        point = point || size.clone().multiplyScalar(0.5);
        aspect = aspect || size.x / size.y;

        super(undefined, aspect, near, far);
        // for compatibility with THREE.PerspectiveCamera, provide a fov property (computed from focal.y and size.y)
        Object.defineProperty(this, 'fov', {
            get: () => Math.atan2(this.size.y, 2 * this.focal.y) * 360 / Math.PI,
            // setting the fov overwrites focal.x and focal.y
            set: (fov) => {
                var focal = 0.5 * this.size.y / Math.tan(fov * Math.PI / 360);
                this.focal.x = focal;
                this.focal.y = focal;
            },
        });
        this.isPhotogrammetricCamera = true;
        this.size = size;
        this.focal = focal;
        this.point = point;
        this.skew = skew;
        this.distos = distos || [];
        this.zoom = 1;

        // filmOffset is not supported
        // filmGauge is only used in compatibility PerspectiveCamera functions
        this.filmOffset = 0;

        this.preProjectionMatrix = new THREE.Matrix4();
        this.postProjectionMatrix = new THREE.Matrix4();
        this.textureMatrix = new THREE.Matrix4();
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        if (!this.preProjectionMatrix) {
            return;
        }

        const c = -(this.far + this.near) / (this.far - this.near);
        const d = -2 * this.far * this.near / (this.far - this.near);
        this.preProjectionMatrix.set(
            this.focal.x, -this.skew, -this.point.x, 0,
            0, -this.focal.y, -this.point.y, 0,
            0, 0, c, d,
            0, 0, -1, 0);

        this.textureMatrix.set(
            1 / this.size.x, 0, 0, 0,
            0, 1 / this.size.y, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);

        var textureAspect = this.size.x / this.size.y;
        if (this.view !== null && this.view.enabled) {
            var sx = this.view.fullWidth / this.view.width;
            var sy = this.view.fullHeight / this.view.height;
            textureAspect = this.view.width / this.view.height;
            this.textureMatrix.premultiply(new THREE.Matrix4().set(
                sx, 0, 0, -sx * this.view.offsetX,
                0, sy, 0, -sy * this.view.offsetY,
                0, 0, 1, 0,
                0, 0, 0, 1));
        }

        var ndcMatrix = new THREE.Matrix4().set(
            2, 0, 0, -1,
            0, -2, 0, 1,
            0, 0, 1, 0,
            0, 0, 0, 1);
        this.postProjectionMatrix.multiplyMatrices(ndcMatrix, this.textureMatrix);

        // take zoom and aspect into account
        var aspectRatio = this.aspect / textureAspect;
        var zoom = new THREE.Vector2(this.zoom, this.zoom);
        if (aspectRatio > 1) {
            zoom.x /= aspectRatio;
        } else {
            zoom.y *= aspectRatio;
        }
        this.postProjectionMatrix.premultiply(new THREE.Matrix4().makeScale(zoom.x, zoom.y, 1));


        // projectionMatrix is provided as an approximation: its usage neglects the effects of distortions
        this.projectionMatrix.multiplyMatrices(this.postProjectionMatrix, this.preProjectionMatrix);
    }

    // transform in place a 3D point p from view coordinates to pixel coordinates in the distorted image frame:
    // Xleft=0, Xright=size.x, Ybottom=0, Ytop=size.y, Znear=-1, Zfar=1
    // this transform is not influenced by the aspect,  zoom
    distort(p) {
        p.applyMatrix4(this.matrixWorldInverse);
        p.applyMatrix4(this.preProjectionMatrix);
        p = this.distos.reduce((q, disto) => disto.project(q), p);
        return p;
    }

    // transform in place a 3D point p from view coordinates to texture coordinates:
    // Uleft=0, Uright=1, Vbottom=0, Vtop=1, Znear=-1, Zfar=1
    // this transform is not influenced by the aspect and zoom
    texture(p) {
        this.distort(p);
        p.applyMatrix4(this.textureMatrix);
        return p;
    }

    // transform in place a 3D point p from view coordinates to NDC coordinates:
    // Xleft=-1, Xright=1, Ybottom=-1, Ytop=1, Znear=-1, Zfar=1
    // this transform takes the aspect and zoom into account
    project(p) {
        this.distort(p);
        p.applyMatrix4(this.postProjectionMatrix);
        return p;
    }

    copy(source, recursive) {
        super.copy(source, recursive);
        this.isPhotogrammetricCamera = true;
        this.size = source.size.clone();
        this.focal = source.focal.clone();
        this.point = source.point.clone();
        this.skew = source.skew;
        this.distos = source.distos.slice(0); // shallow copy, here, is it an issue ?
        this.preProjectionMatrix = source.preProjectionMatrix.clone();
        this.postProjectionMatrix = source.postProjectionMatrix.clone();
        this.textureMatrix = source.textureMatrix.clone();
        return this;
    }

    // THREE.PerspectiveCamera compatibility
    getEffectiveFOV() {
        return Math.atan2(this.size.y, 2 * this.focal.y * this.zoom) * 360 / Math.PI;
    }

    getFocalLength() {
        return this.focal.y * this.getFilmHeight() / this.size.y;
    }

    setFocalLength(focalLength) {
        focalLength *= this.size.y / this.getFilmHeight();
        this.focal.x = focalLength;
        this.focal.y = focalLength;
        this.updateProjectionMatrix();
    }
}

export default PhotogrammetricCamera;
