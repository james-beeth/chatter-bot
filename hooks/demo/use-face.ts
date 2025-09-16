/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState, useCallback } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';

export type FaceResults = {
  /** A value that represents how open the eyes are. */
  eyeScale: number;
  /** A value that represents how open the mouth is. */
  mouthScale: number;
};

/*
function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}

function easeInOutExpo(x: number): number {
  return x === 0
    ? 0
    : x === 1
    ? 1
    : x < 0.5
    ? Math.pow(2, 20 * x - 10) / 2
    : (2 - Math.pow(2, -20 * x + 10)) / 2
}

function easeOutCirc(x: number): number {
  return Math.sqrt(1 - Math.pow(x - 1, 2))
}
*/

function easeOutQuint(x: number): number {
  return 1 - Math.pow(1 - x, 5);
}

// Constrain value between lower and upper limits
function clamp(x: number, lowerlimit: number, upperlimit: number) {
  if (x < lowerlimit) x = lowerlimit;
  if (x > upperlimit) x = upperlimit;
  return x;
}

// GLSL smoothstep implementation
function smoothstep(edge0: number, edge1: number, x: number) {
  // Scale, bias, and saturate to range [0,1]
  x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  // Apply cubic polynomial smoothing
  return x * x * (3 - 2 * x);
}

type BlinkProps = {
  speed: number;
};

// A more realistic blink hook that triggers random blinks
export function useBlink({ speed }: BlinkProps) {
  const [eyeScale, setEyeScale] = useState(1);
  const animationFrameId = useRef(-1);
  // Fix: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
  const blinkTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerBlink = useCallback(() => {
    let start: number | null = null;
    const duration = 150; // Blink duration in ms

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const t = Math.min(1, progress / duration);

      // A smooth curve from 1 down to 0 and back to 1 using a sine wave
      const scale = Math.sin(t * Math.PI);
      setEyeScale(1 - scale);

      if (progress < duration) {
        animationFrameId.current = window.requestAnimationFrame(step);
      } else {
        setEyeScale(1); // Ensure it's fully open
      }
    };

    if (animationFrameId.current !== -1) {
      window.cancelAnimationFrame(animationFrameId.current);
    }
    animationFrameId.current = window.requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    const scheduleNextBlink = () => {
      // Blink every 2-5 seconds
      const delay = 2000 + Math.random() * 3000;
      blinkTimeoutId.current = setTimeout(() => {
        triggerBlink();
        scheduleNextBlink();
      }, delay);
    };

    scheduleNextBlink();

    return () => {
      if (animationFrameId.current !== -1) {
        window.cancelAnimationFrame(animationFrameId.current);
      }
      if (blinkTimeoutId.current) {
        clearTimeout(blinkTimeoutId.current);
      }
    };
  }, [triggerBlink]);

  return eyeScale;
}

export default function useFace() {
  const { volume } = useLiveAPIContext();
  const eyeScale = useBlink({ speed: 0.0125 }); // speed is not used

  // Smooth out the volume for a less jerky mouth movement
  const [smoothedVolume, setSmoothedVolume] = useState(0);
  useEffect(() => {
    // A simple low-pass filter to smooth the volume
    setSmoothedVolume(current => current * 0.7 + volume * 0.3);
  }, [volume]);

  return { eyeScale, mouthScale: smoothedVolume * 1.5 };
}
