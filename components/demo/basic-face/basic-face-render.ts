/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
type BasicFaceProps = {
  ctx: CanvasRenderingContext2D;
  mouthScale: number;
  eyeScale: number;
  color?: string;
};

export function renderBasicFace(props: BasicFaceProps) {
  const {
    ctx,
    eyeScale: eyesOpenness,
    mouthScale: mouthOpenness,
    color,
  } = props;
  const { width, height } = ctx.canvas;

  // Clear the canvas
  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width / 2 - 10;

  // --- Face Background ---
  ctx.save();
  // Create a subtle radial gradient for a 3D effect
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    radius * 0.5,
    centerX,
    centerY,
    radius
  );

  let lighterColor = color || '#FFFFFF';
  // Lighten the base color for the gradient center, handles hex colors
  if (color && color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    lighterColor = `rgb(${Math.min(255, r + 40)}, ${Math.min(
      255,
      g + 40
    )}, ${Math.min(255, b + 40)})`;
  }

  gradient.addColorStop(0, lighterColor);
  gradient.addColorStop(1, color || 'white');

  // Draw the face with the gradient
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- Eyes ---
  const eyeRadius = width / 16;
  const pupilRadius = eyeRadius / 2;
  const eyeOffsetY = -height / 12;
  const eyeOffsetX = width / 5;

  const leftEyePos = { x: centerX - eyeOffsetX, y: centerY + eyeOffsetY };
  const rightEyePos = { x: centerX + eyeOffsetX, y: centerY + eyeOffsetY };

  const drawEye = (pos: { x: number; y: number }) => {
    ctx.save();
    ctx.translate(pos.x, pos.y);

    // Use a clipping path to simulate the eyelid
    ctx.beginPath();
    ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
    ctx.clip();

    // Sclera (white part)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(0, 0, pupilRadius, 0, Math.PI * 2);
    ctx.fill();

    // Glint (highlight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(
      -pupilRadius * 0.3,
      -pupilRadius * 0.3,
      pupilRadius / 2.5,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Eyelid (a circle that moves down from the top)
    const baseColor = color || 'white';
    ctx.fillStyle = baseColor;
    const lidY = -eyeRadius * 2 + eyeRadius * 2 * (1 - eyesOpenness);
    ctx.beginPath();
    ctx.arc(0, lidY, eyeRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  drawEye(leftEyePos);
  drawEye(rightEyePos);

  // --- Mouth ---
  const mouthCenterY = centerY + height / 7;
  const mouthWidth = width / 8;
  const mouthHeight = Math.max(5, (height / 6) * mouthOpenness);

  ctx.fillStyle = '#333333';
  ctx.beginPath();
  // A "D" shape for the mouth
  ctx.ellipse(centerX, mouthCenterY, mouthWidth, mouthHeight, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
}
