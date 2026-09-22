/* =========================================================
   NDAMBUKI ART LAB
   Interactive Hero Art Study
   ========================================================= */

(function () {
  "use strict";

  const canvas = document.getElementById("hero-3d-canvas");

  if (!canvas || typeof THREE === "undefined") {
    return;
  }

  /* -------------------------------------------------------
     SCENE
     ------------------------------------------------------- */

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    32,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  camera.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.outputColorSpace = THREE.SRGBColorSpace;

  /* -------------------------------------------------------
     LIGHTING
     ------------------------------------------------------- */

  const ambient = new THREE.AmbientLight(
    0xffffff,
    2.2
  );

  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(
    0xffffff,
    3
  );

  keyLight.position.set(4, 5, 7);

  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(
    0xd9c4a5,
    1.5
  );

  fillLight.position.set(-5, -2, 4);

  scene.add(fillLight);


  /* -------------------------------------------------------
     MAIN ART GROUP
     ------------------------------------------------------- */

  const artwork = new THREE.Group();

  artwork.position.set(
    1.8,
    0.05,
    0
  );

  artwork.rotation.set(
    -0.08,
    0.16,
    -0.08
  );

  scene.add(artwork);


  /* -------------------------------------------------------
     MATERIALS
     ------------------------------------------------------- */

  const canvasMaterial = new THREE.MeshStandardMaterial({
    color: 0xe7e0d5,
    roughness: 0.88,
    metalness: 0
  });

  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x171717,
    roughness: 0.7,
    metalness: 0.05
  });

  const terracottaMaterial = new THREE.MeshStandardMaterial({
    color: 0xa65d42,
    roughness: 0.72,
    metalness: 0
  });

  const ochreMaterial = new THREE.MeshStandardMaterial({
    color: 0xb58a45,
    roughness: 0.75,
    metalness: 0
  });

  const creamMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0ebe2,
    roughness: 0.82,
    metalness: 0
  });


  /* -------------------------------------------------------
     CANVAS / PAINTING PANEL
     ------------------------------------------------------- */

  const panelGeometry =
    new THREE.BoxGeometry(
      3.25,
      4.15,
      0.16
    );

  const panel =
    new THREE.Mesh(
      panelGeometry,
      canvasMaterial
    );

  panel.rotation.z = -0.08;

  artwork.add(panel);


  /* -------------------------------------------------------
     PAINT MARKS
     ------------------------------------------------------- */

function createPaintMark(
  width,
  height,
  depth,
  material,
  x,
  y,
  rotation
) {

  const geometry =
    new THREE.SphereGeometry(
      1,
      32,
      18
    );

  const mark =
    new THREE.Mesh(
      geometry,
      material
    );

  mark.scale.set(
    width,
    height,
    depth
  );

  mark.position.set(
    x,
    y,
    0.18
  );

  mark.rotation.z =
    rotation;

  artwork.add(mark);

  return mark;
}


  /* -------------------------------------------------------
     ORGANIC SCULPTURE
     ------------------------------------------------------- */

  const sculptureGeometry =
    new THREE.IcosahedronGeometry(
      0.72,
      4
    );

  const sculpture =
    new THREE.Mesh(
      sculptureGeometry,
      terracottaMaterial
    );

  sculpture.position.set(
    0.95,
    1.1,
    0.55
  );

  sculpture.scale.set(
    0.9,
    1.35,
    0.55
  );

  sculpture.rotation.set(
    0.4,
    -0.25,
    0.3
  );

  artwork.add(sculpture);


  /* -------------------------------------------------------
     PALETTE / PAINT DISCS
     ------------------------------------------------------- */

  const paletteGroup =
    new THREE.Group();

  paletteGroup.position.set(
    -1.15,
    -1.55,
    0.55
  );

  paletteGroup.rotation.z = -0.18;

  artwork.add(paletteGroup);


  const paletteGeometry =
    new THREE.CylinderGeometry(
      0.78,
      0.78,
      0.13,
      48
    );

  const palette =
    new THREE.Mesh(
      paletteGeometry,
      creamMaterial
    );

  palette.rotation.x =
    Math.PI / 2;

  paletteGroup.add(palette);


  const paintColors = [
    terracottaMaterial,
    ochreMaterial,
    darkMaterial
  ];

  const paintPositions = [
    [-0.28, 0.16],
    [0.12, 0.25],
    [0.31, -0.08],
    [-0.05, -0.27]
  ];

  paintPositions.forEach(
    (position, index) => {

      const blob =
        new THREE.Mesh(
          new THREE.SphereGeometry(
            0.16,
            24,
            16
          ),
          paintColors[
            index % paintColors.length
          ]
        );

      blob.position.set(
        position[0],
        position[1],
        0.13
      );

      blob.scale.z = 0.45;

      paletteGroup.add(blob);
    }
  );


  /* -------------------------------------------------------
     BRUSH-LIKE FORM
     ------------------------------------------------------- */

  const brushGroup =
    new THREE.Group();

  brushGroup.position.set(
    0.55,
    -1.7,
    0.6
  );

  brushGroup.rotation.z = -0.62;

  artwork.add(brushGroup);


  const handle =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.055,
        0.075,
        2.35,
        16
      ),
      darkMaterial
    );

  brushGroup.add(handle);


  const bristle =
    new THREE.Mesh(
      new THREE.ConeGeometry(
        0.18,
        0.55,
        20
      ),
      terracottaMaterial
    );

  bristle.position.y = -1.35;

  brushGroup.add(bristle);


  /* -------------------------------------------------------
     SMALL FLOATING PIGMENT FORMS
     ------------------------------------------------------- */

  const floatingForms = [];

  for (let i = 0; i < 7; i++) {

    const geometry =
      new THREE.SphereGeometry(
        0.035 + Math.random() * 0.07,
        16,
        12
      );

    const material =
      [
        terracottaMaterial,
        ochreMaterial,
        darkMaterial,
        creamMaterial
      ][i % 4];

    const particle =
      new THREE.Mesh(
        geometry,
        material
      );

    particle.position.set(
      -1.4 + Math.random() * 3.2,
      -1.8 + Math.random() * 3.7,
      0.5 + Math.random() * 0.8
    );

    artwork.add(particle);

    floatingForms.push({
      mesh: particle,
      offset: Math.random() * Math.PI * 2
    });
  }


  /* -------------------------------------------------------
     MOUSE INTERACTION
     ------------------------------------------------------- */

  let mouseX = 0;
  let mouseY = 0;

  let targetX = 0;
  let targetY = 0;

  window.addEventListener(
    "pointermove",
    function (event) {

      mouseX =
        (event.clientX /
          window.innerWidth -
          0.5);

      mouseY =
        (event.clientY /
          window.innerHeight -
          0.5);
    },
    { passive: true }
  );


  /* -------------------------------------------------------
     ANIMATION
     ------------------------------------------------------- */

  const clock =
    new THREE.Clock();

  function animate() {

    requestAnimationFrame(
      animate
    );

    const elapsed =
      clock.getElapsedTime();

    targetX = mouseX * 0.22;
    targetY = mouseY * 0.14;

    artwork.rotation.y +=
      (targetX -
        artwork.rotation.y) *
      0.025;

    artwork.rotation.x +=
      (-targetY -
        artwork.rotation.x) *
      0.025;

    artwork.position.y =
      Math.sin(elapsed * 0.45) *
      0.035;

    sculpture.rotation.y =
      elapsed * 0.12;

    floatingForms.forEach(
      function (item, index) {

        item.mesh.position.y +=
          Math.sin(
            elapsed * 0.7 +
            item.offset
          ) *
          0.0008;
      }
    );

    renderer.render(
      scene,
      camera
    );
  }

  animate();


  /* -------------------------------------------------------
     RESPONSIVE POSITION
     ------------------------------------------------------- */

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
      height
    );

    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    );

if (width < 769) {

  artwork.scale.set(
    0.58,
    0.58,
    0.58
  );

  artwork.position.set(
    1.45,
    -0.45,
    0
  );

} else if (width < 1200) {

  artwork.scale.set(
    0.82,
    0.82,
    0.82
  );

  artwork.position.set(
    1.85,
    0.0,
    0
  );

} else {

  artwork.scale.set(
    1.08,
    1.08,
    1.08
  );

  artwork.position.set(
    2.15,
    0.05,
    0
  );
}
  window.addEventListener(
    "resize",
    resize
  );

  resize();

})();
