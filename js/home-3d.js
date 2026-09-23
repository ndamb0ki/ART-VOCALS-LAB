import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


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
  2.15 / maxDimension;

      tube.scale.setScalar(
        normalizedScale
      );


      // -----------------------------------------------
      // Starting orientation
      // -----------------------------------------------

// Tube hangs vertically with opening/nozzle downward
tube.rotation.set(
  THREE.MathUtils.degToRad(0),
  THREE.MathUtils.degToRad(180),
  THREE.MathUtils.degToRad(0)
);

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

  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(
    width,
    height,
    false
  );

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );


  // DESKTOP
  if (width > 1100) {

    tubeGroup.position.x = 0;
    tubeGroup.position.y = 0;
    tubeGroup.position.z = 0;

    tubeGroup.scale.setScalar(0.72);
  }

  // TABLET
  else if (width > 768) {

    tubeGroup.position.x = 0;
    tubeGroup.position.y = 0;
    tubeGroup.position.z = 0;

    tubeGroup.scale.setScalar(0.62);
  }

  // MOBILE
  else {

    tubeGroup.position.x = 0;
    tubeGroup.position.y = 0.15;
    tubeGroup.position.z = 0;

    tubeGroup.scale.setScalar(0.48);
  }

}

// =====================================================
// FLOATING ANIMATION
// =====================================================

const clock = new THREE.Clock();

function animate() {\n\n  requestAnimationFrame(animate);\n\n  const time = clock.getElapsedTime();\n  const raw = getComputedStyle(document.documentElement)\n    .getPropertyValue("--tube-scroll-progress");\n  const progress = Math.min(1, Math.max(0, Number(raw) || 0));\n\n  // The tube begins floating, then travels downward while completing one flip.\n  const float = Math.sin(time * 0.8) * 0.08 * (1 - progress);\n  const travelY = -progress * 2.65;\n  tubeGroup.position.y = float + travelY;\n\n  // A single controlled 360-degree flip driven by scroll.\n  tubeGroup.rotation.x = progress * Math.PI * 2;\n  tubeGroup.rotation.z = Math.sin(time * 0.45) * 0.018 * (1 - progress);\n\n  // Slight depth movement makes the tube settle into the narrow middle rail.\n  tubeGroup.position.z = -progress * 0.9;\n  tubeGroup.scale.setScalar(1 - progress * 0.12);\n\n  renderer.render(scene, camera);\n}\n\n// =====================================================
// RESIZE LISTENER
// =====================================================

window.addEventListener(
  "resize",
  resize
);


// Run once immediately
resize();


// =====================================================
// START ANIMATION
// =====================================================

animate();

} // closes: else { ... }
