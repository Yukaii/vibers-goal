// import { useState } from 'react' // No longer needed
// import reactLogo from './assets/react.svg' // No longer needed
// import viteLogo from '/vite.svg' // No longer needed
import './App.css'; // Keep existing App styles if any
import { TaskDashboard } from '@/components/task-dashboard'; // Assuming this is the main component
import { ThemeProvider } from '@/components/theme-provider';

function App() {
  // const [count, setCount] = useState(0) // No longer needed

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TaskDashboard />
    </ThemeProvider>
  );
}

export default App;
