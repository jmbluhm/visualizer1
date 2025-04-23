export type FixedShape = 'circle' | 'square' | 'star' | 'triangle' | 'oval';

interface BaseShapeConfig {
  type: FixedShape;
}

export interface CircleConfig extends BaseShapeConfig {
  type: 'circle';
  params: {
    radius: number;
  };
}

export interface SquareConfig extends BaseShapeConfig {
  type: 'square';
  params: {
    edgeLength: number;
    cornerRadius: number;
  };
}

export interface StarConfig extends BaseShapeConfig {
  type: 'star';
  params: {
    outerRadius: number;
    innerRadius: number;
    points: number;
  };
}

export interface TriangleConfig extends BaseShapeConfig {
  type: 'triangle';
  params: {
    sideLength: number;
    cornerRadius: number;
  };
}

export interface OvalConfig extends BaseShapeConfig {
  type: 'oval';
  params: {
    majorAxis: number;
    minorAxis: number;
    rotation: number;
  };
}

export type FixedShapeConfig = CircleConfig | SquareConfig | StarConfig | TriangleConfig | OvalConfig;

export interface GradientColor {
  type: 'solid' | 'gradient';
  name: string;
  colors: string[];
}

export interface SpirographParams {
  fixedShape: FixedShapeConfig;
  r: number;  // moving circle radius
  d: number;  // pen distance from center of moving circle
  speed: number;
  lineWidth: number;
  color: GradientColor | string;
}

export const GRADIENT_PRESETS: GradientColor[] = [
  {
    name: 'Solid Color',
    type: 'solid',
    colors: ['#00ff00']
  },
  {
    name: 'Sunset',
    type: 'gradient',
    colors: ['#FF8C42', '#FF5733', '#C70039', '#900C3F']
  },
  {
    name: 'Neon',
    type: 'gradient',
    colors: ['#FF1493', '#00FF00', '#00FFFF', '#FF1493']
  },
  {
    name: 'Fireworks',
    type: 'gradient',
    colors: ['#FF0000', '#FFFF00', '#FF00FF', '#FF0000']
  }
];

export const DEFAULT_PARAMS: SpirographParams = {
  fixedShape: {
    type: 'circle',
    params: {
      radius: 150
    }
  },
  r: 50,
  d: 75,
  speed: 0.02,
  lineWidth: 2,
  color: {
    type: 'solid',
    name: 'Default',
    colors: ['#00ff00']
  }
};

export const FIXED_SHAPE_DEFAULTS = {
  circle: {
    type: 'circle' as const,
    params: {
      radius: 150
    }
  },
  square: {
    type: 'square' as const,
    params: {
      edgeLength: 200,
      cornerRadius: 0
    }
  },
  star: {
    type: 'star' as const,
    params: {
      outerRadius: 150,
      innerRadius: 75,
      points: 5
    }
  },
  triangle: {
    type: 'triangle' as const,
    params: {
      sideLength: 200,
      cornerRadius: 0
    }
  },
  oval: {
    type: 'oval' as const,
    params: {
      majorAxis: 200,
      minorAxis: 150,
      rotation: 0
    }
  }
} as const; 