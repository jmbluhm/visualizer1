export type CircleParams = {
  radius: number;
};

export type SquareParams = {
  edgeLength: number;
  cornerRadius: number;
};

export type StarParams = {
  outerRadius: number;
  innerRadius: number;
  points: number;
};

export type HexagonParams = {
  sideLength: number;
  cornerRadius: number;
};

export type EllipseParams = {
  majorAxis: number;
  minorAxis: number;
  rotation: number;
};

export type FixedShape = 'circle' | 'square' | 'star' | 'hexagon' | 'ellipse';

export type FixedShapeConfig = 
  | { type: 'circle'; params: CircleParams }
  | { type: 'square'; params: SquareParams }
  | { type: 'star'; params: StarParams }
  | { type: 'hexagon'; params: HexagonParams }
  | { type: 'ellipse'; params: EllipseParams };

export const FIXED_SHAPE_DEFAULTS: Record<FixedShape, FixedShapeConfig> = {
  circle: {
    type: 'circle',
    params: {
      radius: 200
    }
  },
  square: {
    type: 'square',
    params: {
      edgeLength: 200,
      cornerRadius: 0
    }
  },
  star: {
    type: 'star',
    params: {
      outerRadius: 200,
      innerRadius: 100,
      points: 5
    }
  },
  hexagon: {
    type: 'hexagon',
    params: {
      sideLength: 200,
      cornerRadius: 0
    }
  },
  ellipse: {
    type: 'ellipse',
    params: {
      majorAxis: 200,
      minorAxis: 100,
      rotation: 0
    }
  }
};

export interface SpirographParams {
  fixedShape: FixedShapeConfig;
  movingShape: {
    type: 'circle';
    params: {
      radius: number;
    };
  };
  penDistance: number;
  animationSpeed: number;
  lineWidth: number;
  color: string | GradientColor;
}

export type GradientColor = {
  type: 'gradient';
  colors: Array<{
    color: string;
    position: number;
  }>;
  angle: number;
};

export const DEFAULT_PARAMS: SpirographParams = {
  fixedShape: FIXED_SHAPE_DEFAULTS.circle,
  movingShape: {
    type: 'circle',
    params: {
      radius: 50
    }
  },
  penDistance: 0.5,
  animationSpeed: 1,
  lineWidth: 2,
  color: '#000000'
};

export const GRADIENT_PRESETS: GradientColor[] = [
  {
    type: 'gradient',
    colors: [
      { color: '#FF8C42', position: 0 },
      { color: '#FF5733', position: 0.33 },
      { color: '#C70039', position: 0.66 },
      { color: '#900C3F', position: 1 }
    ],
    angle: 45
  },
  {
    type: 'gradient',
    colors: [
      { color: '#FF1493', position: 0 },
      { color: '#00FF00', position: 0.33 },
      { color: '#00FFFF', position: 0.66 },
      { color: '#FF1493', position: 1 }
    ],
    angle: 45
  },
  {
    type: 'gradient',
    colors: [
      { color: '#FF0000', position: 0 },
      { color: '#FFFF00', position: 0.33 },
      { color: '#FF00FF', position: 0.66 },
      { color: '#FF0000', position: 1 }
    ],
    angle: 45
  }
]; 