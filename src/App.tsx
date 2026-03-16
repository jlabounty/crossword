import { useGameStore } from '@/store/gameStore';
import { MenuScreen } from '@/components/screens/MenuScreen';
import { GameScreen } from '@/components/screens/GameScreen';
import { GameOverScreen } from '@/components/screens/GameOverScreen';

export default function App() {
  const phase = useGameStore(s => s.phase);

  if (phase === 'setup') return <MenuScreen />;
  if (phase === 'playing') return <GameScreen />;
  return <GameOverScreen />;
}
