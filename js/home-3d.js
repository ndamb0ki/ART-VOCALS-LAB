import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { GLTFLoader } from
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";


// =====================================================
// NDAMBUKI ART LAB — HERO PAINT TUBE
// =====================================================

const canvas = document.querySelector("#hero-3d-canvas");

if (!canvas) {
  console.error("Hero 3D canvas not found.");
} else {

  // ---------------------------------------------------
  // SCENE
  // ---------------------------------------------------

  const scene = new THREE.Scene();


  // ---------------------------------------------------
  // CAMERA
  // ---------------------------------------------------

  const camera = new THREE.PerspectiveCamera(
    32,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  camera.position.set(0, 0, 8);


  // ---------------------------------------------------
  // RENDERER
  // ---------------------------------------------------

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.outputColorSpace = THREE.SRGBColorSpace;

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  renderer.toneMappingExposure = 1.15;


  // ---------------------------------------------------
  // LIGHTING
  // ---------------------------------------------------

  const ambientLight =
    new THREE.AmbientLight(
      0xffffff,
      2.2
    );

  scene.add(ambientLight);


  const keyLight =
    new THREE.DirectionalLight(
      0xffffff,
      4
    );

  keyLight.position.set(
    4,
    5,
    6
  );

  scene.add(keyLight);


  const fillLight =
    new THREE.DirectionalLight(
      0xffe5c7,
      2
    );

  fillLight.position.set(
    -4,
    1,
    4
  );

  scene.add(fillLight);


  // ---------------------------------------------------
  // MODEL GROUP
  // ---------------------------------------------------

  const tubeGroup = new THREE.Group();

  scene.add(tubeGroup);


  // ---------------------------------------------------
  // LOAD PAINT TUBE
  // ---------------------------------------------------

  const loader = new GLTFLoader();

  loader.load(

    "models/ndambo-paint-tube.glb",

    function (gltf) {

      const tube = gltf.scene;

      tubeGroup.add(tube);


      // -----------------------------------------------
      // Automatically center the model
      // -----------------------------------------------

      const box =
        new THREE.Box3()
          .setFromObject(tube);

      const center =
        box.getCenter(
          new THREE.Vector3()
        );

      tube.position.sub(center);


      // -----------------------------------------------
      // Automatically calculate model size
      // -----------------------------------------------

      const size =
        box.getSize(
          new THREE.Vector3()
        );

      const maxDimension =
        Math.max(
          size.x,
          size.y,
          size.z
        );


      // Normalize unknown GLB scale

      const normalizedScale =
        3.6 / maxDimension;

      tube.scale.setScalar(
        normalizedScale
      );


      // -----------------------------------------------
      // Starting orientation
      // -----------------------------------------------

      tube.rotation.z =
        THREE.MathUtils.degToRad(-12);

      tube.rotation.y =
        THREE.MathUtils.degToRad(-15);


      console.log(
        "🎨 Ndambuki paint tube loaded."
      );

      resize();

    },

    function (xhr) {

      if (xhr.total) {

        const percent =
          Math.round(
            (xhr.loaded / xhr.total) * 100
          );

        console.log(
          `Loading paint tube: ${percent}%`
        );
      }

    },

    function (error) {

      console.error(
        "Could not load paint tube:",
        error
      );

    }

  );


  // ---------------------------------------------------
  // RESIZE / POSITION
  // ---------------------------------------------------

  function resize() {

    const width =
      window.innerWidth;

    const height =
      window.innerHeight;


    camera.aspect =
      width / height;

    camera.updateProjectionMatrix();


    renderer.setSize(
      width,
      height,
      false
    );


    if (width <= 768) {

      tubeGroup.position.set(
        1.15,
        -0.15,
        0
      );

      tubeGroup.scale.setScalar(
        0.65
      );

    }

    else if (width <= 1100) {

      tubeGroup.position.set(
        1.8,
        0,
        0
      );

      tubeGroup.scale.setScalar(
        0.82
      );

    }

    else {

      tubeGroup.position.set(
        2.15,
        0,
        0
      );

      tubeGroup.scale.setScalar(
        1
      );

    }

  }


  window.addEventListener(
    "resize",
    resize
  );

  resize();


  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  function animate() {

    requestAnimationFrame(
      animate
    );

    renderer.render(
      scene,
      camera
    );

  }

  animate();

}
