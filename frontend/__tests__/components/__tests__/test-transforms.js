// Manual test script for transform calculations
// Run with: node frontend/__tests__/components/__tests__/test-transforms.js

// Copy the utility functions here for testing
function normalizeAngle(angle) {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function calculateItemTransform(index, totalItems, rotation, ringRadius) {
  const baseAngle = (360 / totalItems) * index;
  const angle = baseAngle + rotation;
  const angleRad = (angle * Math.PI) / 180;
  const x = Math.sin(angleRad) * ringRadius;
  const z = Math.cos(angleRad) * ringRadius;
  return `translate3d(${x}px, 0, ${z}px) rotateY(${-angle}deg)`;
}

function calculateItemStyle(z, ringRadius) {
  const normalizedZ = (z + ringRadius) / (ringRadius * 2);
  const scale = 0.6 + normalizedZ * 0.4;
  const opacity = 0.4 + normalizedZ * 0.6;
  const zIndex = Math.round(normalizedZ * 100);
  return { scale, opacity, zIndex };
}

function calculateZPosition(index, totalItems, rotation, ringRadius) {
  const baseAngle = (360 / totalItems) * index;
  const angle = baseAngle + rotation;
  const angleRad = (angle * Math.PI) / 180;
  return Math.cos(angleRad) * ringRadius;
}

function calculateFocusedIndex(rotation, totalItems) {
  const normalizedRotation = normalizeAngle(-rotation);
  const itemAngle = 360 / totalItems;
  const focusedIndex = Math.round(normalizedRotation / itemAngle) % totalItems;
  return focusedIndex;
}

// Test utilities
function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAILED:', message);
    process.exitCode = 1;
  } else {
    console.log('✅ PASSED:', message);
  }
}

function assertClose(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    console.error(`❌ FAILED: ${message} (expected ${expected}, got ${actual}, diff ${diff})`);
    process.exitCode = 1;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('\n=== Testing Carousel3D Transform Calculations ===\n');

// Test normalizeAngle
console.log('--- Testing normalizeAngle ---');
assert(normalizeAngle(45) === 45, 'normalizeAngle(45) should be 45');
assert(normalizeAngle(360) === 0, 'normalizeAngle(360) should be 0');
assert(normalizeAngle(450) === 90, 'normalizeAngle(450) should be 90');
assert(normalizeAngle(-45) === 315, 'normalizeAngle(-45) should be 315');
assert(normalizeAngle(-90) === 270, 'normalizeAngle(-90) should be 270');
assert(normalizeAngle(0) === 0, 'normalizeAngle(0) should be 0');

// Test calculateItemTransform with 3 items
console.log('\n--- Testing calculateItemTransform with 3 items ---');
const ringRadius = 300;
let transform = calculateItemTransform(0, 3, 0, ringRadius);
assert(transform.includes('rotateY(0deg)'), '3 items: Item 0 should have rotateY(0deg)');

transform = calculateItemTransform(1, 3, 0, ringRadius);
assert(transform.includes('rotateY(-120deg)'), '3 items: Item 1 should have rotateY(-120deg)');

transform = calculateItemTransform(2, 3, 0, ringRadius);
assert(transform.includes('rotateY(-240deg)'), '3 items: Item 2 should have rotateY(-240deg)');

// Test calculateItemTransform with 6 items
console.log('\n--- Testing calculateItemTransform with 6 items ---');
transform = calculateItemTransform(0, 6, 0, ringRadius);
assert(transform.includes('rotateY(0deg)'), '6 items: Item 0 should have rotateY(0deg)');

transform = calculateItemTransform(3, 6, 0, ringRadius);
assert(transform.includes('rotateY(-180deg)'), '6 items: Item 3 should have rotateY(-180deg)');

// Test calculateItemTransform with 12 items
console.log('\n--- Testing calculateItemTransform with 12 items ---');
for (let i = 0; i < 12; i++) {
  transform = calculateItemTransform(i, 12, 0, ringRadius);
  const expectedAngle = i * 30;
  const expectedRotation = expectedAngle === 0 ? 'rotateY(0deg)' : `rotateY(-${expectedAngle}deg)`;
  assert(
    transform.includes(expectedRotation),
    `12 items: Item ${i} should have ${expectedRotation}`
  );
}

// Test calculateItemStyle
console.log('\n--- Testing calculateItemStyle ---');
let style = calculateItemStyle(ringRadius, ringRadius);
assertClose(style.scale, 1.0, 0.01, 'Front item should have scale 1.0');
assertClose(style.opacity, 1.0, 0.01, 'Front item should have opacity 1.0');
assert(style.zIndex === 100, 'Front item should have zIndex 100');

style = calculateItemStyle(-ringRadius, ringRadius);
assertClose(style.scale, 0.6, 0.01, 'Back item should have scale 0.6');
assertClose(style.opacity, 0.4, 0.01, 'Back item should have opacity 0.4');
assert(style.zIndex === 0, 'Back item should have zIndex 0');

style = calculateItemStyle(0, ringRadius);
assertClose(style.scale, 0.8, 0.01, 'Middle item should have scale 0.8');
assertClose(style.opacity, 0.7, 0.01, 'Middle item should have opacity 0.7');
assert(style.zIndex === 50, 'Middle item should have zIndex 50');

// Test calculateZPosition
console.log('\n--- Testing calculateZPosition ---');
let z = calculateZPosition(0, 3, 0, ringRadius);
assertClose(z, ringRadius, 1, '3 items: Item 0 should be at front (z = ringRadius)');

z = calculateZPosition(0, 6, 0, ringRadius);
assertClose(z, ringRadius, 1, '6 items: Item 0 should be at front');

z = calculateZPosition(3, 6, 0, ringRadius);
assertClose(z, -ringRadius, 1, '6 items: Item 3 should be at back (z = -ringRadius)');

// Test calculateFocusedIndex
console.log('\n--- Testing calculateFocusedIndex ---');
assert(calculateFocusedIndex(0, 3) === 0, '3 items: rotation 0 should focus item 0');
assert(calculateFocusedIndex(-120, 3) === 1, '3 items: rotation -120 should focus item 1');
assert(calculateFocusedIndex(-240, 3) === 2, '3 items: rotation -240 should focus item 2');

assert(calculateFocusedIndex(0, 6) === 0, '6 items: rotation 0 should focus item 0');
assert(calculateFocusedIndex(-60, 6) === 1, '6 items: rotation -60 should focus item 1');
assert(calculateFocusedIndex(-180, 6) === 3, '6 items: rotation -180 should focus item 3');

assert(calculateFocusedIndex(0, 12) === 0, '12 items: rotation 0 should focus item 0');
assert(calculateFocusedIndex(-30, 12) === 1, '12 items: rotation -30 should focus item 1');
assert(calculateFocusedIndex(-90, 12) === 3, '12 items: rotation -90 should focus item 3');

console.log('\n=== Test Summary ===');
if (process.exitCode === 1) {
  console.log('❌ Some tests failed');
} else {
  console.log('✅ All tests passed!');
}