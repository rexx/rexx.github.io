import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import { createPolyhedron, topologyFor, truncatePolyhedron, vectorMath } from "./polyhedra.mjs";

const MAX_DEPTH = 50;
const UNIFORM_DEPTH = 33;
const UNIFORM_TRUNCATION = 1 / 3;
const RECTIFICATION = 1 / 2;
const CUT_THRESHOLD = 0.0005;

function depthToAmount(depth) {
  if (depth <= UNIFORM_DEPTH) {
    return (depth / UNIFORM_DEPTH) * UNIFORM_TRUNCATION;
  }

  const deepProgress = (depth - UNIFORM_DEPTH) / (MAX_DEPTH - UNIFORM_DEPTH);
  return UNIFORM_TRUNCATION + deepProgress * (RECTIFICATION - UNIFORM_TRUNCATION);
}

const translations = {
  zh: {
    pageTitle: "截角的秘密｜互動多面體實驗室",
    skip: "跳到互動實驗",
    brandSubtitle: "互動多面體實驗室",
    navExperiment: "互動實驗",
    navTopology: "拓樸觀察",
    navDuality: "對偶關係",
    help: "使用說明",
    eyebrow: "同步幾何觀察 No. 01",
    heroTitle: "當頂點被切掉，<br><em>形狀如何重生？</em>",
    heroDescription: "同時拖動兩個柏拉圖立體的截角深度，觀察原本的面如何擴張，以及每個頂點如何變成一個全新的面。",
    observation: "面數增加，但歐拉示性數始終不變",
    experimentTitle: "同步截角觀察台",
    live: "即時運算",
    drag: "拖曳旋轉",
    originalShape: "原始形狀",
    formingShape: "切面形成中",
    uniformShape: "均勻截角",
    deepShape: "越過均勻截角",
    rectifiedShape: "截半完成",
    originalFaces: "原本的面",
    newFaces: "新產生的面",
    removedParts: "被切掉的部分",
    showDual: "顯示對偶",
    hideDual: "隱藏對偶",
    dualBase: "面與頂點一一對應",
    dualCut: "截角後不再互為對偶",
    dualRectified: "兩條對偶路徑匯合為同一形狀",
    cutDepth: "截角深度",
    cutBegins: "開始切割",
    uniformCut: "均勻截角 33%",
    rectifiedCut: "截半 50%",
    reset: "重設",
    viewMode: "顯示模式",
    overlays: "輔助觀察",
    modeSolid: "一般",
    modeWireframe: "線框",
    modeTransparent: "半透明",
    modeExploded: "爆炸圖",
    showEdges: "顯示邊",
    showVertices: "顯示頂點",
    slowRotation: "慢速旋轉",
    topologyTitle: "數字如何跟著形狀改變",
    topologyDescription: "切面出現後，每條原始邊先貢獻兩個新頂點；到 50% 時，兩點在邊的中點合併。整個過程中 <strong>V − E + F</strong> 都維持為 2。",
    faces: "面數",
    edges: "邊數",
    vertices: "頂點",
    sameTotals: "兩者始終相同",
    dualityTitle: "面變成頂點，<br>頂點變成面",
    dualityDescription: "正十二面體與正二十面體互為對偶：一個形狀的每個面，都對應另一個形狀的一個頂點；邊則一一對應。因此兩者的面數與頂點數正好互換。",
    faceUnit: "面",
    vertexUnit: "頂點",
    dualityCaveat: "<strong>重要觀察：</strong>33% 時的截角十二面體與截角二十面體擁有相同的 F、E、V，但它們<strong>並不互為對偶</strong>；繼續到 50%，兩條路徑會匯合成同一個截半二十面體。",
    footerTagline: "用互動看見幾何，而不只是記住答案。",
    backToTop: "回到頂端",
    dialogTitle: "三步開始觀察",
    dialogStep1: "<strong>拖動截角深度</strong>兩個模型會同步從 0% 經過均勻截角 33%，最後在截半 50% 匯合。",
    dialogStep2: "<strong>切換顯示模式</strong>用線框看拓樸、半透明看背面，或用爆炸圖分辨每一個面。",
    dialogStep3: "<strong>拖曳任一模型</strong>從各個角度旋轉觀察；滾輪或雙指可以縮放。",
    dodecaBase: "正十二面體",
    dodecaProgress: "截角中的十二面體",
    dodecaUniform: "截角十二面體",
    dodecaDeep: "深截角十二面體",
    dodecaRectified: "截半二十面體",
    icosaBase: "正二十面體",
    icosaProgress: "截角中的二十面體",
    icosaUniform: "截角二十面體",
    icosaDeep: "深截角二十面體",
    icosaRectified: "截半二十面體",
    pentagon: "五邊形",
    triangle: "三角形",
    decagon: "十邊形",
    hexagon: "六邊形",
    play: "播放截角動畫",
    pause: "暫停截角動畫",
    lightMode: "切換淺色模式",
    darkMode: "切換深色模式",
    switchLanguage: "Switch to English",
    depthAria: (depth, status) => `${depth}%，${status}`,
    sharedAt: (depth) => `at ${depth}%`,
    advancedTitle: "進階觀察",
    showRemoved: "顯示移除部分",
    rotationSpeed: "旋轉速度",
    resetCamera: "重設鏡頭",
  },
  en: {
    pageTitle: "The Secret of Truncation | Interactive Polyhedra Lab",
    skip: "Skip to the interactive exhibit",
    brandSubtitle: "Interactive Polyhedra Lab",
    navExperiment: "Experiment",
    navTopology: "Topology",
    navDuality: "Duality",
    help: "How to use",
    eyebrow: "SYNCHRONIZED GEOMETRY No. 01",
    heroTitle: "When vertices are cut away,<br><em>how does form re-emerge?</em>",
    heroDescription: "Move the truncation depth of two Platonic solids together. Watch the original faces expand while every vertex becomes a brand-new face.",
    observation: "More faces, but the Euler characteristic never changes",
    experimentTitle: "Synchronized Truncation Table",
    live: "LIVE GEOMETRY",
    drag: "DRAG TO ROTATE",
    originalShape: "Original solid",
    formingShape: "Cut faces forming",
    uniformShape: "Uniform truncation",
    deepShape: "Beyond uniform truncation",
    rectifiedShape: "Rectification complete",
    originalFaces: "Original faces",
    newFaces: "New faces",
    removedParts: "Removed corners",
    showDual: "Show dual",
    hideDual: "Hide dual",
    dualBase: "Faces and vertices correspond",
    dualCut: "No longer dual after truncation",
    dualRectified: "Both dual paths meet in the same solid",
    cutDepth: "Truncation depth",
    cutBegins: "Cuts begin",
    uniformCut: "Uniform cut 33%",
    rectifiedCut: "Rectified 50%",
    reset: "Reset",
    viewMode: "View mode",
    overlays: "Overlays",
    modeSolid: "Solid",
    modeWireframe: "Wireframe",
    modeTransparent: "X-ray",
    modeExploded: "Exploded",
    showEdges: "Show edges",
    showVertices: "Show vertices",
    slowRotation: "Slow rotation",
    topologyTitle: "How the numbers follow the form",
    topologyDescription: "After cuts appear, each original edge first contributes two new vertices. At 50%, the pair merges at the edge midpoint. Throughout the process, <strong>V − E + F</strong> remains 2.",
    faces: "Faces",
    edges: "Edges",
    vertices: "Vertices",
    sameTotals: "Both totals match",
    dualityTitle: "Faces become vertices.<br>Vertices become faces.",
    dualityDescription: "The dodecahedron and icosahedron are duals: every face of one corresponds to a vertex of the other, while their edges pair one-to-one. Their face and vertex counts therefore exchange places.",
    faceUnit: "faces",
    vertexUnit: "vertices",
    dualityCaveat: "<strong>Important:</strong> at 33%, the two truncated solids have the same F, E, and V, but they are <strong>not duals</strong>. Continue to 50%, and both paths converge on the same icosidodecahedron.",
    footerTagline: "See geometry through interaction, not memorization.",
    backToTop: "Back to top",
    dialogTitle: "Start exploring in three steps",
    dialogStep1: "<strong>Move the truncation depth.</strong> Both models travel together from 0%, through uniform truncation at 33%, and meet at rectification at 50%.",
    dialogStep2: "<strong>Change the view mode.</strong> Use wireframe for topology, X-ray for rear faces, or explode every face outward.",
    dialogStep3: "<strong>Drag either model.</strong> Rotate it from every angle; use the wheel or a two-finger gesture to zoom.",
    dodecaBase: "Dodecahedron",
    dodecaProgress: "Truncating dodecahedron",
    dodecaUniform: "Truncated dodecahedron",
    dodecaDeep: "Deep-truncated dodecahedron",
    dodecaRectified: "Icosidodecahedron",
    icosaBase: "Icosahedron",
    icosaProgress: "Truncating icosahedron",
    icosaUniform: "Truncated icosahedron",
    icosaDeep: "Deep-truncated icosahedron",
    icosaRectified: "Icosidodecahedron",
    pentagon: "Pentagons",
    triangle: "Triangles",
    decagon: "Decagons",
    hexagon: "Hexagons",
    play: "Play truncation animation",
    pause: "Pause truncation animation",
    lightMode: "Switch to light mode",
    darkMode: "Switch to dark mode",
    switchLanguage: "切換為中文",
    depthAria: (depth, status) => `${depth} percent, ${status}`,
    sharedAt: (depth) => `at ${depth}%`,
    advancedTitle: "Advanced view",
    showRemoved: "Show removed corners",
    rotationSpeed: "Rotation speed",
    resetCamera: "Reset cameras",
  },
};

function createFaceGeometry(points) {
  const positions = [];

  for (let index = 1; index < points.length - 1; index += 1) {
    positions.push(...points[0], ...points[index], ...points[index + 1]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function createFaceLine(points) {
  const geometry = new THREE.BufferGeometry();
  geometry.setFromPoints([...points, points[0]].map((point) => new THREE.Vector3(...point)));
  return geometry;
}

function createFragmentGeometry(fragment) {
  const positions = [];

  [...fragment.sideFaces, fragment.cap].forEach((face) => {
    for (let index = 1; index < face.length - 1; index += 1) {
      positions.push(...face[0], ...face[index], ...face[index + 1]);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function createEdgeGeometry(polyhedron) {
  const positions = [];
  polyhedron.edges.forEach(([first, second]) => {
    positions.push(...polyhedron.vertices[first], ...polyhedron.vertices[second]);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

function clearObject(group) {
  group.traverse((object) => {
    if (object.geometry) {
      object.geometry.dispose();
    }
  });
  group.clear();
}

class ModelViewer {
  constructor(canvas, polyhedron, dualPolyhedron, options = {}) {
    this.canvas = canvas;
    this.polyhedron = polyhedron;
    this.dualPolyhedron = dualPolyhedron;
    this.options = options;
    this.depth = 0;
    this.mode = "solid";
    this.showEdges = true;
    this.showVertices = false;
    this.showRemoved = true;
    this.dualVisible = false;
    this.faceRecords = [];
    this.fragmentRecords = [];

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(0, 0.15, 7.6);

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.enablePan = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 11;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;

    this.world = new THREE.Group();
    this.world.rotation.set(options.rotationX ?? 0, options.rotationY ?? 0, options.rotationZ ?? 0);
    this.faceGroup = new THREE.Group();
    this.fragmentGroup = new THREE.Group();
    this.vertexGroup = new THREE.Group();
    this.dualGroup = new THREE.Group();
    this.world.add(this.faceGroup, this.fragmentGroup, this.vertexGroup, this.dualGroup);
    this.scene.add(this.world);

    this.materials = {
      original: new THREE.MeshStandardMaterial({
        color: options.originalColor ?? 0x4d91ad,
        roughness: 0.62,
        metalness: 0.04,
        flatShading: true,
        side: THREE.DoubleSide,
      }),
      cap: new THREE.MeshStandardMaterial({
        color: 0xf1b94b,
        roughness: 0.58,
        metalness: 0.03,
        flatShading: true,
        side: THREE.DoubleSide,
      }),
      removed: new THREE.MeshStandardMaterial({
        color: 0xd8664d,
        roughness: 0.7,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      edge: new THREE.LineBasicMaterial({ color: 0x163b55, transparent: true, opacity: 0.78 }),
      vertex: new THREE.PointsMaterial({ color: 0xd8664d, size: 0.085, sizeAttenuation: true }),
      dual: new THREE.LineBasicMaterial({ color: 0xd8664d, transparent: true, opacity: 0.48 }),
    };

    const hemisphere = new THREE.HemisphereLight(0xf4fbff, 0x536775, 2.4);
    const key = new THREE.DirectionalLight(0xffffff, 3.3);
    const fill = new THREE.DirectionalLight(0xf1b94b, 1.15);
    key.position.set(4, 6, 7);
    fill.position.set(-5, -2, 4);
    this.scene.add(hemisphere, key, fill);

    this.createDualOverlay();
    this.updateGeometry(0);
    this.setTheme(document.documentElement.dataset.theme || "light");

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
    this.animate();
  }

  createDualOverlay() {
    const lines = new THREE.LineSegments(createEdgeGeometry(this.dualPolyhedron), this.materials.dual);
    lines.scale.setScalar(0.92);
    lines.rotation.set(0.22, -0.15, 0.08);
    this.dualGroup.add(lines);
    this.dualGroup.visible = false;
  }

  addFace(points, type) {
    const container = new THREE.Group();
    const material = type === "cap" ? this.materials.cap : this.materials.original;
    const mesh = new THREE.Mesh(createFaceGeometry(points), material);
    const line = new THREE.Line(createFaceLine(points), this.materials.edge);
    const center = vectorMath.average(points);
    const direction = vectorMath.normalize(center);

    container.add(mesh, line);
    this.faceGroup.add(container);
    this.faceRecords.push({ container, direction, line, mesh, type });
  }

  updateGeometry(depth) {
    this.depth = depth;
    const amount = depthToAmount(depth);
    const data = truncatePolyhedron(this.polyhedron, amount);
    clearObject(this.faceGroup);
    clearObject(this.fragmentGroup);
    clearObject(this.vertexGroup);
    this.faceRecords = [];
    this.fragmentRecords = [];

    data.originalFaces.forEach((face) => this.addFace(face, "original"));
    data.capFaces.forEach((face) => this.addFace(face, "cap"));

    if (data.isTruncated) {
      data.cutFragments.forEach((fragment) => {
        const mesh = new THREE.Mesh(createFragmentGeometry(fragment), this.materials.removed);
        mesh.userData.direction = fragment.direction;
        this.fragmentGroup.add(mesh);
        this.fragmentRecords.push(mesh);
      });
    }

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(data.vertices.flat(), 3));
    this.vertexGroup.add(new THREE.Points(pointGeometry, this.materials.vertex));
    this.applyViewState();
  }

  applyViewState() {
    const wireframe = this.mode === "wireframe";
    const transparent = this.mode === "transparent";
    const exploded = this.mode === "exploded";
    const progress = this.depth / MAX_DEPTH;
    const explosion = exploded ? 0.58 : 0;

    this.materials.original.transparent = transparent;
    this.materials.original.opacity = transparent ? 0.26 : 1;
    this.materials.original.depthWrite = !transparent;
    this.materials.cap.transparent = transparent;
    this.materials.cap.opacity = transparent ? 0.35 : 1;
    this.materials.cap.depthWrite = !transparent;

    this.faceRecords.forEach((record) => {
      record.mesh.visible = !wireframe;
      record.line.visible = this.showEdges || wireframe;
      const offset = explosion * (record.type === "cap" ? 1.15 : 1);
      record.container.position.set(...record.direction).multiplyScalar(offset);
    });

    const fragmentOpacity = 0.18 + Math.sin(progress * Math.PI) * 0.24;
    this.materials.removed.opacity = fragmentOpacity;
    this.fragmentGroup.visible = this.showRemoved && this.depth > CUT_THRESHOLD && !exploded;
    this.fragmentRecords.forEach((mesh) => {
      mesh.position.set(...mesh.userData.direction).multiplyScalar(0.09 + progress * 0.28);
    });
    this.vertexGroup.visible = this.showVertices;
  }

  setMode(mode) {
    this.mode = mode;
    this.applyViewState();
  }

  setEdges(visible) {
    this.showEdges = visible;
    this.applyViewState();
  }

  setVertices(visible) {
    this.showVertices = visible;
    this.vertexGroup.visible = visible;
  }

  setRemoved(visible) {
    this.showRemoved = visible;
    this.applyViewState();
  }

  setDual(visible) {
    this.dualVisible = visible;
    this.dualGroup.visible = visible;
  }

  setRotation(enabled, speed) {
    this.controls.autoRotate = enabled;
    this.controls.autoRotateSpeed = speed;
  }

  resetCamera() {
    this.camera.position.set(0, 0.15, 7.6);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  setTheme(theme) {
    const dark = theme === "dark";
    this.materials.edge.color.setHex(dark ? 0xb7d0dc : 0x163b55);
    this.materials.edge.opacity = dark ? 0.66 : 0.78;
    this.materials.original.color.setHex(dark
      ? (this.options.darkColor ?? 0x4f9bbc)
      : (this.options.originalColor ?? 0x4d91ad));
  }

  resize() {
    const frame = this.canvas.parentElement;
    const width = frame.clientWidth;
    const height = frame.clientHeight;
    if (width === 0 || height === 0) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

const dodecahedron = createPolyhedron("dodecahedron");
const icosahedron = createPolyhedron("icosahedron");

const viewers = [
  new ModelViewer(
    document.querySelector("#dodeca-canvas"),
    dodecahedron,
    icosahedron,
    { originalColor: 0x4a8eaa, darkColor: 0x55a2c1, rotationX: 0.24, rotationY: -0.2 },
  ),
  new ModelViewer(
    document.querySelector("#icosa-canvas"),
    icosahedron,
    dodecahedron,
    { originalColor: 0x427f9d, darkColor: 0x5296b8, rotationX: 0.16, rotationY: 0.18, rotationZ: -0.08 },
  ),
];

const elements = {
  depth: document.querySelector("#cut-depth"),
  depthOutput: document.querySelector("#depth-output"),
  play: document.querySelector("#play-button"),
  reset: document.querySelector("#reset-button"),
  edges: document.querySelector("#edges-toggle"),
  vertices: document.querySelector("#vertices-toggle"),
  rotate: document.querySelector("#rotate-toggle"),
  dual: document.querySelector("#dual-toggle"),
  dualStatus: document.querySelector("#dual-status"),
  language: document.querySelector("#language-toggle"),
  theme: document.querySelector("#theme-toggle"),
  about: document.querySelector("#about-button"),
  dialog: document.querySelector("#about-dialog"),
};

const state = {
  depth: UNIFORM_DEPTH,
  direction: 1,
  language: loadPreference("polyhedra-language", "zh"),
  mode: "solid",
  playing: false,
  lastDepthRender: 0,
  previousTime: 0,
  rotationSpeed: 0.5,
  showRemoved: true,
  theme: loadTheme(),
};

function loadPreference(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage is optional in privacy-restricted contexts.
  }
}

function loadTheme() {
  const saved = loadPreference("polyhedra-theme", "");
  if (saved === "dark" || saved === "light") {
    return saved;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function currentCopy() {
  return translations[state.language];
}

function phaseForDepth(depth) {
  if (depth <= CUT_THRESHOLD) {
    return "base";
  }
  if (depth >= MAX_DEPTH - 0.05) {
    return "rectified";
  }
  if (Math.abs(depth - UNIFORM_DEPTH) <= 0.05) {
    return "uniform";
  }
  if (depth > UNIFORM_DEPTH) {
    return "deep";
  }
  return "progress";
}

function nameFor(kind, phase) {
  const prefix = kind === "dodeca" ? "dodeca" : "icosa";
  const suffix = phase.charAt(0).toUpperCase() + phase.slice(1);
  return currentCopy()[`${prefix}${suffix}`];
}

function statusForDepth(depth) {
  const copy = currentCopy();
  if (depth <= CUT_THRESHOLD) {
    return copy.originalShape;
  }
  if (depth >= MAX_DEPTH - 0.05) {
    return copy.rectifiedShape;
  }
  if (Math.abs(depth - UNIFORM_DEPTH) <= 0.05) {
    return copy.uniformShape;
  }
  return depth > UNIFORM_DEPTH ? copy.deepShape : copy.formingShape;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

function setStats(prefix, stats, faceA, faceB, truncated) {
  setText(`#${prefix}-faces`, stats.faces);
  setText(`#${prefix}-edges`, stats.edges);
  setText(`#${prefix}-vertices`, stats.vertices);
  setText(`#${prefix}-face-a`, faceA.count);
  setText(`#${prefix}-face-a-label`, faceA.label);
  setText(`#${prefix}-face-b`, faceB.count);
  setText(`#${prefix}-face-b-label`, faceB.label);
  document.querySelector(`[data-stats="${prefix}hedron"] .face-breakdown > div:first-child .face-icon`).className = `face-icon ${faceA.shape}`;
  document.querySelector(`#${prefix}-face-b-row .face-icon`).className = `face-icon ${faceB.shape}`;
  document.querySelector(`#${prefix}-face-b-row`).hidden = !truncated;
}

function updateExperience() {
  const depth = Number(state.depth.toFixed(1));
  const truncated = depth > CUT_THRESHOLD;
  const rectified = depth >= MAX_DEPTH - 0.05;
  const amount = depthToAmount(depth);
  const phase = phaseForDepth(depth);
  const copy = currentCopy();
  const status = statusForDepth(depth);

  elements.depth.value = depth;
  elements.depth.style.setProperty("--range-progress", `${(depth / MAX_DEPTH) * 100}%`);
  elements.depthOutput.value = `${Number.isInteger(depth) ? depth : depth.toFixed(1)}%`;
  elements.depth.setAttribute("aria-valuetext", copy.depthAria(depth, status));

  setText("#dodeca-name", nameFor("dodeca", phase));
  setText("#dodeca-stats-title", nameFor("dodeca", phase));
  setText("#icosa-name", nameFor("icosa", phase));
  setText("#icosa-stats-title", nameFor("icosa", phase));
  setText("#dodeca-status", status);
  setText("#icosa-status", status);

  const dodecaStats = topologyFor(dodecahedron, amount);
  const icosaStats = topologyFor(icosahedron, amount);
  setStats(
    "dodeca",
    dodecaStats,
    {
      label: truncated && !rectified ? copy.decagon : copy.pentagon,
      count: 12,
      shape: truncated && !rectified ? "decagon" : "pentagon",
    },
    { label: copy.triangle, count: truncated ? 20 : 0, shape: "triangle" },
    truncated,
  );
  setStats(
    "icosa",
    icosaStats,
    {
      label: truncated && !rectified ? copy.hexagon : copy.triangle,
      count: 20,
      shape: truncated && !rectified ? "hexagon" : "triangle",
    },
    { label: copy.pentagon, count: truncated ? 12 : 0, shape: "pentagon" },
    truncated,
  );

  setText("#shared-label", truncated ? copy.sameTotals : copy.dualBase);
  setText(
    "#shared-totals",
    truncated
      ? `${dodecaStats.faces} · ${dodecaStats.edges} · ${dodecaStats.vertices}`
      : `${dodecaStats.faces}↔${icosaStats.faces} · ${dodecaStats.edges} · ${dodecaStats.vertices}↔${icosaStats.vertices}`,
  );
  setText("#shared-depth", copy.sharedAt(depth));

  elements.dualStatus.textContent = rectified
    ? copy.dualRectified
    : (truncated ? copy.dualCut : copy.dualBase);
  viewers.forEach((viewer) => viewer.updateGeometry(depth));
}

function updateLanguage() {
  const copy = currentCopy();
  document.documentElement.lang = state.language === "zh" ? "zh-Hant-TW" : "en";
  document.title = copy.pageTitle;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = copy[element.dataset.i18n];
    if (typeof value === "string") {
      element.textContent = value;
    }
  });
  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const value = copy[element.dataset.i18nHtml];
    if (typeof value === "string") {
      element.innerHTML = value;
    }
  });

  elements.language.querySelector(".language-current").textContent = state.language === "zh" ? "中" : "EN";
  elements.language.querySelector(".language-next").textContent = state.language === "zh" ? "EN" : "中";
  elements.language.setAttribute("aria-label", copy.switchLanguage);
  elements.play.setAttribute("aria-label", state.playing ? copy.pause : copy.play);
  elements.dual.querySelector("span").textContent = elements.dual.getAttribute("aria-pressed") === "true"
    ? copy.hideDual
    : copy.showDual;
  elements.theme.setAttribute("aria-label", state.theme === "dark" ? copy.lightMode : copy.darkMode);
  advancedGui.title(copy.advancedTitle);
  advancedControllers.showRemoved.name(copy.showRemoved);
  advancedControllers.rotationSpeed.name(copy.rotationSpeed);
  advancedControllers.resetCamera.name(copy.resetCamera);
  updateExperience();
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  elements.theme.setAttribute("aria-pressed", String(theme === "dark"));
  elements.theme.setAttribute("aria-label", theme === "dark" ? currentCopy().lightMode : currentCopy().darkMode);
  viewers.forEach((viewer) => viewer.setTheme(theme));
  savePreference("polyhedra-theme", theme);
}

function setPlaying(playing) {
  state.playing = playing;
  state.previousTime = performance.now();
  elements.play.classList.toggle("playing", playing);
  elements.play.setAttribute("aria-label", playing ? currentCopy().pause : currentCopy().play);
}

function animateDepth(time) {
  requestAnimationFrame(animateDepth);
  if (!state.playing) {
    state.previousTime = time;
    return;
  }

  const elapsed = Math.min(50, time - state.previousTime);
  state.previousTime = time;
  state.depth += state.direction * elapsed * 0.0068;

  if (state.depth >= MAX_DEPTH) {
    state.depth = MAX_DEPTH;
    state.direction = -1;
  } else if (state.depth <= 0) {
    state.depth = 0;
    state.direction = 1;
  }

  if (time - state.lastDepthRender >= 32) {
    state.lastDepthRender = time;
    updateExperience();
  }
}

elements.depth.addEventListener("input", (event) => {
  setPlaying(false);
  state.depth = Number(event.target.value);
  updateExperience();
});

elements.play.addEventListener("click", () => {
  if (!state.playing && state.depth >= MAX_DEPTH) {
    state.direction = -1;
  }
  setPlaying(!state.playing);
});

elements.reset.addEventListener("click", () => {
  setPlaying(false);
  state.depth = 0;
  state.direction = 1;
  viewers.forEach((viewer) => viewer.resetCamera());
  updateExperience();
});

document.querySelectorAll('input[name="view-mode"]').forEach((input) => {
  input.addEventListener("change", (event) => {
    state.mode = event.target.value;
    viewers.forEach((viewer) => viewer.setMode(state.mode));
  });
});

elements.edges.addEventListener("change", (event) => {
  viewers.forEach((viewer) => viewer.setEdges(event.target.checked));
});

elements.vertices.addEventListener("change", (event) => {
  viewers.forEach((viewer) => viewer.setVertices(event.target.checked));
});

elements.rotate.addEventListener("change", (event) => {
  viewers.forEach((viewer) => viewer.setRotation(event.target.checked, state.rotationSpeed));
});

elements.dual.addEventListener("click", () => {
  const pressed = elements.dual.getAttribute("aria-pressed") !== "true";
  elements.dual.setAttribute("aria-pressed", String(pressed));
  elements.dual.querySelector("span").textContent = pressed ? currentCopy().hideDual : currentCopy().showDual;
  document.body.classList.toggle("dual-active", pressed);
  viewers.forEach((viewer) => viewer.setDual(pressed));
});

elements.language.addEventListener("click", () => {
  state.language = state.language === "zh" ? "en" : "zh";
  savePreference("polyhedra-language", state.language);
  updateLanguage();
});

elements.theme.addEventListener("click", () => {
  applyTheme(state.theme === "dark" ? "light" : "dark");
});

elements.about.addEventListener("click", () => elements.dialog.showModal());
elements.dialog.querySelector(".dialog-close").addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) {
    elements.dialog.close();
  }
});

const advancedSettings = {
  showRemoved: true,
  rotationSpeed: 0.5,
  resetCamera: () => viewers.forEach((viewer) => viewer.resetCamera()),
};
const advancedGui = new GUI({ container: document.querySelector("#advanced-controls") });
const advancedControllers = {
  showRemoved: advancedGui.add(advancedSettings, "showRemoved").onChange((value) => {
    state.showRemoved = value;
    viewers.forEach((viewer) => viewer.setRemoved(value));
  }),
  rotationSpeed: advancedGui.add(advancedSettings, "rotationSpeed", 0.1, 1.2, 0.05).onChange((value) => {
    state.rotationSpeed = value;
    viewers.forEach((viewer) => viewer.setRotation(elements.rotate.checked, value));
  }),
  resetCamera: advancedGui.add(advancedSettings, "resetCamera"),
};
advancedGui.close();

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  elements.rotate.checked = false;
  viewers.forEach((viewer) => viewer.setRotation(false, state.rotationSpeed));
}

applyTheme(state.theme);
updateLanguage();
requestAnimationFrame(animateDepth);
