const EPSILON = 1e-7;

function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(vector, amount) {
  return [vector[0] * amount, vector[1] * amount, vector[2] * amount];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function length(vector) {
  return Math.sqrt(dot(vector, vector));
}

function normalize(vector) {
  const magnitude = length(vector);
  return magnitude < EPSILON ? [0, 0, 0] : scale(vector, 1 / magnitude);
}

function average(points) {
  return scale(points.reduce((sum, point) => add(sum, point), [0, 0, 0]), 1 / points.length);
}

function lerp(a, b, amount) {
  return add(scale(a, 1 - amount), scale(b, amount));
}

function pointsMatch(a, b, epsilon = 1e-6) {
  return length(subtract(a, b)) < epsilon;
}

function collapseFacePoints(points) {
  const collapsed = points.filter((point, index) => (
    index === 0 || !pointsMatch(point, points[index - 1])
  ));

  if (collapsed.length > 1 && pointsMatch(collapsed[0], collapsed.at(-1))) {
    collapsed.pop();
  }

  return collapsed;
}

function uniquePoints(points) {
  return points.filter((point, index) => (
    points.findIndex((candidate) => pointsMatch(point, candidate)) === index
  ));
}

function faceNormal(points) {
  let normal = [0, 0, 0];

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    normal = add(normal, [
      (current[1] - next[1]) * (current[2] + next[2]),
      (current[2] - next[2]) * (current[0] + next[0]),
      (current[0] - next[0]) * (current[1] + next[1]),
    ]);
  }

  return normalize(normal);
}

function sortFaceVertices(indices, vertices, outwardNormal) {
  const center = average(indices.map((index) => vertices[index]));
  const reference = normalize(subtract(vertices[indices[0]], center));
  const tangent = normalize(cross(outwardNormal, reference));

  const sorted = [...indices].sort((a, b) => {
    const relativeA = subtract(vertices[a], center);
    const relativeB = subtract(vertices[b], center);
    const angleA = Math.atan2(dot(relativeA, tangent), dot(relativeA, reference));
    const angleB = Math.atan2(dot(relativeB, tangent), dot(relativeB, reference));
    return angleA - angleB;
  });

  const points = sorted.map((index) => vertices[index]);
  return dot(faceNormal(points), outwardNormal) < 0 ? sorted.reverse() : sorted;
}

function findConvexFaces(vertices) {
  const faces = new Map();

  for (let first = 0; first < vertices.length - 2; first += 1) {
    for (let second = first + 1; second < vertices.length - 1; second += 1) {
      for (let third = second + 1; third < vertices.length; third += 1) {
        const edgeA = subtract(vertices[second], vertices[first]);
        const edgeB = subtract(vertices[third], vertices[first]);
        let normal = normalize(cross(edgeA, edgeB));

        if (length(normal) < EPSILON) {
          continue;
        }

        const distances = vertices.map((vertex) => dot(normal, subtract(vertex, vertices[first])));
        const maximum = Math.max(...distances);
        const minimum = Math.min(...distances);

        if (maximum > 1e-6 && minimum < -1e-6) {
          continue;
        }

        const indices = distances
          .map((distance, index) => ({ distance, index }))
          .filter(({ distance }) => Math.abs(distance) < 1e-6)
          .map(({ index }) => index);

        if (indices.length < 3) {
          continue;
        }

        const key = [...indices].sort((a, b) => a - b).join(":");
        if (faces.has(key)) {
          continue;
        }

        const center = average(indices.map((index) => vertices[index]));
        if (dot(normal, center) < 0) {
          normal = scale(normal, -1);
        }

        faces.set(key, sortFaceVertices(indices, vertices, normal));
      }
    }
  }

  return [...faces.values()];
}

function collectEdges(faces) {
  const edges = new Map();

  faces.forEach((face) => {
    face.forEach((vertex, index) => {
      const next = face[(index + 1) % face.length];
      const key = vertex < next ? `${vertex}:${next}` : `${next}:${vertex}`;
      edges.set(key, vertex < next ? [vertex, next] : [next, vertex]);
    });
  });

  return [...edges.values()];
}

function normalizeRadius(vertices, radius) {
  const currentRadius = Math.max(...vertices.map((vertex) => length(vertex)));
  return vertices.map((vertex) => scale(vertex, radius / currentRadius));
}

function createIcosahedronVertices() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const vertices = [];

  [-1, 1].forEach((first) => {
    [-1, 1].forEach((second) => {
      vertices.push([0, first, second * phi]);
      vertices.push([first, second * phi, 0]);
      vertices.push([second * phi, 0, first]);
    });
  });

  return vertices;
}

function createDodecahedronVertices() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const inversePhi = 1 / phi;
  const vertices = [];

  [-1, 1].forEach((x) => {
    [-1, 1].forEach((y) => {
      [-1, 1].forEach((z) => vertices.push([x, y, z]));
    });
  });

  [-1, 1].forEach((first) => {
    [-1, 1].forEach((second) => {
      vertices.push([0, first * inversePhi, second * phi]);
      vertices.push([first * inversePhi, second * phi, 0]);
      vertices.push([second * phi, 0, first * inversePhi]);
    });
  });

  return vertices;
}

export function createPolyhedron(type, radius = 2.05) {
  const rawVertices = type === "dodecahedron"
    ? createDodecahedronVertices()
    : createIcosahedronVertices();
  const vertices = normalizeRadius(rawVertices, radius);
  const faces = findConvexFaces(vertices);
  const edges = collectEdges(faces);

  return { type, vertices, faces, edges };
}

function sortedNeighbors(polyhedron, vertexIndex) {
  const neighbors = polyhedron.edges
    .filter((edge) => edge.includes(vertexIndex))
    .map(([first, second]) => (first === vertexIndex ? second : first));
  const center = polyhedron.vertices[vertexIndex];
  const outward = normalize(center);
  const reference = normalize(subtract(polyhedron.vertices[neighbors[0]], center));
  const tangent = normalize(cross(outward, reference));

  const result = [...neighbors].sort((a, b) => {
    const vectorA = subtract(polyhedron.vertices[a], center);
    const vectorB = subtract(polyhedron.vertices[b], center);
    const angleA = Math.atan2(dot(vectorA, tangent), dot(vectorA, reference));
    const angleB = Math.atan2(dot(vectorB, tangent), dot(vectorB, reference));
    return angleA - angleB;
  });

  const points = result.map((index) => polyhedron.vertices[index]);
  return dot(faceNormal(points), outward) < 0 ? result.reverse() : result;
}

export function truncatePolyhedron(polyhedron, amount) {
  const safeAmount = Math.max(0, Math.min(1 / 2, amount));

  if (safeAmount < EPSILON) {
    return {
      originalFaces: polyhedron.faces.map((face) => face.map((index) => polyhedron.vertices[index])),
      capFaces: [],
      cutFragments: [],
      vertices: polyhedron.vertices,
      isTruncated: false,
      isRectified: false,
    };
  }

  const directedPoints = new Map();
  polyhedron.edges.forEach(([first, second]) => {
    directedPoints.set(`${first}:${second}`, lerp(polyhedron.vertices[first], polyhedron.vertices[second], safeAmount));
    directedPoints.set(`${second}:${first}`, lerp(polyhedron.vertices[second], polyhedron.vertices[first], safeAmount));
  });

  const originalFaces = polyhedron.faces.map((face) => {
    const points = [];
    face.forEach((vertex, index) => {
      const previous = face[(index - 1 + face.length) % face.length];
      const next = face[(index + 1) % face.length];
      points.push(directedPoints.get(`${vertex}:${previous}`));
      points.push(directedPoints.get(`${vertex}:${next}`));
    });
    return collapseFacePoints(points);
  });

  const capFaces = [];
  const cutFragments = [];

  polyhedron.vertices.forEach((vertex, vertexIndex) => {
    const neighbors = sortedNeighbors(polyhedron, vertexIndex);
    const cap = neighbors.map((neighbor) => directedPoints.get(`${vertexIndex}:${neighbor}`));
    const outward = normalize(vertex);
    const orderedCap = dot(faceNormal(cap), outward) < 0 ? cap.reverse() : cap;
    capFaces.push(orderedCap);

    const sideFaces = orderedCap.map((point, index) => [
      vertex,
      orderedCap[(index + 1) % orderedCap.length],
      point,
    ]);

    cutFragments.push({
      cap: [...orderedCap].reverse(),
      direction: outward,
      sideFaces,
    });
  });

  return {
    originalFaces,
    capFaces,
    cutFragments,
    vertices: uniquePoints([...directedPoints.values()]),
    isTruncated: true,
    isRectified: safeAmount >= 1 / 2 - EPSILON,
  };
}

export function topologyFor(polyhedron, amount = 0) {
  if (amount < EPSILON) {
    return {
      faces: polyhedron.faces.length,
      edges: polyhedron.edges.length,
      vertices: polyhedron.vertices.length,
    };
  }

  if (amount >= 1 / 2 - EPSILON) {
    return {
      faces: polyhedron.faces.length + polyhedron.vertices.length,
      edges: polyhedron.edges.length * 2,
      vertices: polyhedron.edges.length,
    };
  }

  return {
    faces: polyhedron.faces.length + polyhedron.vertices.length,
    edges: polyhedron.edges.length * 3,
    vertices: polyhedron.edges.length * 2,
  };
}

export const vectorMath = {
  add,
  average,
  cross,
  dot,
  faceNormal,
  length,
  normalize,
  scale,
  subtract,
};
