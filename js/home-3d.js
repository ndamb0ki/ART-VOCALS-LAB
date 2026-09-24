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
// SMOOTH SCROLL-DRIVEN MOTION
// =====================================================

const clock = new THREE.Clock();
let smoothProgress = 0;
let previousProgress = 0;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / Math.max(0.0001, b - a));
  return t * t * (3 - 2 * t);
};

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 1 / 20);
  const time = clock.elapsedTime;

  // The scroll handler supplies a target only. The model glides toward it.
  // This removes the harsh one-to-one link between mouse-wheel ticks and 3D motion.
  const cssTarget = Number(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--tube-scroll-progress")
  ) || 0;
  const target = clamp01(
    typeof window.__ndambukiTubeTarget === "number"
      ? window.__ndambukiTubeTarget
      : cssTarget
  );

  smoothProgress = THREE.MathUtils.damp(smoothProgress, target, 5.2, dt);

  // Three overlapping eased phases make the tube feel like one object travelling
  // through space rather than an object rotating at a fixed point.
  const heroPhase = smoothstep(0.00, 0.34, smoothProgress);
  const bioPhase = smoothstep(0.25, 0.72, smoothProgress);
  const labPhase = smoothstep(0.64, 1.00, smoothProgress);

  // Vertical path: high in hero -> centre rail -> lower hand-off into the lab.
  const yHero = THREE.MathUtils.lerp(2.25, 0.35, heroPhase);
  const yBio = THREE.MathUtils.lerp(0.0, -1.35, bioPhase);
  const yLab = THREE.MathUtils.lerp(0.0, -0.92, labPhase);
  const idleFloat = Math.sin(time * 0.72) * 0.035 * (1 - labPhase);
  const targetY = yHero + yBio + yLab + idleFloat;

  // A very small S-curve keeps the movement organic while remaining centred.
  const targetX =
    Math.sin(heroPhase * Math.PI) * 0.12
    - Math.sin(bioPhase * Math.PI) * 0.10
    + Math.sin(labPhase * Math.PI) * 0.06;

  // Move backwards only during the final hand-off, so Explore content can pass
  // naturally in front of the tube.
  const targetZ = THREE.MathUtils.lerp(0, -1.45, labPhase);

  tubeGroup.position.x = THREE.MathUtils.damp(tubeGroup.position.x, targetX, 7.0, dt);
  tubeGroup.position.y = THREE.MathUtils.damp(tubeGroup.position.y, targetY, 7.0, dt);
  tubeGroup.position.z = THREE.MathUtils.damp(tubeGroup.position.z, targetZ, 6.0, dt);

  // Rotation is tied to smoothed travel, not raw scroll ticks. A tiny amount of
  // momentum is added while scrolling, then settles immediately when scrolling stops.
  const velocity = (smoothProgress - previousProgress) / Math.max(dt, 0.001);
  previousProgress = smoothProgress;

  const targetRotX = smoothProgress * Math.PI * 3.05 + velocity * 0.035;
  const targetRotY = Math.sin(smoothProgress * Math.PI * 1.35) * 0.16;
  const targetRotZ = Math.sin(smoothProgress * Math.PI * 2.0) * 0.055;

  tubeGroup.rotation.x = THREE.MathUtils.damp(tubeGroup.rotation.x, targetRotX, 8.0, dt);
  tubeGroup.rotation.y = THREE.MathUtils.damp(tubeGroup.rotation.y, targetRotY, 8.0, dt);
  tubeGroup.rotation.z = THREE.MathUtils.damp(tubeGroup.rotation.z, targetRotZ, 8.0, dt);

  const baseScale = window.innerWidth > 1100 ? 0.72 : window.innerWidth > 768 ? 0.62 : 0.48;
  // Subtle perspective breathing during the journey; never a conspicuous zoom.
  const scalePulse = 1 - 0.055 * Math.sin(bioPhase * Math.PI) - 0.08 * labPhase;
  const targetScale = baseScale * scalePulse;
  const currentScale = tubeGroup.scale.x || targetScale;
  const nextScale = THREE.MathUtils.damp(currentScale, targetScale, 7.0, dt);
  tubeGroup.scale.setScalar(nextScale);

  renderer.render(scene, camera);
}

// =====================================================
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
