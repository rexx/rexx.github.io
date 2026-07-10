import assert from "node:assert/strict";
import test from "node:test";
import { createPolyhedron, topologyFor, truncatePolyhedron } from "../polyhedra.mjs";

const expectedBase = {
  dodecahedron: { edges: 30, faceCount: 12, faceSize: 5, vertices: 20 },
  icosahedron: { edges: 30, faceCount: 20, faceSize: 3, vertices: 12 },
};

const expectedTruncated = {
  dodecahedron: { capCount: 20, capSize: 3, originalCount: 12, originalSize: 10 },
  icosahedron: { capCount: 12, capSize: 5, originalCount: 20, originalSize: 6 },
};

Object.entries(expectedBase).forEach(([type, expected]) => {
  test(`${type} has the expected base topology`, () => {
    const polyhedron = createPolyhedron(type);
    assert.equal(polyhedron.vertices.length, expected.vertices);
    assert.equal(polyhedron.edges.length, expected.edges);
    assert.equal(polyhedron.faces.length, expected.faceCount);
    assert.ok(polyhedron.faces.every((face) => face.length === expected.faceSize));
    assert.equal(
      polyhedron.vertices.length - polyhedron.edges.length + polyhedron.faces.length,
      2,
    );
  });
});

Object.entries(expectedTruncated).forEach(([type, expected]) => {
  test(`${type} produces the expected uniform truncation`, () => {
    const polyhedron = createPolyhedron(type);
    const truncated = truncatePolyhedron(polyhedron, 1 / 3);
    const topology = topologyFor(polyhedron, 1 / 3);

    assert.equal(truncated.originalFaces.length, expected.originalCount);
    assert.equal(truncated.capFaces.length, expected.capCount);
    assert.ok(truncated.originalFaces.every((face) => face.length === expected.originalSize));
    assert.ok(truncated.capFaces.every((face) => face.length === expected.capSize));
    assert.deepEqual(topology, { edges: 90, faces: 32, vertices: 60 });
    assert.equal(topology.vertices - topology.edges + topology.faces, 2);
  });
});

test("zero truncation preserves the source faces", () => {
  const polyhedron = createPolyhedron("dodecahedron");
  const result = truncatePolyhedron(polyhedron, 0);

  assert.equal(result.isTruncated, false);
  assert.equal(result.capFaces.length, 0);
  assert.equal(result.cutFragments.length, 0);
  assert.equal(result.originalFaces.length, polyhedron.faces.length);
});

Object.entries(expectedBase).forEach(([type, base]) => {
  test(`${type} rectifies at the edge midpoints`, () => {
    const polyhedron = createPolyhedron(type);
    const rectified = truncatePolyhedron(polyhedron, 1 / 2);
    const topology = topologyFor(polyhedron, 1 / 2);

    assert.equal(rectified.isRectified, true);
    assert.equal(rectified.vertices.length, 30);
    assert.equal(rectified.originalFaces.length, base.faceCount);
    assert.ok(rectified.originalFaces.every((face) => face.length === base.faceSize));
    assert.equal(rectified.capFaces.length, base.vertices);
    assert.deepEqual(topology, { edges: 60, faces: 32, vertices: 30 });
    assert.equal(topology.vertices - topology.edges + topology.faces, 2);
  });
});

test("deep truncation preserves the open truncation topology before rectification", () => {
  const polyhedron = createPolyhedron("icosahedron");
  assert.deepEqual(topologyFor(polyhedron, 0.4), { edges: 90, faces: 32, vertices: 60 });
});

test("truncation depth is clamped to the rectification limit", () => {
  const polyhedron = createPolyhedron("icosahedron");
  const atLimit = truncatePolyhedron(polyhedron, 1 / 2);
  const beyondLimit = truncatePolyhedron(polyhedron, 0.9);

  assert.deepEqual(beyondLimit.originalFaces, atLimit.originalFaces);
  assert.deepEqual(beyondLimit.capFaces, atLimit.capFaces);
});
