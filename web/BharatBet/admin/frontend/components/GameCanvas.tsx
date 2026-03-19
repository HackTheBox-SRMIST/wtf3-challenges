import React, { useRef, useEffect } from 'react';
import { GameStatus } from '../types';

interface GameCanvasProps {
  status: GameStatus;
  currentMultiplier: number;
  width: number;
  height: number;
  flightStartTime?: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ status, currentMultiplier, width, height, flightStartTime }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Refs for consistent rendering state
  const lastTimeRef = useRef(Date.now());
  
  // Crash Animation State
  const crashDataRef = useRef<{
    active: boolean;
    startTime: number;
    startElapsed: number; // The game time when crash happened
    startAlt: number; // Altitude at crash
    startX: number; // Screen X at crash (frozen for calculation relative to view)
    hasHitGround: boolean;
  }>({
    active: false,
    startTime: 0,
    startElapsed: 0,
    startAlt: 0,
    startX: 0,
    hasHitGround: false
  });
  
  const prevStatusRef = useRef(status);

  useEffect(() => {
    // Detect Crash Event to initialize animation
    if (prevStatusRef.current === GameStatus.FLYING && status === GameStatus.CRASHED) {
       crashDataRef.current = {
           active: true,
           startTime: Date.now(),
           startElapsed: 0, // Will be set in render
           startAlt: 0, // Will be set in render
           startX: 0, // Will be set in render
           hasHitGround: false
       };
    }
    
    // Reset on Waiting
    if (status === GameStatus.WAITING) {
        crashDataRef.current.active = false;
        crashDataRef.current.hasHitGround = false;
    }

    prevStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const render = () => {
      const now = Date.now();
      lastTimeRef.current = now;

      // 1. CLEAR CANVAS
      ctx.clearRect(0, 0, width, height);

      // 2. TIME STATE
      let elapsed = 0;
      if (status === GameStatus.FLYING && flightStartTime) {
          elapsed = (now - flightStartTime) / 1000;
      } else if (status === GameStatus.CRASHED && flightStartTime) {
          // In crash state, we freeze the "Game Time" for the graph history
          // but we need to know the crash moment
          elapsed = Math.log(currentMultiplier) / 0.04;
      }

      // 3. FLIGHT PATH MATH (Smoother, parabolic-ish takeoff)
      const getAltitude = (t: number) => {
          if (t <= 0) return 0;
          
          // Base Curve: Accelerating slightly (t^1.4)
          const baseAlt = Math.pow(t, 1.4) * 12;

          // Turbulence: Continuous, smooth waves
          let turbulence = 0;
          if (t > 2) {
              const rampUp = Math.min(1, (t - 2) / 2); 
              const wave1 = Math.sin(t * 1.5) * 15; 
              const wave2 = Math.sin(t * 3.5) * 5;  
              turbulence = (wave1 + wave2) * rampUp;
          }

          return Math.max(0, baseAlt + turbulence);
      };

      // 4. CAMERA / VIEWPORT LOGIC
      // Sliding window
      const windowSize = 6;
      let startT = 0;
      let endT = windowSize;
      
      const viewTime = (status === GameStatus.CRASHED) ? elapsed : elapsed;

      if (viewTime > (windowSize - 1.5)) {
          endT = viewTime + 1.5;
          startT = endT - windowSize;
      }

      // Y-Axis Scaling
      // Increased ceiling usage: Factor reduced from 1.5 to 1.15
      // This allows the plane to go up to ~85% of the screen height
      const currentFlightAlt = getAltitude(elapsed);
      let maxAltInView = Math.max(100, currentFlightAlt * 1.15);

      const mapX = (t: number) => ((t - startT) / (endT - startT)) * width;
      // Reduced bottom padding to 20 to give more vertical room
      const mapY = (alt: number) => height - ((alt / maxAltInView) * height) - 20; 

      // 5. DRAW GRID
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      const firstLineT = Math.floor(startT);
      for(let t = firstLineT; t <= endT; t++) {
          const x = mapX(t);
          if (x >= 0 && x <= width) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
          }
      }
      for(let i = 1; i < 5; i++) {
          const y = (height / 5) * i;
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Waiting State
      if (status === GameStatus.WAITING) {
         drawPlane(ctx, 50, height - 50, -0.15, '#444', 1);
         return;
      }

      // 6. DRAW GRAPH PATH
      ctx.beginPath();
      const step = 0.05;
      let firstPoint = true;
      
      // Draw history
      for (let t = Math.max(0, startT - 1); t <= elapsed; t += step) {
          const x = mapX(t);
          const y = mapY(getAltitude(t));
          if (firstPoint) {
              ctx.moveTo(x, height); // anchor bottom
              ctx.lineTo(x, y);
              firstPoint = false;
          } else {
              ctx.lineTo(x, y);
          }
      }

      // Current "Graph" Point (The moment before crash or current flying)
      let graphEndX = mapX(elapsed);
      let graphEndY = mapY(getAltitude(elapsed));
      
      // If CRASHED, we need to calculate the drop path and extend the line
      let planeScreenX = graphEndX;
      let planeScreenY = graphEndY;
      let planeRotation = -0.2; // Default climb angle

      if (status === GameStatus.CRASHED && crashDataRef.current.active) {
          // Initialize crash anchor data once
          if (crashDataRef.current.startElapsed === 0) {
              crashDataRef.current.startElapsed = elapsed;
              crashDataRef.current.startAlt = getAltitude(elapsed);
              crashDataRef.current.startX = graphEndX;
          }

          const crashTime = (now - crashDataRef.current.startTime) / 1000;
          
          // CRASH PHYSICS
          const vx = 0; // Stop moving forward
          const g = 1200; 
          
          const dropX = graphEndX + (vx * crashTime); 
          const dropY = graphEndY + (0.5 * g * crashTime * crashTime);

          // Check Ground Collision
          const groundY = height - 25; // Floor level
          if (dropY >= groundY) {
              planeScreenY = groundY;
              planeScreenX = dropX;
              crashDataRef.current.hasHitGround = true;
          } else {
              planeScreenY = dropY;
              planeScreenX = dropX;
          }

          // Add Jitter if on ground
          if (crashDataRef.current.hasHitGround) {
             planeScreenX += (Math.random() - 0.5) * 1.5;
             planeScreenY += (Math.random() - 0.5) * 1.5;
          }
          
          // Extend the Graph Line to the falling plane
          ctx.lineTo(planeScreenX, planeScreenY);
          
          // Calculate Nose Dive Angle
          const vy = g * crashTime;
          planeRotation = Math.atan2(vy, vx + 10); // +10 to avoid div by zero if vx=0 exactly
          if (crashDataRef.current.hasHitGround) planeRotation = 0.05; // Slightly tilted on ground
      } else {
          // FLYING Rotation
          const prevX = mapX(elapsed - 0.1);
          const prevY = mapY(getAltitude(elapsed - 0.1));
          const dx = graphEndX - prevX;
          const dy = graphEndY - prevY;
          planeRotation = Math.atan2(dy, dx);
          planeRotation = Math.max(-0.5, Math.min(0.2, planeRotation));
      }

      // Finish Graph Shape
      ctx.lineTo(planeScreenX, height);
      ctx.closePath();

      // FILL
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)'); 
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // STROKE
      ctx.beginPath();
      firstPoint = true;
      for (let t = Math.max(0, startT - 1); t <= elapsed; t += step) {
          const x = mapX(t);
          const y = mapY(getAltitude(t));
          if (firstPoint) {
              ctx.moveTo(x, y);
              firstPoint = false;
          } else {
              ctx.lineTo(x, y);
          }
      }
      
      // Connect to current plane pos (Crash line)
      ctx.lineTo(planeScreenX, planeScreenY);
      
      ctx.strokeStyle = '#ef4444'; 
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();


      // 7. DRAW OBJECTS
      if (status === GameStatus.CRASHED && crashDataRef.current.hasHitGround) {
          // EXPLOSION / SMOKE EFFECT
          const crashTime = (now - crashDataRef.current.startTime) / 1000;
          
          drawExplosion(ctx, planeScreenX, planeScreenY, crashTime);
          
          // Draw Plane (Intact but Dark/Burnt)
          // No scattering, just the plane sitting on the ground
          drawPlane(ctx, planeScreenX, planeScreenY, 0.1, '#333', 1);
          
      } else {
          // FLYING or FALLING Plane
          const color = status === GameStatus.CRASHED ? '#b91c1c' : '#ef4444';
          drawPlane(ctx, planeScreenX, planeScreenY, planeRotation, color, 1);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [currentMultiplier, status, width, height, flightStartTime]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block"
    />
  );
};

// ... Drawing helpers ...
function drawPlane(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, color: string, opacity: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = opacity;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(35, 0); 
    ctx.bezierCurveTo(15, -10, -15, -12, -40, -8); 
    ctx.lineTo(-50, -25);
    ctx.lineTo(-55, -25);
    ctx.lineTo(-50, -5);
    ctx.lineTo(-55, 5); 
    ctx.lineTo(-15, 10);
    ctx.lineTo(-5, 25);
    ctx.lineTo(15, 25);
    ctx.lineTo(20, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.ellipse(15, -5, 8, 3, 0.1, 0, Math.PI*2);
    ctx.fill();
    // Engine Fire (only if not burnt)
    if (color === '#ef4444' || color === '#b91c1c') {
        ctx.fillStyle = `rgba(255, 200, 0, ${0.4 + Math.random() * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(-55, 0);
        ctx.lineTo(-80 - Math.random()*20, 0);
        ctx.lineTo(-55, 6);
        ctx.fill();
    }
    ctx.restore();
}

function drawExplosion(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
    // Continuous smoke effect after crash
    const count = 5;
    ctx.save();
    ctx.translate(x, y);
    
    // Dark Smoke
    ctx.fillStyle = `rgba(50, 50, 50, 0.6)`;
    // Animate smoke rising
    const rise = (time * 20) % 100;
    
    for(let i=0; i<count; i++) {
        const offset = (rise + i*20) % 80;
        const spread = Math.sin(time + i) * 10;
        const alpha = Math.max(0, 1 - offset/80);
        
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(spread - 20, -offset, 15 + offset/3, 0, Math.PI*2);
        ctx.fill();
    }
    
    // Initial Fire Flash (only for first second)
    if (time < 0.5) {
        ctx.globalAlpha = 1 - time*2;
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(0, 0, 40 * time + 20, 0, Math.PI*2);
        ctx.fill();
    }

    ctx.restore();
}

export default GameCanvas;