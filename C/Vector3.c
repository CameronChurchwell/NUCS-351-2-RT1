#include <stdlib.h>
#include <wasm_simd128.h>

//allocate a float array of length 3
__attribute__((used))
float* allocate_vector3() {
    float *elements;
    elements = calloc(4, sizeof(float));
    return elements;
}

//free a float (vector) array
__attribute__((used))
void free_vector3(float *vector_pointer) {
    free(vector_pointer);
}

//adds vectors src0 and src1 and stores result in dst
__attribute__((used))
void add_vector3(__f32x4* src0, __f32x4* src1, __f32x4* dst) {
    *dst = wasm_f32x4_add(*src0, *src1);
}

//subtracts vector src1 from src0 and stores result in dst
__attribute__((used))
void sub_vector3(__f32x4* src0, __f32x4* src1, __f32x4* dst) {
    *dst = wasm_f32x4_sub(*src0, *src1);
}

//scales vector src by scalar factor and stores result in dst
__attribute__((used))
void scale_vector3(__f32x4* src, float factor, __f32x4* dst) {
    *dst = wasm_f32x4_mul(*src, wasm_f32x4_splat(factor));
}

//stores vector src in destination dst
__attribute__((used))
void store_vector3(__f32x4* src, __f32x4* dst) {
    *dst = *src;
}

//adds vector src0 to vector (src1 scaled by scalar factor) and stores result in dst
__attribute__((used))
void addscale_vector3(__f32x4* src0, __f32x4* src1, float factor, __f32x4* dst) {
    *dst = wasm_f32x4_add(*src0, wasm_f32x4_mul(*src1, wasm_f32x4_splat(factor)));
}

//dots vector src0 with vector src1
__attribute__((used))
float dot_vector3(__f32x4* src0, __f32x4* src1) {
    const __f32x4 prod = wasm_f32x4_mul(*src0, *src1);
    return prod[0] + prod[1] + prod[2] + prod[3];
}

//dots vector src0 with the difference between vectors src1 and src2
__attribute__((used))
float dotwithdifference_vector3(__f32x4* src0, __f32x4* src1, __f32x4* src2) {
    const __f32x4 prod = wasm_f32x4_mul(*src0, wasm_f32x4_sub(*src1, *src2));
    return prod[0] + prod[1] + prod[2] + prod[3];
}

//determines whether a vector intersects a plane
//if there is an intersection the intersection point is stored in dst
__attribute__((used))
bool planeintersect_vector3(
    __f32x4* raySource,
    __f32x4* rayDir,
    __f32x4* normal,
    __f32x4* offset,
    __f32x4* dst
) {
    float numerator = dotwithdifference_vector3(normal, offset, raySource);
    float denominator = dot_vector3(rayDir, normal);
    if (numerator == 0) {
        *dst = *normal;
        float dot = dot_vector3(normal, offset);
        scale_vector3(dst, dot, dst);
    } else if (denominator == 0) {
        return false;
    } else {
        float t = numerator/denominator;
        if (t < 0) {
            return false;
        } else {
            *dst = *raySource;
            addscale_vector3(dst, rayDir, t, dst);
        }
    }
    return true;
}

struct Triangle
{
    __f32x4 *offset;
    __f32x4 *side0;
    __f32x4 *side1;
    __f32x4 *comp;
};

__attribute__((used))
struct Triangle *make_triangle(
    __f32x4 *offset,
    __f32x4 *side0,
    __f32x4 *side1,
    float magSq0,
    float magSq1,
    float angle
) {
    struct Triangle *t = malloc(sizeof(struct Triangle));

    t->offset = offset;
    t->side0 = side0;
    t->side1 = side1;
    t->comp = malloc(sizeof(__f32x2));

    *(t->comp) = wasm_f32x4_make(magSq0, magSq1, angle, angle);

    return t;
}

//determines if a point lies in a triangle
__attribute__((used))
bool trianglecontains_vector3(
    __f32x4 *point,
    struct Triangle *triangle
) {
    __f32x4 difference = wasm_f32x4_sub(*point, *(triangle->offset));
    float angle0 = dot_vector3(&difference, triangle->side0);
    float angle1 = dot_vector3(&difference, triangle->side1);
    __f32x4 angle1001 = wasm_f32x4_make(angle1, angle0, angle0, angle1);
    __f32x4 product = wasm_f32x4_mul(*(triangle->comp), angle1001);
    //product stores (u1, u2, v1, v2)
    float u = product[0]-product[1];
    float v = product[2]-product[3];
    return u >= 0 && v>=0 && u+v <= 1;
}

//given a ray (source, direction) and array of triangles, determines index of closest triangle intersection
//returns -1 for no intersection
__attribute__((used))
int closest_triangle_vector3(
    __f32x4 *raySource,
    struct Triangle *triangles,
    int numTriangles
) {
    for (int i=0; i<numTriangles; i++) {
        
    }
}