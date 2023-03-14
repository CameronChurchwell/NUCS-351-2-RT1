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

// Light testLight;
uniform Light u_lights[numLights];
// Material testMaterial;
uniform Material u_material;

in vec4 v_Color;
in vec4 v_Normal;
in vec4 v_Position;
uniform vec3 u_cameraPos;
// vec4 v_Color;
out vec4 color;
void main() {
    //define test objects
    // u_lights[0].position = vec4(0.0, 0.0, 10.0, 1.0);
    // u_lights[0].ambient = vec3(0.1, 0.1, 0.1);
    // u_lights[0].diffuse = vec3(0.5, 0.5, 0.5);
    // u_lights[0].specular = vec3(0.25, 0.25, 0.25);

    // u_lights[1].position = vec4(6.0, 6.0, 10.0, 1.0);
    // u_lights[1].ambient = vec3(0.0, 0.0, 0.0);
    // u_lights[1].diffuse = vec3(0.0, 0.0, 0.0);
    // u_lights[1].specular = vec3(0.0, 0.0, 0.0);

    // testMaterial.ambient = vec3(1.0, 1.0, 1.0);
    // testMaterial.diffuse = vec3(1.0, 1.0, 1.0);
    // testMaterial.specular = vec3(1.0, 1.0, 1.0);
    // testMaterial.shiny = 10.0;

    color = vec4(0.0, 0.0, 0.0, 1.0);
    u_lights;
    for (int i=0; i<numLights; i++) {
        // Light light = u_lights[i];
        Light light = u_lights[i];
        // Light light = u_lights[0];
        //start of regular code
        vec4 normal = normalize(v_Normal);
        vec4 lightDirection = normalize(light.position - v_Position);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = light.diffuse * u_material.diffuse * nDotL;
        vec3 ambient = light.ambient * u_material.ambient;
        vec4 reflection = normalize(reflect(-1.0*lightDirection, -1.0*normal));
        vec3 cameraDirection = normalize(u_cameraPos - v_Position.xyz);
        float rDotV = max(dot(reflection.xyz, cameraDirection), 0.0);
        vec3 specular = pow(rDotV, u_material.shiny) * light.specular * u_material.specular;
        // gl_FragColor = vec4(diffuse * u_MaterialDiffuse + ambient * u_MaterialAmbient + specular * u_MaterialSpecular, v_Color.a);
        color.xyz += ambient.xyz + diffuse.xyz + specular.xyz;
    }
    color.x = min(color.x, 1.0);
    color.y = min(color.y, 1.0);
    color.z = min(color.z, 1.0);
}