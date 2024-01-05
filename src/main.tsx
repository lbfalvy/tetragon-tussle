import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { Navigator } from './Navigator.tsx'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Navigator />
  </React.StrictMode>,
)
