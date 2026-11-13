import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Inter, self-hosted (variable font: every weight from 100 to 900 in one file)
import '@fontsource-variable/inter'
import './assets/css/index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './shared/config/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <RouterProvider router={router} />
  </StrictMode>
)
