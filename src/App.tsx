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
