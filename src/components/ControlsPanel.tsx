import { Box, Slider, Typography, IconButton, Stack, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { PlayArrow, Pause, Refresh, Download } from '@mui/icons-material';
import { 
  SpirographParams, 
  GRADIENT_PRESETS,
  FixedShape, 
  FIXED_SHAPE_DEFAULTS,
  CircleParams,
  SquareParams,
  StarParams,
  HexagonParams,
  EllipseParams,
  FixedShapeConfig
} from '../types';

interface Props {
  params: SpirographParams;
  isPlaying: boolean;
  onParamsChange: (params: SpirographParams) => void;
  onPlayPause: () => void;
  onReset: () => void;
  onDownload: () => void;
}

export const ControlsPanel = ({
  params,
  isPlaying,
  onParamsChange,
  onPlayPause,
  onReset,
  onDownload
}: Props) => {
  const handleSliderChange = (param: keyof SpirographParams) => (
    _: Event,
    value: number | number[]
  ) => {
    onParamsChange({
      ...params,
      [param]: value as number
    });
  };

  const handleMovingCircleChange = (param: keyof typeof params.movingShape.params) => (
    _: Event,
    value: number | number[]
  ) => {
    onParamsChange({
      ...params,
      movingShape: {
        ...params.movingShape,
        params: {
          ...params.movingShape.params,
          [param]: value as number
        }
      }
    });
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({
      ...params,
      color: event.target.value
    });
  };

  const handleGradientChange = (event: SelectChangeEvent<string>) => {
    const index = parseInt(event.target.value);
    if (index === 0) {
      onParamsChange({
        ...params,
        color: '#000000'
      });
    } else {
      const selectedPreset = GRADIENT_PRESETS[index - 1];
      if (selectedPreset) {
        onParamsChange({
          ...params,
          color: selectedPreset
        });
      }
    }
  };

  const handleShapeTypeChange = (event: SelectChangeEvent<FixedShape>) => {
    const newType = event.target.value as FixedShape;
    onParamsChange({
      ...params,
      fixedShape: FIXED_SHAPE_DEFAULTS[newType]
    });
  };

  const handleShapeParamChange = (param: string, value: number) => {
    const currentShape = params.fixedShape;
    let newParams: any;

    switch (currentShape.type) {
      case 'circle':
        newParams = { ...currentShape.params, [param]: value } as CircleParams;
        break;
      case 'square':
        newParams = { ...currentShape.params, [param]: value } as SquareParams;
        break;
      case 'star':
        newParams = { ...currentShape.params, [param]: value } as StarParams;
        break;
      case 'hexagon':
        newParams = { ...currentShape.params, [param]: value } as HexagonParams;
        break;
      case 'ellipse':
        newParams = { ...currentShape.params, [param]: value } as EllipseParams;
        break;
      default:
        return;
    }

    const newConfig: FixedShapeConfig = {
      type: currentShape.type,
      params: newParams
    };

    onParamsChange({
      ...params,
      fixedShape: newConfig
    });
  };

  const currentColor = typeof params.color === 'string' ? params.color : params.color.colors[0].color;
  const currentGradientIndex = typeof params.color === 'string' ? '0' : 
    (GRADIENT_PRESETS.findIndex(preset => 
      preset.colors.every((c, i) => {
        const color = params.color;
        return typeof color !== 'string' && c.color === color.colors[i].color;
      })
    ) + 1).toString();

  const renderShapeControls = () => {
    switch (params.fixedShape.type) {
      case 'circle':
        return (
          <Box>
            <Typography>Radius</Typography>
            <Slider
              value={(params.fixedShape.params as CircleParams).radius}
              onChange={(_, value) => handleShapeParamChange('radius', value as number)}
              min={50}
              max={300}
              step={10}
            />
          </Box>
        );
      case 'square':
        return (
          <Box>
            <Typography>Edge Length</Typography>
            <Slider
              value={(params.fixedShape.params as SquareParams).edgeLength}
              onChange={(_, value) => handleShapeParamChange('edgeLength', value as number)}
              min={50}
              max={300}
              step={10}
            />
            <Typography>Corner Radius</Typography>
            <Slider
              value={(params.fixedShape.params as SquareParams).cornerRadius}
              onChange={(_, value) => handleShapeParamChange('cornerRadius', value as number)}
              min={0}
              max={50}
              step={5}
            />
          </Box>
        );
      case 'star':
        return (
          <>
            <Box>
              <Typography>Outer Radius</Typography>
              <Slider
                value={(params.fixedShape.params as StarParams).outerRadius}
                onChange={(_, value) => handleShapeParamChange('outerRadius', value as number)}
                min={100}
                max={300}
                step={10}
              />
            </Box>
            <Box>
              <Typography>Inner Radius</Typography>
              <Slider
                value={(params.fixedShape.params as StarParams).innerRadius}
                onChange={(_, value) => handleShapeParamChange('innerRadius', value as number)}
                min={50}
                max={150}
                step={10}
              />
            </Box>
            <Box>
              <Typography>Points</Typography>
              <Slider
                value={(params.fixedShape.params as StarParams).points}
                onChange={(_, value) => handleShapeParamChange('points', value as number)}
                min={3}
                max={12}
                step={1}
              />
            </Box>
          </>
        );
      case 'hexagon':
        return (
          <Box>
            <Typography>Side Length</Typography>
            <Slider
              value={(params.fixedShape.params as HexagonParams).sideLength}
              onChange={(_, value) => handleShapeParamChange('sideLength', value as number)}
              min={50}
              max={400}
              step={10}
            />
            <Typography>Corner Radius</Typography>
            <Slider
              value={(params.fixedShape.params as HexagonParams).cornerRadius}
              onChange={(_, value) => handleShapeParamChange('cornerRadius', value as number)}
              min={0}
              max={50}
              step={5}
            />
          </Box>
        );
      case 'ellipse':
        return (
          <>
            <Box>
              <Typography>Major Axis</Typography>
              <Slider
                value={(params.fixedShape.params as EllipseParams).majorAxis}
                onChange={(_, value) => handleShapeParamChange('majorAxis', value as number)}
                min={100}
                max={400}
                step={10}
              />
            </Box>
            <Box>
              <Typography>Minor Axis</Typography>
              <Slider
                value={(params.fixedShape.params as EllipseParams).minorAxis}
                onChange={(_, value) => handleShapeParamChange('minorAxis', value as number)}
                min={50}
                max={300}
                step={10}
              />
            </Box>
            <Box>
              <Typography>Rotation (degrees)</Typography>
              <Slider
                value={(params.fixedShape.params as EllipseParams).rotation}
                onChange={(_, value) => handleShapeParamChange('rotation', value as number)}
                min={0}
                max={360}
                step={1}
              />
            </Box>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Digital Spirograph
      </Typography>

      <Stack spacing={4} sx={{ mt: 4 }}>
        {/* Animation Controls */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Animation Controls
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={onPlayPause}>
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
            <IconButton onClick={onReset}>
              <Refresh />
            </IconButton>
            <IconButton onClick={onDownload}>
              <Download />
            </IconButton>
          </Stack>
        </Box>

        {/* Fixed Shape Controls */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Fixed Shape
          </Typography>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Shape Type</InputLabel>
            <Select
              value={params.fixedShape.type}
              onChange={handleShapeTypeChange}
              label="Shape Type"
            >
              <MenuItem value="circle">Circle</MenuItem>
              <MenuItem value="square">Square</MenuItem>
              <MenuItem value="star">Star</MenuItem>
              <MenuItem value="hexagon">Hexagon</MenuItem>
              <MenuItem value="ellipse">Ellipse</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Shape Settings
            </Typography>
            {renderShapeControls()}
          </Box>
        </Box>

        {/* Color Controls */}
        <Box>
          <Typography gutterBottom>
            Color Style
          </Typography>
          <FormControl fullWidth>
            <Select
              value={currentGradientIndex}
              onChange={handleGradientChange}
              sx={{ mb: 2 }}
            >
              <MenuItem value="0">Solid Color</MenuItem>
              {GRADIENT_PRESETS.map((preset, index) => (
                <MenuItem key={index} value={index.toString()}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 20,
                        background: `linear-gradient(${preset.angle}deg, ${preset.colors.map(c => c.color).join(', ')})`
                      }}
                    />
                    <Typography>Gradient {index + 1}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {currentGradientIndex === '0' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input
                type="color"
                value={currentColor}
                onChange={handleColorChange}
                style={{
                  width: '50px',
                  height: '50px',
                  padding: '0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {currentColor}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Moving Circle Controls */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Moving Circle
          </Typography>
          <Box>
            <Typography gutterBottom>
              Radius: {params.movingShape.params.radius}
            </Typography>
            <Slider
              value={params.movingShape.params.radius}
              onChange={handleMovingCircleChange('radius')}
              min={10}
              max={100}
              step={1}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>
              Pen Distance: {params.penDistance}
            </Typography>
            <Slider
              value={params.penDistance}
              onChange={handleSliderChange('penDistance')}
              min={0}
              max={150}
              step={1}
            />
          </Box>
        </Box>

        {/* Drawing Controls */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Drawing Settings
          </Typography>
          <Box>
            <Typography gutterBottom>
              Animation Speed: {params.animationSpeed.toFixed(3)}
            </Typography>
            <Slider
              value={params.animationSpeed}
              onChange={handleSliderChange('animationSpeed')}
              min={0.001}
              max={0.1}
              step={0.001}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>
              Line Width: {params.lineWidth}
            </Typography>
            <Slider
              value={params.lineWidth}
              onChange={handleSliderChange('lineWidth')}
              min={1}
              max={10}
              step={0.5}
            />
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}; 