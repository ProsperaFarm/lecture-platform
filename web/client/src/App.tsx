import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Courses from "./pages/Courses";
import Home from "./pages/Home";
import Lesson from "./pages/Lesson";
import Login from "./pages/Login";
import GoogleCallback from "./pages/GoogleCallback";


function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path={"/login"} component={Login} />
      <Route path={"/auth/google/callback"} component={GoogleCallback} />
      
      {/* Protected routes (authentication checked inside components) */}
      <Route path={"/"} component={Courses} />
      <Route path={"/course/:id"} component={Home} />
      <Route path={"/course/:courseId/lesson/:lessonId"} component={Lesson} />

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
