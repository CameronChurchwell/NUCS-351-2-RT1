// cuon-matrix.js (c) 2012 kanda and matsuda
/** 
 * This is a class treating 4x4 matrix from the book 
 *	'WebGL Programming Guide' (2013),
 * MODIFIED 2/2014,8 by Jack Tumblin and students in Northwestern Univ EECS 351-1
 * "Intro to Computer Grapics'.
 * --added 'pushMatrix()' and 'popMatrix()' member fcns to provide a push-down/
 *    pop-up stack for any Matrix4 object, useful for traversing scene graphs.
 * --added Quaternion class (at end; modified from early THREE.js library)
 * --added 'printMe' member functions to print vector, matrix, and quaternions
 *	     in JavaScript console using 'console.log()' function
 *
 * --This library's 'setXXX()' functions replace current matrix contents;
 *  (e.g. setIdentity(), setRotate(), etc) and its 'concat()' and 'XXX()' fcns
 *  (e.g. rotate(), translate(), scale() etc) multiply current matrix contents 
 * with a with the function's newly-created matrix, e.g.:
 *  					[M_new] = [M_old][M_rotate] 
 * and returns matrix M_new.
 */

/**
 * Constructor of Matrix4
 * If opt_src is specified, new matrix is initialized by opt_src.
 * Otherwise, new matrix is initialized by identity matrix.
 * @param opt_src source matrix(option)
 */
export class Matrix4 {
    elements: Float32Array;

    constructor(opt_src?) {
        this.elements = new Float32Array(16);
        if (opt_src instanceof Matrix4) {
            this.elements.set(opt_src.elements);
        } else if (opt_src) {
            this.elements.set(opt_src);
        } else {
            this.elements = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
        }
    };

    setIdentity() {
        var e = this.elements;
        e[0] = 1;   e[4] = 0;   e[8]  = 0;   e[12] = 0;
        e[1] = 0;   e[5] = 1;   e[9]  = 0;   e[13] = 0;
        e[2] = 0;   e[6] = 0;   e[10] = 1;   e[14] = 0;
        e[3] = 0;   e[7] = 0;   e[11] = 0;   e[15] = 1;
        return this;
    };

    set(src) {
        var i, s, d;
        s = src.elements;
        d = this.elements;
        if (s === d) {		// do nothing if given 'this' as arg.
            return;
        }
        for (i = 0; i < 16; ++i) {	
            d[i] = s[i];
        }
        return this;
    };

    concat(other) {
        var i, e, a, b, ai0, ai1, ai2, ai3;
  
        // Calculate e = a * b
        e = this.elements;
        a = this.elements;
        b = other.elements;
  
        // If e equals b, copy b to temporary matrix.
        if (e === b) {
            b = new Float32Array(16);
            for (i = 0; i < 16; ++i) {
                b[i] = e[i];
            }
        }
  
        for (i = 0; i < 4; i++) {
            ai0=a[i];  ai1=a[i+4];  ai2=a[i+8];  ai3=a[i+12];
            e[i]    = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
            e[i+4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
            e[i+8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
            e[i+12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
        }
  
        return this;
    };

    multiply = this.concat;

    multiplyVector3(pos: Vector3, destination?: Vector3) {
        var e = this.elements;
        var p = pos.elements;
        var v = (destination ?? pos).elements;

        const x = p[0] * e[0] + p[1] * e[4] + p[2] * e[ 8] + e[12]; // note the added 4th column
        const y = p[0] * e[1] + p[1] * e[5] + p[2] * e[ 9] + e[13]; // (presumes hidden 4th vector element w==1)
        const z = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + e[14];

        v[0] = x;
        v[1] = y;
        v[2] = z;

        return (destination ?? pos);
    };

    multiplyVector4(pos) {
        var e = this.elements;
        var p = pos.elements;
        var v = new Vector4();
        var result = v.elements;

        result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[ 8] + p[3] * e[12];
        result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[ 9] + p[3] * e[13];
        result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + p[3] * e[14];
        result[3] = p[0] * e[3] + p[1] * e[7] + p[2] * e[11] + p[3] * e[15];

        return v;
    };

    transpose() {
        var e, t;
        
        e = this.elements;
        
        t = e[ 1];  e[ 1] = e[ 4];  e[ 4] = t;
        t = e[ 2];  e[ 2] = e[ 8];  e[ 8] = t;
        t = e[ 3];  e[ 3] = e[12];  e[12] = t;
        t = e[ 6];  e[ 6] = e[ 9];  e[ 9] = t;
        t = e[ 7];  e[ 7] = e[13];  e[13] = t;
        t = e[11];  e[11] = e[14];  e[14] = t;
        
        return this;
    };

    setInverseOf(other) {
        var i, s, d, inv, det;
      
        s = other.elements;
        d = this.elements;
        inv = new Float32Array(16);
      
        inv[0]  =   s[5]*s[10]*s[15] - s[5] *s[11]*s[14] - s[9] *s[6]*s[15]
                  + s[9]*s[7] *s[14] + s[13]*s[6] *s[11] - s[13]*s[7]*s[10];
        inv[4]  = - s[4]*s[10]*s[15] + s[4] *s[11]*s[14] + s[8] *s[6]*s[15]
                  - s[8]*s[7] *s[14] - s[12]*s[6] *s[11] + s[12]*s[7]*s[10];
        inv[8]  =   s[4]*s[9] *s[15] - s[4] *s[11]*s[13] - s[8] *s[5]*s[15]
                  + s[8]*s[7] *s[13] + s[12]*s[5] *s[11] - s[12]*s[7]*s[9];
        inv[12] = - s[4]*s[9] *s[14] + s[4] *s[10]*s[13] + s[8] *s[5]*s[14]
                  - s[8]*s[6] *s[13] - s[12]*s[5] *s[10] + s[12]*s[6]*s[9];
      
        inv[1]  = - s[1]*s[10]*s[15] + s[1] *s[11]*s[14] + s[9] *s[2]*s[15]
                  - s[9]*s[3] *s[14] - s[13]*s[2] *s[11] + s[13]*s[3]*s[10];
        inv[5]  =   s[0]*s[10]*s[15] - s[0] *s[11]*s[14] - s[8] *s[2]*s[15]
                  + s[8]*s[3] *s[14] + s[12]*s[2] *s[11] - s[12]*s[3]*s[10];
        inv[9]  = - s[0]*s[9] *s[15] + s[0] *s[11]*s[13] + s[8] *s[1]*s[15]
                  - s[8]*s[3] *s[13] - s[12]*s[1] *s[11] + s[12]*s[3]*s[9];
        inv[13] =   s[0]*s[9] *s[14] - s[0] *s[10]*s[13] - s[8] *s[1]*s[14]
                  + s[8]*s[2] *s[13] + s[12]*s[1] *s[10] - s[12]*s[2]*s[9];
      
        inv[2]  =   s[1]*s[6]*s[15] - s[1] *s[7]*s[14] - s[5] *s[2]*s[15]
                  + s[5]*s[3]*s[14] + s[13]*s[2]*s[7]  - s[13]*s[3]*s[6];
        inv[6]  = - s[0]*s[6]*s[15] + s[0] *s[7]*s[14] + s[4] *s[2]*s[15]
                  - s[4]*s[3]*s[14] - s[12]*s[2]*s[7]  + s[12]*s[3]*s[6];
        inv[10] =   s[0]*s[5]*s[15] - s[0] *s[7]*s[13] - s[4] *s[1]*s[15]
                  + s[4]*s[3]*s[13] + s[12]*s[1]*s[7]  - s[12]*s[3]*s[5];
        inv[14] = - s[0]*s[5]*s[14] + s[0] *s[6]*s[13] + s[4] *s[1]*s[14]
                  - s[4]*s[2]*s[13] - s[12]*s[1]*s[6]  + s[12]*s[2]*s[5];
      
        inv[3]  = - s[1]*s[6]*s[11] + s[1]*s[7]*s[10] + s[5]*s[2]*s[11]
                  - s[5]*s[3]*s[10] - s[9]*s[2]*s[7]  + s[9]*s[3]*s[6];
        inv[7]  =   s[0]*s[6]*s[11] - s[0]*s[7]*s[10] - s[4]*s[2]*s[11]
                  + s[4]*s[3]*s[10] + s[8]*s[2]*s[7]  - s[8]*s[3]*s[6];
        inv[11] = - s[0]*s[5]*s[11] + s[0]*s[7]*s[9]  + s[4]*s[1]*s[11]
                  - s[4]*s[3]*s[9]  - s[8]*s[1]*s[7]  + s[8]*s[3]*s[5];
        inv[15] =   s[0]*s[5]*s[10] - s[0]*s[6]*s[9]  - s[4]*s[1]*s[10]
                  + s[4]*s[2]*s[9]  + s[8]*s[1]*s[6]  - s[8]*s[2]*s[5];
      
        det = s[0]*inv[0] + s[1]*inv[4] + s[2]*inv[8] + s[3]*inv[12];
        if (det === 0) {
          return this;
        }
      
        det = 1 / det;
        for (i = 0; i < 16; i++) {
          d[i] = inv[i] * det;
        }
      
        return this;
    };

    invert() {
        return this.setInverseOf(this);
    };

    setOrtho(left, right, bottom, top, near, far) {
        var e, rw, rh, rd;
      
        if (left === right || bottom === top || near === far) {
          throw 'null frustum';
        }
      
        rw = 1 / (right - left);
        rh = 1 / (top - bottom);
        rd = 1 / (far - near);
      
        e = this.elements;
      
        e[0]  = 2 * rw;
        e[1]  = 0;
        e[2]  = 0;
        e[3]  = 0;
      
        e[4]  = 0;
        e[5]  = 2 * rh;
        e[6]  = 0;
        e[7]  = 0;
      
        e[8]  = 0;
        e[9]  = 0;
        e[10] = -2 * rd;
        e[11] = 0;
      
        e[12] = -(right + left) * rw;
        e[13] = -(top + bottom) * rh;
        e[14] = -(far + near) * rd;
        e[15] = 1;
      
        return this;
    };

    ortho(left, right, bottom, top, near, far) {
        return this.concat(new Matrix4().setOrtho(left, right, bottom, top, near, far));
    };

    setFrustum(left, right, bottom, top, near, far) {
        var e, rw, rh, rd;
      
        if (left === right || top === bottom || near === far) {
          throw 'null frustum';
        }
        if (near <= 0) {
          throw 'near <= 0';
        }
        if (far <= 0) {
          throw 'far <= 0';
        }
      
        rw = 1 / (right - left);
        rh = 1 / (top - bottom);
        rd = 1 / (far - near);
      
        e = this.elements;
      
        e[ 0] = 2 * near * rw;
        e[ 1] = 0;
        e[ 2] = 0;
        e[ 3] = 0;
      
        e[ 4] = 0;
        e[ 5] = 2 * near * rh;
        e[ 6] = 0;
        e[ 7] = 0;
      
        e[ 8] = (right + left) * rw;
        e[ 9] = (top + bottom) * rh;
        e[10] = -(far + near) * rd;
        e[11] = -1;
      
        e[12] = 0;
        e[13] = 0;
        e[14] = -2 * near * far * rd;
        e[15] = 0;
      
        return this;
    };

    frustum(left, right, bottom, top, near, far) {
        return this.concat(new Matrix4().setFrustum(left, right, bottom, top, near, far));
    };

    setPerspective(fovy, aspect, near, far) {
        var e, rd, s, ct;
      
        if (near === far || aspect === 0) {
          throw 'null frustum';
        }
        if (near <= 0) {
          throw 'near <= 0';
        }
        if (far <= 0) {
          throw 'far <= 0';
        }
      
        fovy = Math.PI * fovy / 180 / 2;
        s = Math.sin(fovy);
        if (s === 0) {
          throw 'null frustum';
        }
      
        rd = 1 / (far - near);
        ct = Math.cos(fovy) / s;
      
        e = this.elements;
      
        e[0]  = ct / aspect;
        e[1]  = 0;
        e[2]  = 0;
        e[3]  = 0;
      
        e[4]  = 0;
        e[5]  = ct;
        e[6]  = 0;
        e[7]  = 0;
      
        e[8]  = 0;
        e[9]  = 0;
        e[10] = -(far + near) * rd;
        e[11] = -1;
      
        e[12] = 0;
        e[13] = 0;
        e[14] = -2 * near * far * rd;
        e[15] = 0;
      
        return this;
    };
      
    perspective(fovy, aspect, near, far) {
        return this.concat(new Matrix4().setPerspective(fovy, aspect, near, far));
    };

    setScale = function(x, y, z) {
        var e = this.elements;
        e[0] = x;  e[4] = 0;  e[8]  = 0;  e[12] = 0;
        e[1] = 0;  e[5] = y;  e[9]  = 0;  e[13] = 0;
        e[2] = 0;  e[6] = 0;  e[10] = z;  e[14] = 0;
        e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
        return this;
    };

    scale = function(x, y, z) {
        var e = this.elements;
        e[0] *= x;  e[4] *= y;  e[8]  *= z;
        e[1] *= x;  e[5] *= y;  e[9]  *= z;
        e[2] *= x;  e[6] *= y;  e[10] *= z;
        e[3] *= x;  e[7] *= y;  e[11] *= z;
        return this;
    };

    setAffine(M: Matrix4, b: Vector3 | Vector4) {
        this.elements.set(M.elements);
        this.elements[12] = b.elements[0];
        this.elements[13] = b.elements[1];
        this.elements[14] = b.elements[2];
        this.elements[15] = 1;
    }

    setTranslate = function(x: number, y: number, z: number) {
        var e = this.elements;
        e[0] = 1;  e[4] = 0;  e[8]  = 0;  e[12] = x;
        e[1] = 0;  e[5] = 1;  e[9]  = 0;  e[13] = y;
        e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = z;
        e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
        return this;
    };

    translate = function(x: number, y: number, z: number) {
        var e = this.elements;
        e[12] += e[0] * x + e[4] * y + e[8]  * z;
        e[13] += e[1] * x + e[5] * y + e[9]  * z;
        e[14] += e[2] * x + e[6] * y + e[10] * z;
        e[15] += e[3] * x + e[7] * y + e[11] * z;
        return this;
    };

    setRotate(angle, x, y, z) {
        var e, s, c, len, rlen, nc, xy, yz, zx, xs, ys, zs;
      
        angle = Math.PI * angle / 180;
        e = this.elements;
      
        s = Math.sin(angle);
        c = Math.cos(angle);
      
        if (0 !== x && 0 === y && 0 === z) {
            // Rotation around X axis
            if (x < 0) {
                s = -s;
            }
            e[0] = 1;  e[4] = 0;  e[ 8] = 0;  e[12] = 0;
            e[1] = 0;  e[5] = c;  e[ 9] =-s;  e[13] = 0;
            e[2] = 0;  e[6] = s;  e[10] = c;  e[14] = 0;
            e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
        } else if (0 === x && 0 !== y && 0 === z) {
            // Rotation around Y axis
            if (y < 0) {
                s = -s;
            }
            e[0] = c;  e[4] = 0;  e[ 8] = s;  e[12] = 0;
            e[1] = 0;  e[5] = 1;  e[ 9] = 0;  e[13] = 0;
            e[2] =-s;  e[6] = 0;  e[10] = c;  e[14] = 0;
            e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
        } else if (0 === x && 0 === y && 0 !== z) {
            // Rotation around Z axis
            if (z < 0) {
                s = -s;
            }
            e[0] = c;  e[4] =-s;  e[ 8] = 0;  e[12] = 0;
            e[1] = s;  e[5] = c;  e[ 9] = 0;  e[13] = 0;
            e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = 0;
            e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
        } else {
            // Rotation around another axis
            len = Math.sqrt(x*x + y*y + z*z);
            if (len !== 1) {
                rlen = 1 / len;
                x *= rlen;
                y *= rlen;
                z *= rlen;
            }
            nc = 1 - c;
            xy = x * y;
            yz = y * z;
            zx = z * x;
            xs = x * s;
            ys = y * s;
            zs = z * s;
        
            e[ 0] = x*x*nc +  c;
            e[ 1] = xy *nc + zs;
            e[ 2] = zx *nc - ys;
            e[ 3] = 0;
        
            e[ 4] = xy *nc - zs;
            e[ 5] = y*y*nc +  c;
            e[ 6] = yz *nc + xs;
            e[ 7] = 0;
        
            e[ 8] = zx *nc + ys;
            e[ 9] = yz *nc - xs;
            e[10] = z*z*nc +  c;
            e[11] = 0;
        
            e[12] = 0;
            e[13] = 0;
            e[14] = 0;
            e[15] = 1;
        }
        return this;
    } 

    rotate(angle, x, y, z) {
        return this.concat(new Matrix4().setRotate(angle, x, y, z));
    };

    setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
        var e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;
      
        fx = centerX - eyeX;
        fy = centerY - eyeY;
        fz = centerZ - eyeZ;
      
        // Normalize f.
        rlf = 1 / Math.sqrt(fx*fx + fy*fy + fz*fz);
        fx *= rlf;
        fy *= rlf;
        fz *= rlf;
      
        // Calculate cross product of f and up.
        sx = fy * upZ - fz * upY;
        sy = fz * upX - fx * upZ;
        sz = fx * upY - fy * upX;
      
        // Normalize s.
        rls = 1 / Math.sqrt(sx*sx + sy*sy + sz*sz);
        sx *= rls;
        sy *= rls;
        sz *= rls;
      
        // Calculate cross product of s and f.
        ux = sy * fz - sz * fy;
        uy = sz * fx - sx * fz;
        uz = sx * fy - sy * fx;
      
        // Set to this.
        e = this.elements;
        e[0] = sx;
        e[1] = ux;
        e[2] = -fx;
        e[3] = 0;
      
        e[4] = sy;
        e[5] = uy;
        e[6] = -fy;
        e[7] = 0;
      
        e[8] = sz;
        e[9] = uz;
        e[10] = -fz;
        e[11] = 0;
      
        e[12] = 0;
        e[13] = 0;
        e[14] = 0;
        e[15] = 1;
      
        // Translate.
        return this.translate(-eyeX, -eyeY, -eyeZ);
    };

    lookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
        return this.concat(new Matrix4().setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ));
    };

    lookAtVecs(position: Vector3, lookDirection: Vector3, upDir: Vector3) {
        // let lookAt = position.add(lookDirection);
        let [eyeX, eyeY, eyeZ] = position.elements;
        let centerX = position.elements[0] + lookDirection.elements[0];
        let centerY = position.elements[1] + lookDirection.elements[1];
        let centerZ = position.elements[2] + lookDirection.elements[2];
        let [upX, upY, upZ] = upDir.elements;
        return this.concat(new Matrix4().setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ));
    }

    dropShadow(plane, light) {
        var mat = new Matrix4();
        var e = mat.elements;
      
        var dot = plane[0] * light[0] + plane[1] * light[1] + plane[2] * light[2] + plane[3] * light[3];
      
        e[ 0] = dot - light[0] * plane[0];
        e[ 1] =     - light[1] * plane[0];
        e[ 2] =     - light[2] * plane[0];
        e[ 3] =     - light[3] * plane[0];
      
        e[ 4] =     - light[0] * plane[1];
        e[ 5] = dot - light[1] * plane[1];
        e[ 6] =     - light[2] * plane[1];
        e[ 7] =     - light[3] * plane[1];
      
        e[ 8] =     - light[0] * plane[2];
        e[ 9] =     - light[1] * plane[2];
        e[10] = dot - light[2] * plane[2];
        e[11] =     - light[3] * plane[2];
      
        e[12] =     - light[0] * plane[3];
        e[13] =     - light[1] * plane[3];
        e[14] =     - light[2] * plane[3];
        e[15] = dot - light[3] * plane[3];
      
        return this.concat(mat);
    };

    dropShadowDirectionally(normX, normY, normZ, planeX, planeY, planeZ, lightX, lightY, lightZ) {
        var a = planeX * normX + planeY * normY + planeZ * normZ;
        return this.dropShadow([normX, normY, normZ, -a], [lightX, lightY, lightZ, 0]);
    };

    setFromQuat(qx, qy, qz, qw) {
        var e = this.elements;
        e[0] = 1 -2*qy*qy -2*qz*qz;
        e[4] = 2*qx*qy -2*qw*qz;
        e[8] = 2*qx*qz +2*qw*qy; 
        e[12] = 0;
        e[1] = 2*qx*qy +2*qw*qz;
        e[5] = 1 -2*qx*qx -2*qz*qz;
        e[9] = 2*qy*qz -2*qw*qx;
        e[13] = 0;
        e[2] = 2*qx*qz -2*qw*qy;
        e[6] = 2*qy*qz +2*qw*qx;
        e[10] = 1 -2*qx*qx -2*qy*qy;
        e[14] = 0;
        e[3]= 0;
        e[7]= 0;
        e[11] = 0;
        e[15] = 1;
        return this;
    };


};


//taken from https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
function _base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}
// @ts-ignore
import wasm from '../C/Vector3.wasm';
const b = _base64ToArrayBuffer(wasm.split(',')[1]);
let wasmCode = await WebAssembly.instantiate(b);
let add_vector3 = (wasmCode.instance.exports.add_vector3 as any);
let allocate_vector3 = (wasmCode.instance.exports.allocate_vector3 as any);
let free_vector3 = (wasmCode.instance.exports.free_vector3 as any);
let vector3_memory = new Float32Array((wasmCode.instance.exports.memory as WebAssembly.Memory).buffer);
/**
 * Constructor of Vector3
 * If opt_src is specified, new vector is initialized by opt_src.
 * @param opt_src source vector(option)
 * JT: aVec = new Vector3(); // Makes zero-valued Vector3
 *     aVec = new Vector3([5,6,7]); // sets aVec to 5,6,7 -- don't forget []!!
 */
export class Vector3 {
    pointer: number
    elements: Float32Array;

    // constructor(opt_src?) {
    //     var v = new Float32Array(3);
    //     if (opt_src instanceof Vector3) {
    //         v.set(opt_src.elements);
    //     } else if (opt_src) {
    //         v.set(opt_src);
    //     }
    //     this.elements = v;
    // }

    // constructor(opt_src?: Vector3 | number[] | Float32Array) {
    //     this.elements = new Float32Array(3);
    //     if (opt_src instanceof Vector3) {
    //         this.elements.set(opt_src.elements);
    //     } else if (opt_src) {
    //         this.elements.set(opt_src);
    //     }
    // }

    constructor(opt_src?: Vector3 | number[] | Float32Array, wasm: boolean = false) {
        console.log('allocating new vector3');
        if (wasm) {
            this.pointer = allocate_vector3();
            this.elements = vector3_memory.subarray(this.pointer, this.pointer+3);
        } else {
            this.pointer = null;
            this.elements = new Float32Array([0, 0, 0]);
        }
        if (opt_src instanceof Vector3) {
            this.elements.set(opt_src.elements);
        } else if (opt_src) {
            this.elements.set(opt_src);
        }
        // console.log(this.pointer);
    }

    destructor() {
        free_vector3(this.pointer);
    }

    // normalize() {
    //     var v = this.elements;
    //     // find the length of the vector:
    //     var c = v[0], d = v[1], e = v[2], g = Math.sqrt(c*c+d*d+e*e);
    //     if(g){              // if given vector had non-zero length,
    //         if(g == 1)        // AND that vector length is already 1.0,
    //             return this;  // DO NOTHING. Keep current vector contents.
    //     } else {           // ELSE we got an empty, undefined, or zero-length vector.
    //         v[0] = 0; v[1] = 0; v[2] = 0;  // set its elements to zero-length, and
    //         return this;     // return
    //     }
    //     // Nope; we have valid vector--adjust its length to 1.0.
    //     g = 1/g;
    //     v[0] = c*g; v[1] = d*g; v[2] = e*g;
    //     return this;
    // };

    normalize() {
        this.scaleInPlace(1/this.magnitude());
        return this;
    }

    // dot(opt_src: Vector3) {
    //     var vA = this.elements; // short-hand for the calling object
    //     if(opt_src && typeof opt_src === 'object' && opt_src.hasOwnProperty('elements')) {
    //         var vB = opt_src.elements;  // short-hand for the Vector3 argument
    //         }
    //     else {
    //         console.log('ERROR! dot() function needs Vec3 argument! \n');
    //         return 0.0;
    //     }
    //     return vA[0]*vB[0] + vA[1]*vB[1] + vA[2]*vB[2];  // compute dot-product
    // };
    dot(other: Vector3) {
        const elements0 = this.elements;
        const elements1 = other.elements;
        return elements0[0] * elements1[0] + elements0[1] * elements1[1] + elements0[2] * elements1[2];
    }

    addScaledInPlace(other: Vector3, factor: number) {
        const elements0 = this.elements;
        const elements1 = other.elements;
        elements0[0] += elements1[0] * factor;
        elements0[1] += elements1[1] * factor;
        elements0[2] += elements1[2] * factor;
        return this;
    }


    // cross(opt_src: Vector3) {
    //     var vA = this.elements;   // short-hand for the calling object
    //     var ans = new Vector3([0.0, 0.0, 0.0]);  // initialize to zero vector 
    //     var vC = ans.elements;    // get the Float32Array contents of 'ans'
    //     if(opt_src && typeof opt_src === 'object' && opt_src.hasOwnProperty('elements')) {
    //         var vB = opt_src.elements;  // short-hand for the Vector3 argument
    //         }
    //     else {
    //         console.log('ERROR! cross() function needs Vec3 argument! \n');
    //         return ans;
    //     }
    //     // compute cross-product
    //     vC[0] = vA[1]*vB[2] - vA[2]*vB[1];  // Cx = Ay*Bz - Az*By
    //     vC[1] = vA[2]*vB[0] - vA[0]*vB[2];  // Cy = Az*Bx - Ax*Bz
    //     vC[2] = vA[0]*vB[1] - vA[1]*vB[0];  // Cz = Ax*By - Ay*Bx
    //     return ans; 
    // };

    cross(other: Vector3, destination?: Vector3) {
        let elements0 = this.elements;
        let elements1 = other.elements;
        let elements2 = (destination ?? this).elements;

        const Cx = elements0[1]*elements1[2] - elements0[2]*elements1[1];
        const Cy = elements0[2]*elements1[0] - elements0[0]*elements1[2];
        const Cz = elements0[0]*elements1[1] - elements0[1]*elements1[0];

        elements2[0] = Cx;
        elements2[1] = Cy;
        elements2[2] = Cz;
    }

    printMe(opt_src?) {
        var res = 5;
        if (opt_src && typeof opt_src === 'string') {
            console.log(opt_src,':',
                this.elements[ 0].toFixed(res),'\t', 
                this.elements[ 1].toFixed(res),'\t', 
                this.elements[ 2].toFixed(res),'\n');
        } 
        else {
            console.log('Vector3:', 
                this.elements[ 0].toFixed(res),'\t',
                this.elements[ 1].toFixed(res),'\t', 
                this.elements[ 2].toFixed(res),'\n');
        }
    };

    // add(other: Vector3) {
    //     return new Vector3(
    //         [this.elements[0] + other.elements[0],
    //         this.elements[1] + other.elements[1],
    //         this.elements[2] + other.elements[2]]
    //     );
    // };

    // subtract(other: Vector3) {
    //     return new Vector3(
    //         [this.elements[0] - other.elements[0],
    //         this.elements[1] - other.elements[1],
    //         this.elements[2] - other.elements[2]]
    //     );
    // }

    magnitude() {
        return Math.sqrt(Math.pow(this.elements[0], 2) + Math.pow(this.elements[1], 2) + Math.pow(this.elements[2], 2));
    }

    addInPlace(other: Vector3) { //added for performance reasons
        const elements0 = this.elements;
        const elements1 = other.elements;
        elements0[0] += elements1[0]
        elements0[1] += elements1[1]
        elements0[2] += elements1[2]
    }

    subtractInPlace(other: Vector3) { //added for performance reasons
        const elements0 = this.elements;
        const elements1 = other.elements;
        elements0[0] -= elements1[0],
        elements0[1] -= elements1[1],
        elements0[2] -= elements1[2]
    }

    copyFrom(other: Vector3) { //added for performance reasons
        this.elements[0] = other.elements[0];
        this.elements[1] = other.elements[1];
        this.elements[2] = other.elements[2];
        return this;
    }

    // scale(factor) {
    //     return new Vector3([
    //         this.elements[0] * factor,
    //         this.elements[1] * factor,
    //         this.elements[2] * factor
    //     ]);
    // };

    scaleInPlace(factor) { //added for performance reasons
        let elements = this.elements;
        elements[0] *= factor,
        elements[1] *= factor,
        elements[2] *= factor
    }

    // norm

    componentOn(other: Vector3) {
        return this.dot(other) / other.dot(other)
    }

    // projectOn(other: Vector3) {
    //     return other.scale(this.componentOn(other))
    // }

    clampInPlace(min: number, max: number) {
        this.elements[0] = Math.min(Math.max(this.elements[0], min), max);
        this.elements[1] = Math.min(Math.max(this.elements[1], min), max);
        this.elements[2] = Math.min(Math.max(this.elements[2], min), max);
    }

    // static random() {
    //     let output = new Vector3([
    //         Math.random(),
    //         Math.random(),
    //         Math.random()
    //     ]);
    //     return output;
    // }

    zeroOut() {
        let elements = this.elements
        elements[0] = 0.0;
        elements[1] = 0.0;
        elements[2] = 0.0;
    }

    diag() {
        let mat = new Matrix4([
            this.elements[0], 0, 0, 0,
            0, this.elements[1], 0, 0,
            0, 0, this.elements[2], 0,
            0, 0, 0, 1
        ]);
        return mat;
    }

    dotWithDifference(other0: Vector3, other1: Vector3) {
        const elements = this.elements;
        const elements0 = other0.elements;
        const elements1 = other1.elements
        return elements[0] * (elements0[0] - elements1[0])
        + elements[1] * (elements0[1] - elements1[1])
        + elements[2] * (elements0[2] - elements1[2]);
    }

    distanceFrom(other: Vector3) {
        const elements0 = this.elements;
        const elements1 = other.elements;
        let xDist = elements0[0] - elements1[0];
        let yDist = elements0[1] - elements1[1];
        let zDist = elements0[2] - elements1[2];
        return Math.sqrt(xDist*xDist + yDist*yDist + zDist*zDist);
    }
}

export class Vector4 {
    elements: Float32Array;
    
    constructor(opt_src?) {
        var v = new Float32Array(4);
        if (opt_src && typeof opt_src === 'object') {
            v[0] = opt_src[0]; v[1] = opt_src[1]; v[2] = opt_src[2]; v[3] = opt_src[3];
        } 
        this.elements = v;
    }

    dot(opt_src) {
        var vA = this.elements; // short-hand for the calling object
      
        if(opt_src && typeof opt_src === 'object' && opt_src.hasOwnProperty('elements')) {
            var vB = opt_src.elements;  // short-hand for the Vector3 argument
        }
        else {
            console.log('ERROR! dot() function needs Vec4 argument! \n');
            return 0.0;
        }
        if(vA[3]*vB[3] !== 0) {
            console.log('WARNING! Vector4.dot() given non-zero \'w\' values: NOT a geometric result!!'); 
        }
        return vA[0]*vB[0] + vA[1]*vB[1] + vA[2]*vB[2] + vA[3]*vB[3];  // compute dot-product
    };

    cross = function(opt_src) {
        var vA = this.elements;   // short-hand for the calling object
        var ans = new Vector4([0.0, 0.0, 0.0, 0.0]); // initialize to zero vector
        var vC = ans.elements;    // get the Float32Array contents of 'ans'
        if(opt_src && typeof opt_src === 'object' && opt_src.hasOwnProperty('elements')) {
            var vB = opt_src.elements;  // short-hand for the Vector4 argument
        }
        else {
            console.log('ERROR! cross() function needs Vec4 argument! \n');
            return ans;
        }
        if(vA[3] !== 0 || vB[3] !== 0) {
            console.log('WARNING! cross() given non-zero \'w\' values: IGNORED!!!');
        }
        // compute cross-product
        vC[0] = vA[1]*vB[2] - vA[2]*vB[1];  // Cx = Ay*Bz - Az*By
        vC[1] = vA[2]*vB[0] - vA[0]*vB[2];  // Cy = Az*Bx - Ax*Bz
        vC[2] = vA[0]*vB[1] - vA[1]*vB[0];  // Cz = Ax*By - Ay*Bx
        vC[3] = 0.0;    // set w == 0 ALWAYS, because it's a vector result
        return ans; 
    };

    printMe = function(opt_src) {
        var res = 5;
         if (opt_src && typeof opt_src === 'string') { 
            console.log(opt_src,':',     // print the string argument given.
                this.elements[0].toFixed(res),'\t', 
                this.elements[1].toFixed(res),'\t', 
                this.elements[2].toFixed(res),'\t',
                this.elements[3].toFixed(res),'\n');
         } 
         else {                    // user called printMe() with NO args, so...
            console.log('Vector4:', 
                this.elements[0].toFixed(res),'\t',
                this.elements[1].toFixed(res),'\t', 
                this.elements[2].toFixed(res),'\t',
                this.elements[3].toFixed(res),'\n');
         }
    };
}

var __cuon_matrix_mod_stack: Array<InstanceType<typeof Matrix4>> = [];
function pushMatrix(mat) {
    __cuon_matrix_mod_stack.push(new Matrix4(mat));
}

function popMatrix() {
    return __cuon_matrix_mod_stack.pop();
}


export class Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;

	constructor(x, y, z, w) {
	    this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
		return this;
	};

    clear() {
        this.x = 0.0;
        this.y = 0.0;
        this.z = 0.0;
        this.w = 1.0;
	};
	
	copy(q) {
		this.x = q.x;
		this.y = q.y;
		this.z = q.z;
		this.w = q.w;
		return this;
	};
	
	printMe() {
        let res = 5;		// # of digits to print on HTML 'console'
        console.log('Quaternion: x=', this.x.toFixed(res), 
										    'i\ty=', this.y.toFixed(res), 
												'j\tz=', this.z.toFixed(res), 
									 'k\t(real)w=', this.w.toFixed(res),'\n');
	};
	
	
	setFromAxisAngle(ax, ay, az, angleDeg) {
		var mag2 = ax*ax + ay*ay + az*az;	// axis length^2
		if(mag2-1.0 > 0.0000001 || mag2-1.0 < -0.0000001) {
			var normer = 1.0/Math.sqrt(mag2);
			ax *= normer;
			ay *= normer;
			az *= normer;
		}

		var halfAngle = angleDeg * Math.PI / 360.0;	// (angleDeg/2) * (2*pi/360)
		var s = Math.sin( halfAngle );
		this.x = ax * s;
		this.y = ay * s;
		this.z = az * s;
		this.w = Math.cos( halfAngle );
		return this;
	};
	
	setFromEuler(alphaDeg, betaDeg, gammaDeg) {
		this.w = 1;
        this.x = 0;
		this.y = 0;
		this.z = 0;
		return this;
	};

	setFromRotationMatrix(m) {
		function copySign(a, b) {
			return b < 0 ? -Math.abs(a) : Math.abs(a);
		}
		var absQ = Math.pow(m.determinant(), 1.0 / 3.0);
		this.w = Math.sqrt( Math.max( 0, absQ + m.n11 + m.n22 + m.n33 ) ) / 2;
		this.x = Math.sqrt( Math.max( 0, absQ + m.n11 - m.n22 - m.n33 ) ) / 2;
		this.y = Math.sqrt( Math.max( 0, absQ - m.n11 + m.n22 - m.n33 ) ) / 2;
		this.z = Math.sqrt( Math.max( 0, absQ - m.n11 - m.n22 + m.n33 ) ) / 2;
		this.x = copySign( this.x, ( m.n32 - m.n23 ) );
		this.y = copySign( this.y, ( m.n13 - m.n31 ) );
		this.z = copySign( this.z, ( m.n21 - m.n12 ) );
		this.normalize();
		return this;
	};

	calculateW() {
		this.w = - Math.sqrt( Math.abs( 
		             1.0 - this.x * this.x - this.y * this.y - this.z * this.z ) );
		return this;
	};

	inverse() {
		this.x *= -1;
		this.y *= -1;
		this.z *= -1;
		return this;
	};

	length() {
		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );
	};

	normalize() {
		var len = Math.sqrt(this.x * this.x + 
                            this.y * this.y + 
                            this.z * this.z + 
                            this.w * this.w );
		if ( len === 0 ) {
			this.x = 0;
			this.y = 0;
			this.z = 0;
			this.w = 0;
		} 
		else {
			len = 1 / len;
			this.x = this.x * len;
			this.y = this.y * len;
			this.z = this.z * len;
			this.w = this.w * len;
		}
		return this;
	};

	multiplySelf(quat2) {
		var qax = this.x,  qay = this.y,  qaz = this.z,  qaw = this.w,
		    qbx = quat2.x, qby = quat2.y, qbz = quat2.z, qbw = quat2.w;
		this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
		return this;
	};

	multiply(q1, q2) {
		this.x =  q1.x * q2.w + q1.y * q2.z - q1.z * q2.y + q1.w * q2.x;
		this.y = -q1.x * q2.z + q1.y * q2.w + q1.z * q2.x + q1.w * q2.y;
		this.z =  q1.x * q2.y - q1.y * q2.x + q1.z * q2.w + q1.w * q2.z;
		this.w = -q1.x * q2.x - q1.y * q2.y - q1.z * q2.z + q1.w * q2.w;
		return this;
	};

	multiplyVector3(vec, dest) {
		if( !dest ) { dest = vec; }
		var x    = vec.x,  y  = vec.y,  z  = vec.z,
			 qx   = this.x, qy = this.y, qz = this.z, qw = this.w;
			 
		// calculate quat * vec:
		var ix =  qw * x + qy * z - qz * y,
				iy =  qw * y + qz * x - qx * z,
				iz =  qw * z + qx * y - qy * x,
				iw = -qx * x - qy * y - qz * z;
		// calculate result * inverse quat:
		dest.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
		dest.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
		dest.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
		return dest;
	};

    slerp(qa, qb, qm, t) {
        //--------------------------------------
        // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/
        
            var cosHalfTheta = qa.w * qb.w + qa.x * qb.x + qa.y * qb.y + qa.z * qb.z;
        
            if (cosHalfTheta < 0) {
                qm.w = -qb.w; 
                qm.x = -qb.x; 
                qm.y = -qb.y; 
                qm.z = -qb.z;
                cosHalfTheta = -cosHalfTheta;
            } 
            else {	qm.copy(qb);	}
        
            if ( Math.abs( cosHalfTheta ) >= 1.0 ) {
                qm.w = qa.w; 
                qm.x = qa.x; 
                qm.y = qa.y; 
                qm.z = qa.z;
                return qm;
            }
        
            var halfTheta = Math.acos( cosHalfTheta ),
            sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );
        
            if ( Math.abs( sinHalfTheta ) < 0.0001 ) {
                qm.w = 0.5 * ( qa.w + qb.w );
                qm.x = 0.5 * ( qa.x + qb.x );
                qm.y = 0.5 * ( qa.y + qb.y );
                qm.z = 0.5 * ( qa.z + qb.z );
                return qm;
            }
        
            var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
            ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;
        
            qm.w = ( qa.w * ratioA + qm.w * ratioB );
            qm.x = ( qa.x * ratioA + qm.x * ratioB );
            qm.y = ( qa.y * ratioA + qm.y * ratioB );
            qm.z = ( qa.z * ratioA + qm.z * ratioB );
            return qm;
        };
}