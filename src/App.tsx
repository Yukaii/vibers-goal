import { TaskDashboard } from '@/components/task-dashboard';
import { ThemeProvider } from '@/components/theme-provider';

function App() {
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
