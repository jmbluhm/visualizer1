import { Box, Slider, Typography, IconButton, Stack, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, Divider, Collapse } from '@mui/material';
import { PlayArrow, Pause, Refresh, Download, ExpandMore, ExpandLess } from '@mui/icons-material';
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
import { useState } from 'react';

interface Props {
  params: SpirographParams;
  isPlaying: boolean;
  showGuides: boolean;
  onParamsChange: (params: SpirographParams) => void;
  onPlayPause: () => void;
  onReset: () => void;
  onDownload: () => void;
  onShowGuidesChange: (show: boolean) => void;
}

export const ControlsPanel = ({
  params,
  isPlaying,
  showGuides,
  onParamsChange,
  onPlayPause,
  onReset,
  onDownload,
  onShowGuidesChange
}: Props) => {
  const [isExpanded, setIsExpanded] = useState(true);

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

  const handleBackgroundColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({
      ...params,
      backgroundColor: event.target.value
    });
  };

  const handlePenColorTypeChange = (event: SelectChangeEvent<string>) => {
    const newType = event.target.value as 'solid' | 'gradient';
    onParamsChange({
      ...params,
      penColor: {
        type: newType,
        value: newType === 'solid' ? '#000000' : params.penColor.value
      }
    });
  };

  const handlePenColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({
      ...params,
      penColor: {
        ...params.penColor,
        value: event.target.value
      }
    });
  };

  const handlePenGradientChange = (event: SelectChangeEvent<string>) => {
    const index = parseInt(event.target.value);
    const selectedPreset = GRADIENT_PRESETS[index];
    if (selectedPreset) {
      onParamsChange({
        ...params,
        penColor: {
          ...params.penColor,
          value: selectedPreset
        }
      });
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

  const renderShapeControls = () => {
    switch (params.fixedShape.type) {
      case 'circle':
        return (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">Radius</Typography>
            <Slider
              value={(params.fixedShape.params as CircleParams).radius}
              onChange={(_, value) => handleShapeParamChange('radius', value as number)}
              min={50}
              max={300}
              step={10}
              size="small"
            />
          </Box>
        );
      case 'square':
        return (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">Edge Length</Typography>
            <Slider
              value={(params.fixedShape.params as SquareParams).edgeLength}
              onChange={(_, value) => handleShapeParamChange('edgeLength', value as number)}
              min={50}
              max={300}
              step={10}
              size="small"
            />
            <Typography variant="caption" color="text.secondary">Corner Radius</Typography>
            <Slider
              value={(params.fixedShape.params as SquareParams).cornerRadius}
              onChange={(_, value) => handleShapeParamChange('cornerRadius', value as number)}
              min={0}
              max={50}
              step={5}
              size="small"
            />
          </Box>
        );
      case 'star':
        return (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">Outer Radius</Typography>
            <Slider
              value={(params.fixedShape.params as StarParams).outerRadius}
              onChange={(_, value) => handleShapeParamChange('outerRadius', value as number)}
              min={100}
              max={300}
              step={10}
              size="small"
            />
            <Typography variant="caption" color="text.secondary">Inner Radius</Typography>
            <Slider
              value={(params.fixedShape.params as StarParams).innerRadius}
              onChange={(_, value) => handleShapeParamChange('innerRadius', value as number)}
              min={50}
              max={150}
              step={10}
              size="small"
            />
            <Typography variant="caption" color="text.secondary">Points</Typography>
            <Slider
              value={(params.fixedShape.params as StarParams).points}
              onChange={(_, value) => handleShapeParamChange('points', value as number)}
              min={3}
              max={12}
              step={1}
              size="small"
            />
          </Box>
        );
      case 'hexagon':
        return (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">Side Length</Typography>
            <Slider
              value={(params.fixedShape.params as HexagonParams).sideLength}
              onChange={(_, value) => handleShapeParamChange('sideLength', value as number)}
              min={50}
              max={400}
              step={10}
              size="small"
            />
            <Typography variant="caption" color="text.secondary">Corner Radius</Typography>
            <Slider
              value={(params.fixedShape.params as HexagonParams).cornerRadius}
              onChange={(_, value) => handleShapeParamChange('cornerRadius', value as number)}
              min={0}
              max={50}
              step={5}
              size="small"
            />
          </Box>
        );
      case 'ellipse':
        return (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">Major Axis</Typography>
            <Slider
              value={(params.fixedShape.params as EllipseParams).majorAxis}
              onChange={(_, value) => handleShapeParamChange('majorAxis', value as number)}
              min={100}
              max={400}
              step={10}
              size="small"
            />
            <Typography variant="caption" color="text.secondary">Minor Axis</Typography>
            <Slider
              value={(params.fixedShape.params as EllipseParams).minorAxis}
              onChange={(_, value) => handleShapeParamChange('minorAxis', value as number)}
              min={50}
              max={300}
              step={10}
              size="small"
            />
            <Typography variant="caption" color="text.secondary">Rotation</Typography>
            <Slider
              value={(params.fixedShape.params as EllipseParams).rotation}
              onChange={(_, value) => handleShapeParamChange('rotation', value as number)}
              min={0}
              max={360}
              step={1}
              size="small"
            />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with collapse button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Spirograph</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => setIsExpanded(!isExpanded)} size="small">
            {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
          <IconButton onClick={onPlayPause} size="small">
            {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
          </IconButton>
          <IconButton onClick={onReset} size="small">
            <Refresh fontSize="small" />
          </IconButton>
          <IconButton onClick={onDownload} size="small">
            <Download fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Collapse in={isExpanded}>
        {/* Shape Selection */}
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Shape</InputLabel>
            <Select
              value={params.fixedShape.type}
              onChange={handleShapeTypeChange}
              label="Shape"
            >
              <MenuItem value="circle">Circle</MenuItem>
              <MenuItem value="square">Square</MenuItem>
              <MenuItem value="star">Star</MenuItem>
              <MenuItem value="hexagon">Hexagon</MenuItem>
              <MenuItem value="ellipse">Ellipse</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Shape Parameters */}
        {renderShapeControls()}

        <Divider sx={{ my: 2 }} />

        {/* Guide Shapes Toggle */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">Guide Shapes</Typography>
          <Slider
            value={showGuides ? 1 : 0}
            onChange={(_, value) => onShowGuidesChange(value === 1)}
            min={0}
            max={1}
            step={1}
            size="small"
            marks={[
              { value: 0, label: 'Off' },
              { value: 1, label: 'On' }
            ]}
          />
        </Box>

        {/* Moving Circle Controls */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">Moving Circle Radius</Typography>
          <Slider
            value={params.movingShape.params.radius}
            onChange={handleMovingCircleChange('radius')}
            min={10}
            max={100}
            step={1}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">Pen Distance</Typography>
          <Slider
            value={params.penDistance}
            onChange={handleSliderChange('penDistance')}
            min={0}
            max={150}
            step={1}
            size="small"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Color Styles */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Color Styles</Typography>
          
          {/* Background Color */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">Background Color</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <input
                type="color"
                value={params.backgroundColor}
                onChange={handleBackgroundColorChange}
                style={{
                  width: '30px',
                  height: '30px',
                  padding: '0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {params.backgroundColor}
              </Typography>
            </Box>
          </Box>

          {/* Pen Color Type */}
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Pen Color Style</InputLabel>
              <Select
                value={params.penColor.type}
                onChange={handlePenColorTypeChange}
                label="Pen Color Style"
              >
                <MenuItem value="solid">Solid Color</MenuItem>
                <MenuItem value="gradient">Gradient</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Pen Color Controls */}
          {params.penColor.type === 'solid' ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Pen Color</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <input
                  type="color"
                  value={typeof params.penColor.value === 'string' ? params.penColor.value : params.penColor.value.colors[0].color}
                  onChange={handlePenColorChange}
                  style={{
                    width: '30px',
                    height: '30px',
                    padding: '0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {typeof params.penColor.value === 'string' ? params.penColor.value : params.penColor.value.colors[0].color}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Gradient</InputLabel>
                <Select
                  value={GRADIENT_PRESETS.findIndex(preset => 
                    JSON.stringify(preset) === JSON.stringify(params.penColor.value)
                  ).toString()}
                  onChange={handlePenGradientChange}
                  label="Gradient"
                >
                  {GRADIENT_PRESETS.map((preset, index) => (
                    <MenuItem key={index} value={index.toString()}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 30,
                            height: 15,
                            background: `linear-gradient(${preset.angle}deg, ${preset.colors.map(c => c.color).join(', ')})`,
                            borderRadius: 1
                          }}
                        />
                        <Typography variant="caption">Gradient {index + 1}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Drawing Settings */}
        <Box>
          <Typography variant="caption" color="text.secondary">Animation Speed</Typography>
          <Slider
            value={params.animationSpeed}
            onChange={handleSliderChange('animationSpeed')}
            min={0.001}
            max={1.0}
            step={0.01}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">Line Width</Typography>
          <Slider
            value={params.lineWidth}
            onChange={handleSliderChange('lineWidth')}
            min={1}
            max={10}
            step={0.5}
            size="small"
          />
        </Box>
      </Collapse>
    </Box>
  );
}; 