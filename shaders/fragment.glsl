#version 300 es
precision mediump float; 
// in vec4 v_Color;
// out vec4 color;
// void main() {
//     color = v_Color;
// }

#define numLights 2

struct Light {
    vec4 position;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct Material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float shiny;
};

// uniform Light lights[numLights];
// uniform Material material;

Light testLight;
Material testMaterial;

in vec4 v_Color;
in vec4 v_Normal;
in vec4 v_Position;
// vec4 v_Color;
out vec4 color;
void main() {
    //define test objects
    testLight.position = vec4(0.0, 0.0, 10.0, 1.0);
    testLight.ambient = vec3(0.1, 0.1, 0.1);
    testLight.diffuse = vec3(0.5, 0.5, 0.5);
    testLight.specular = vec3(0.0, 0.0, 0.0);

    testMaterial.ambient = vec3(1.0, 1.0, 1.0);
    testMaterial.diffuse = vec3(1.0, 1.0, 1.0);
    testMaterial.specular = vec3(1.0, 1.0, 1.0);
    testMaterial.shiny = 10.0;

    //use test objects
    Light light = testLight;
    Material material = testMaterial;

    //start of regular code
    vec4 normal = normalize(v_Normal);
    vec4 lightDirection = normalize(light.position - v_Position);
    float nDotL = max(dot(lightDirection, normal), 0.0);
    vec3 diffuse = light.diffuse * material.diffuse * nDotL;
    vec3 ambient = light.ambient * material.ambient;
    // vec4 reflection = normalize(reflect(-1.0*lightDirection, normal));
    // vec3 cameraDirection = normalize(u_CameraPosition - v_Position);
    // float rDotV = max(dot(reflection, cameraDirection), 0.0);
    // vec3 specular = pow(rDotV, u_MaterialShiny) * u_LightSpecular;
    // gl_FragColor = vec4(diffuse * u_MaterialDiffuse + ambient * u_MaterialAmbient + specular * u_MaterialSpecular, v_Color.a);
    color.xyz = ambient.xyz + diffuse.xyz;
    color.w = 1.0;
}