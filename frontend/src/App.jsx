import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import PreAssessment from "./pages/PreAssessment";
import PostAssessment from "./pages/PostAssessment";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pre-assessment" element={<PreAssessment />} />
          <Route path="post-assessment" element={<PostAssessment />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
