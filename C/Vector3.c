#include <stdlib.h>

//allocate a float array of length 3
__attribute__((used))
float* allocate_vector3() {
    float *elements;
    elements = calloc(3, sizeof(float));
    return elements;
}

//free a float (vector) array
__attribute__((used))
void free_vector3(float *vector_pointer) {
    free(vector_pointer);
}

//adds vectors src0 and src1 and stores result in dst
__attribute__((used))
void add_vector3(float* src0, float* src1, float* dst) {
    dst[0] = src0[0] + src1[0];
    dst[1] = src0[1] + src1[1];
    dst[2] = src0[2] + src1[2];
}