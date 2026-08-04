import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Site from "./Site";
import Admin from "./Admin";

function App() {
  return (
    <div className="App grain">
      <Toaster theme="dark" position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Site />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
