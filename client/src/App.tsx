import { StrictMode } from 'react'
import Experience from './components/Experience'

export default function App() {
  return (
    <>
      {/* Leva 调试面板已隐藏 */}
      {/* <Leva hidden={!debug} collapsed theme={{ sizes: { rootWidth: '350px' } }} /> */}

      {/* See https://github.com/pmndrs/leva/issues/552 */}
      <StrictMode>
        <Experience />
      </StrictMode>
    </>
  )
}
