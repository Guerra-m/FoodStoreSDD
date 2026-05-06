import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '../index.css';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<h1>Food Store Home</h1>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const queryClient = new QueryClient();

export default App;
