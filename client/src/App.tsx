import { StrictMode } from 'react'
import Experience from './components/Experience'

export default function App() {
  return (
    <>
      {/* 调试面板已移除 */}
      <StrictMode>
        <Experience />
      </StrictMode>
    </>
  )
}
