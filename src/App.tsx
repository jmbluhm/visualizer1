import { useState, useRef } from 'react'
import { Box, CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { SpirographParams, DEFAULT_PARAMS } from './types'
import { SpirographCanvas } from './components/SpirographCanvas'
import { ControlsPanel } from './components/ControlsPanel'

function App() {
  const [params, setParams] = useState<SpirographParams>(DEFAULT_PARAMS)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showGuides, setShowGuides] = useState(true)
  const canvasRef = useRef<{ clearCanvas: () => void; downloadImage: () => void }>(null)

  const handleReset = () => {
    canvasRef.current?.clearCanvas();
  };

  const handleDownload = () => {
    canvasRef.current?.downloadImage();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        {/* Canvas Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <SpirographCanvas
            ref={canvasRef}
            params={params}
            isPlaying={isPlaying}
            showGuides={showGuides}
          />
        </Box>

        {/* Controls Panel */}
        <Box
          sx={{
            width: { xs: '100%', md: 400 },
            height: { xs: 'auto', md: '100%' },
            position: { xs: 'fixed', md: 'relative' },
            right: 0,
            bottom: { xs: 0, md: 'auto' },
            bgcolor: 'background.paper',
            borderLeft: { md: 1 },
            borderTop: { xs: 1, md: 0 },
            borderColor: 'divider',
            overflow: 'auto',
            zIndex: 1,
            maxHeight: { xs: '50vh', md: '100%' },
          }}
        >
          <ControlsPanel
            params={params}
            isPlaying={isPlaying}
            showGuides={showGuides}
            onParamsChange={setParams}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onReset={handleReset}
            onDownload={handleDownload}
            onShowGuidesChange={setShowGuides}
          />
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
