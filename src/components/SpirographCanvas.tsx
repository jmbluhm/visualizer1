import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Box } from '@mui/material';
import { SpirographParams, GradientColor, FixedShapeConfig, CircleConfig, SquareConfig, StarConfig, TriangleConfig, OvalConfig } from '../types';

interface Props {
  params: SpirographParams;
  isPlaying: boolean;
}

export interface SpirographCanvasRef {
  clearCanvas: () => void;
  downloadImage: () => void;
}

interface Point {
  x: number;
  y: number;
}

const getColorFromGradient = (gradient: GradientColor, progress: number): string => {
  if (gradient.type === 'solid') {
    return gradient.colors[0];
  }

  const colors = gradient.colors;
  const segmentLength = 1 / (colors.length - 1);
  const index = Math.floor(progress / segmentLength);
  const t = (progress - index * segmentLength) / segmentLength;

  const color1 = colors[index];
  const color2 = colors[Math.min(index + 1, colors.length - 1)];

  // Convert hex to RGB
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  // Interpolate
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Linear interpolation between two points
const lerp = (start: Point, end: Point, t: number): Point => ({
  x: start.x + (end.x - start.x) * t,
  y: start.y + (end.y - start.y) * t
});

// Calculate distance between two points
const distance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const isCircleConfig = (config: FixedShapeConfig): config is CircleConfig => 
  config.type === 'circle';

const isSquareConfig = (config: FixedShapeConfig): config is SquareConfig =>
  config.type === 'square';

const isStarConfig = (config: FixedShapeConfig): config is StarConfig =>
  config.type === 'star';

const isTriangleConfig = (config: FixedShapeConfig): config is TriangleConfig =>
  config.type === 'triangle';

const isOvalConfig = (config: FixedShapeConfig): config is OvalConfig =>
  config.type === 'oval';

const getEffectiveRadius = (fixedShape: FixedShapeConfig): number => {
  if (isCircleConfig(fixedShape)) {
    return fixedShape.params.radius;
  }
  
  if (isSquareConfig(fixedShape)) {
    const { edgeLength, cornerRadius } = fixedShape.params;
    const halfEdge = edgeLength / 2;
    if (cornerRadius === 0) {
      return halfEdge;
    }
    return Math.sqrt(Math.pow(halfEdge, 2) * 2) - cornerRadius;
  }
  
  if (isStarConfig(fixedShape)) {
    return fixedShape.params.outerRadius;
  }
  
  if (isTriangleConfig(fixedShape)) {
    return (fixedShape.params.sideLength * Math.sqrt(3)) / 3;
  }
  
  if (isOvalConfig(fixedShape)) {
    return fixedShape.params.majorAxis / 2;
  }
  
  return 150; // fallback
};

export const SpirographCanvas = forwardRef<SpirographCanvasRef, Props>(
  ({ params, isPlaying }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>();
    const angleRef = useRef<number>(0);
    const lastPointRef = useRef<Point | null>(null);
    const frameCountRef = useRef<number>(0);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const zoomRef = useRef<number>(1);
    const isPanningRef = useRef<boolean>(false);
    const lastPanPointRef = useRef<Point | null>(null);
    const offsetRef = useRef<Point>({ x: 0, y: 0 });

    const initializeCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      if (!container) return;

      const { width, height } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Store the current image and transform state
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx && contextRef.current) {
        // Copy the current transform matrix
        const currentTransform = contextRef.current.getTransform();
        tempCtx.setTransform(currentTransform);
        tempCtx.drawImage(canvas, 0, 0);
      }

      // Resize canvas if needed
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      // Clear and set background
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply transformations
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      ctx.scale(dpr * zoomRef.current, dpr * zoomRef.current);
      ctx.translate(
        width / (2 * zoomRef.current) + offsetRef.current.x,
        height / (2 * zoomRef.current) + offsetRef.current.y
      );
      
      contextRef.current = ctx;

      // Restore the previous drawing with preserved transform
      if (tempCtx) {
        // Save current transform
        const currentTransform = ctx.getTransform();
        // Reset to identity matrix for the image restoration
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
        // Restore the transform
        ctx.setTransform(currentTransform);
      }
    }, []);

    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      // Clear the canvas
      ctx.fillStyle = '#121212';
      ctx.fillRect(
        -width / 2 - offsetRef.current.x,
        -height / 2 - offsetRef.current.y,
        width,
        height
      );
      
      // Redraw coordinate axes
      ctx.beginPath();
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.moveTo(-width / 2 - offsetRef.current.x, 0);
      ctx.lineTo(width / 2 - offsetRef.current.x, 0);
      ctx.moveTo(0, -height / 2 - offsetRef.current.y);
      ctx.lineTo(0, height / 2 - offsetRef.current.y);
      ctx.stroke();

      // Redraw center point
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0000';
      ctx.fill();

      // Reset drawing state but keep angle for continuous drawing
      lastPointRef.current = null;
      frameCountRef.current = 0;
    }, []);

    const downloadImage = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Create a temporary canvas to flatten the image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Fill with background color
        tempCtx.fillStyle = '#121212';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the current canvas content
        tempCtx.drawImage(canvas, 0, 0);
        
        // Create download link
        const link = document.createElement('a');
        link.download = `spirograph-${new Date().toISOString().slice(0, -5).replace(/[:.]/g, '-')}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
      }
    }, []);

    useImperativeHandle(ref, () => ({
      clearCanvas,
      downloadImage
    }), [clearCanvas, downloadImage]);

    const calculatePoint = useCallback((angle: number) => {
      const { r, d, fixedShape } = params;
      const R = getEffectiveRadius(fixedShape);
      
      let x = (R - r) * Math.cos(angle);
      let y = (R - r) * Math.sin(angle);
      
      if (isOvalConfig(fixedShape)) {
        // Adjust for oval shape
        const { rotation } = fixedShape.params;
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const tempX = x;
        x = x * cos - y * sin;
        y = tempX * sin + y * cos;
      }
      
      // Add pen position
      x += d * Math.cos((R - r) * angle / r);
      y -= d * Math.sin((R - r) * angle / r);
      
      return { x, y };
    }, [params]);

    const draw = useCallback(() => {
      const ctx = contextRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;

      const scale = Math.min(
        canvas.width / (window.devicePixelRatio || 1),
        canvas.height / (window.devicePixelRatio || 1)
      ) * 0.2;

      // Calculate new point
      const newAngle = angleRef.current + params.speed;
      const currentPoint = calculatePoint(angleRef.current);
      const nextPoint = calculatePoint(newAngle);

      // Scale points
      const scaledCurrent = {
        x: currentPoint.x,
        y: currentPoint.y
      };

      const scaledNext = {
        x: nextPoint.x,
        y: nextPoint.y
      };

      if (lastPointRef.current) {
        // Calculate the distance between points
        const dist = distance(scaledCurrent, scaledNext);
        
        // More aggressive interpolation with smaller threshold
        const minDistance = 1; // Reduced from 2 to 1 for more frequent interpolation
        if (dist > minDistance) {
          // Increase number of interpolation steps for smoother lines
          const steps = Math.ceil(dist / 0.5); // One point every 0.5 pixels
          
          ctx.beginPath();
          ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
          
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const interpolatedPoint = lerp(scaledCurrent, scaledNext, t);
            
            // Get color for this point
            const interpolatedAngle = angleRef.current + (params.speed * t);
            const colorProgress = (interpolatedAngle % (Math.PI * 2)) / (Math.PI * 2);
            const color = typeof params.color === 'string' 
              ? params.color 
              : getColorFromGradient(params.color, colorProgress);

            ctx.strokeStyle = color;
            ctx.lineWidth = params.lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Use lineTo instead of separate paths for continuous line
            ctx.lineTo(interpolatedPoint.x, interpolatedPoint.y);
            
            if (i === steps) {
              lastPointRef.current = interpolatedPoint;
            }
          }
          
          // Single stroke for the entire interpolated segment
          ctx.stroke();
        } else {
          // For small distances, draw directly
          const color = typeof params.color === 'string' 
            ? params.color 
            : getColorFromGradient(
                params.color,
                (angleRef.current % (Math.PI * 2)) / (Math.PI * 2)
              );

          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = params.lineWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
          ctx.lineTo(scaledNext.x, scaledNext.y);
          ctx.stroke();
        }
      }

      lastPointRef.current = scaledNext;
      angleRef.current = newAngle;
      frameCountRef.current += 1;

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    }, [params, isPlaying, calculatePoint]);

    const handleMouseDown = useCallback((event: MouseEvent) => {
      event.preventDefault();
      isPanningRef.current = true;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      lastPanPointRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      canvas.style.cursor = 'grabbing';
    }, []);

    const handleMouseMove = useCallback((event: MouseEvent) => {
      if (!isPanningRef.current || !lastPanPointRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const currentPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };

      const dx = (currentPoint.x - lastPanPointRef.current.x) / zoomRef.current;
      const dy = (currentPoint.y - lastPanPointRef.current.y) / zoomRef.current;

      offsetRef.current = {
        x: offsetRef.current.x + dx,
        y: offsetRef.current.y + dy
      };

      lastPanPointRef.current = currentPoint;
      initializeCanvas();
    }, [initializeCanvas]);

    const handleMouseUp = useCallback(() => {
      isPanningRef.current = false;
      lastPanPointRef.current = null;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor = 'grab';
      }
    }, []);

    const handleWheel = useCallback((event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY;
      
      zoomRef.current *= delta > 0 ? 0.9 : 1.1;
      initializeCanvas();
      
      console.log('Zoom level:', zoomRef.current);
    }, [initializeCanvas]);

    useEffect(() => {
      initializeCanvas();
      
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        canvas.style.cursor = 'grab';
      }
      
      window.addEventListener('resize', initializeCanvas);

      return () => {
        if (canvas) {
          canvas.removeEventListener('wheel', handleWheel);
          canvas.removeEventListener('mousedown', handleMouseDown);
          canvas.removeEventListener('mousemove', handleMouseMove);
          canvas.removeEventListener('mouseup', handleMouseUp);
          canvas.removeEventListener('mouseleave', handleMouseUp);
        }
        window.removeEventListener('resize', initializeCanvas);
      };
    }, [initializeCanvas, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

    useEffect(() => {
      console.log('Animation effect triggered:', { isPlaying, params });
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Only reset the last point to maintain continuous line
      lastPointRef.current = null;

      if (isPlaying) {
        console.log('Starting animation with params:', params);
        animationRef.current = requestAnimationFrame(draw);
      }

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [isPlaying, params, draw]);

    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#121212',
          border: '1px solid #333',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </Box>
    );
  }
);

SpirographCanvas.displayName = 'SpirographCanvas'; 