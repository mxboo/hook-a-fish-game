import Controller from './Controller'
import Fishes from './Fishes'
import Grass from './Grass'
import Countdown from './interface/Countdown'
import Menu from './interface/Menu'
import Water from './Water'
import useGame from '../stores/use-game'

export default function World() {
  const phase = useGame(state => state.phase)
  const isPlaying = phase === 'started' || phase === 'hooked' || phase === 'unhooked'

  return (
    <>
      <Menu />
      <Countdown seconds={60} />

      <Controller />
      <Fishes />
      <Water />
      <Grass />
    </>
  )
}
