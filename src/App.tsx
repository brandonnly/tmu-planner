import { Button } from './components/ui/button';
import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="bg-zinc-900 h-screen justify-center flex align items-center space-x-4">
        <Button
          variant="default"
          onClick={() => setCount((count) => count - 1)}
        >
          -1
        </Button>
        <Button onClick={() => setCount(0)}>{count}</Button>
        <Button
          variant="default"
          onClick={() => setCount((count) => count + 1)}
        >
          +1
        </Button>
      </div>
    </>
  );
}
