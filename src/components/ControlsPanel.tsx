import { Box, Slider, Typography, IconButton, Stack, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { PlayArrow, Pause, Refresh, Download } from '@mui/icons-material';
import { 
  SpirographParams, 
  GRADIENT_PRESETS, 
  GradientColor, 
  FixedShape, 
  FIXED_SHAPE_DEFAULTS,
  CircleConfig,
  SquareConfig,
  StarConfig,
  TriangleConfig,
  OvalConfig
} from '../types';

interface Props {
  params: SpirographParams;
  isPlaying: boolean;
  onParamsChange: (params: SpirographParams) => void;
  onPlayPause: () => void;
  onReset: () => void;
  onDownload: () => void;
}

const isCircleConfig = (config: { type: string }): config is CircleConfig => 
  config.type === 'circle';

const isSquareConfig = (config: { type: string }): config is SquareConfig =>
  config.type === 'square';

const isStarConfig = (config: { type: string }): config is StarConfig =>
  config.type === 'star';

const isTriangleConfig = (config: { type: string }): config is TriangleConfig =>
  config.type === 'triangle';

const isOvalConfig = (config: { type: string }): config is OvalConfig =>
  config.type === 'oval';

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

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const solidColor: GradientColor = {
      type: 'solid',
      name: 'Custom',
      colors: [event.target.value]
    };
    onParamsChange({
      ...params,
      color: solidColor
    });
  };

  const handleGradientChange = (event: SelectChangeEvent<string>) => {
    const selectedPreset = GRADIENT_PRESETS.find(preset => preset.name === event.target.value);
    if (selectedPreset) {
      onParamsChange({
        ...params,
        color: selectedPreset
      });
    }
  };

  const handleShapeTypeChange = (event: SelectChangeEvent<FixedShape>) => {
    const newType = event.target.value as FixedShape;
    const newShape = FIXED_SHAPE_DEFAULTS[newType];
    onParamsChange({
      ...params,
      fixedShape: newShape
    });
  };

  const handleShapeParamChange = (param: string) => (
    _: Event,
    value: number | number[]
  ) => {
    onParamsChange({
      ...params,
      fixedShape: {
        ...params.fixedShape,
        params: {
          ...params.fixedShape.params,
          [param]: value as number
        }
      }
    });
  };

  const currentColor = typeof params.color === 'string' ? params.color : params.color.colors[0];
  const currentGradient = typeof params.color === 'string' ? 'Solid Color' : params.color.name;

  const renderShapeControls = () => {
    const { fixedShape } = params;

    if (isCircleConfig(fixedShape)) {
      return (
        <Box>
          <Typography gutterBottom>
            Radius: {fixedShape.params.radius}
          </Typography>
          <Slider
            value={fixedShape.params.radius}
            onChange={handleShapeParamChange('radius')}
            min={50}
            max={300}
            step={1}
          />
        </Box>
      );
    }

    if (isSquareConfig(fixedShape)) {
      return (
        <>
          <Box>
            <Typography gutterBottom>
              Edge Length: {fixedShape.params.edgeLength}
            </Typography>
            <Slider
              value={fixedShape.params.edgeLength}
              onChange={handleShapeParamChange('edgeLength')}
              min={50}
              max={400}
              step={1}
            />
          </Box>
          <Box>
            <Typography gutterBottom>
              Corner Radius: {fixedShape.params.cornerRadius}
            </Typography>
            <Slider
              value={fixedShape.params.cornerRadius}
              onChange={handleShapeParamChange('cornerRadius')}
              min={0}
              max={50}
              step={1}
            />
          </Box>
        </>
      );
    }

    if (isStarConfig(fixedShape)) {
      return (
        <>
          <Box>
            <Typography gutterBottom>
              Outer Radius: {fixedShape.params.outerRadius}
            </Typography>
            <Slider
              value={fixedShape.params.outerRadius}
              onChange={handleShapeParamChange('outerRadius')}
              min={100}
              max={300}
              step={1}
            />
          </Box>
          <Box>
            <Typography gutterBottom>
              Inner Radius: {fixedShape.params.innerRadius}
            </Typography>
            <Slider
              value={fixedShape.params.innerRadius}
              onChange={handleShapeParamChange('innerRadius')}
              min={50}
              max={150}
              step={1}
            />
          </Box>
          <Box>
            <Typography gutterBottom>
              Points: {fixedShape.params.points}
            </Typography>
            <Slider
              value={fixedShape.params.points}
              onChange={handleShapeParamChange('points')}
              min={3}
              max={12}
              step={1}
            />
          </Box>
        </>
      );
    }

    if (isTriangleConfig(fixedShape)) {
      return (
        <>
          <Box>
            <Typography gutterBottom>
              Side Length: {fixedShape.params.sideLength}
            </Typography>
            <Slider
              value={fixedShape.params.sideLength}
              onChange={handleShapeParamChange('sideLength')}
              min={50}
              max={400}
              step={1}
            />
          </Box>
          <Box>
            <Typography gutterBottom>
              Corner Radius: {fixedShape.params.cornerRadius}
            </Typography>
            <Slider
              value={fixedShape.params.cornerRadius}
              onChange={handleShapeParamChange('cornerRadius')}
              min={0}
              max={50}
              step={1}
            />
          </Box>
        </>
      );
    }

    if (isOvalConfig(fixedShape)) {
      return (
        <>
          <Box>
            <Typography gutterBottom>
              Major Axis: {fixedShape.params.majorAxis}
            </Typography>
            <Slider
              value={fixedShape.params.majorAxis}
              onChange={handleShapeParamChange('majorAxis')}
              min={100}
              max={400}
              step={1}
            />
          </Box>
          <Box>
            <Typography gutterBottom>
              Minor Axis: {fixedShape.params.minorAxis}
            </Typography>
            <Slider
              value={fixedShape.params.minorAxis}
              onChange={handleShapeParamChange('minorAxis')}
              min={50}
              max={300}
              step={1}
            />
          </Box>
          <Box>
            <Typography gutterBottom>
              Rotation (degrees): {fixedShape.params.rotation}
            </Typography>
            <Slider
              value={fixedShape.params.rotation}
              onChange={handleShapeParamChange('rotation')}
              min={0}
              max={360}
              step={1}
            />
          </Box>
        </>
      );
    }

    return null;
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
              <MenuItem value="triangle">Triangle</MenuItem>
              <MenuItem value="oval">Oval</MenuItem>
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
              value={currentGradient}
              onChange={handleGradientChange}
              sx={{ mb: 2 }}
            >
              {GRADIENT_PRESETS.map((preset) => (
                <MenuItem key={preset.name} value={preset.name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {preset.type === 'gradient' ? (
                      <Box
                        sx={{
                          width: 50,
                          height: 20,
                          background: `linear-gradient(to right, ${preset.colors.join(', ')})`
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 50,
                          height: 20,
                          bgcolor: preset.colors[0]
                        }}
                      />
                    )}
                    <Typography>{preset.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {currentGradient === 'Solid Color' && (
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
              Radius (r): {params.r}
            </Typography>
            <Slider
              value={params.r}
              onChange={handleSliderChange('r')}
              min={10}
              max={100}
              step={1}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>
              Pen Distance (d): {params.d}
            </Typography>
            <Slider
              value={params.d}
              onChange={handleSliderChange('d')}
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
              Animation Speed: {params.speed.toFixed(3)}
            </Typography>
            <Slider
              value={params.speed}
              onChange={handleSliderChange('speed')}
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