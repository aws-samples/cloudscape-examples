import { HashRouter, BrowserRouter, Routes, Route } from "react-router-dom";
import { USE_BROWSER_ROUTER } from "./common/constants";
import GlobalHeader from "./components/global-header";
import HomePage from "./pages/home";
import "./styles/app.scss";
import NotFound from "./pages/not-found";

export default function App() {
  const Router = USE_BROWSER_ROUTER ? BrowserRouter : HashRouter;

  return (
    <div style={{ height: "100%" }}>
      <Router>
        <GlobalHeader />
        <div style={{ height: "56px", backgroundColor: "#000716" }}>&nbsp;</div>
        <div>
          <Routes>
            <Route index path="/" element={<HomePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}
