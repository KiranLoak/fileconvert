import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import PdfToWord from './pages/PdfToWord.jsx';
import PdfToJpg from './pages/PdfToJpg.jsx';
import JpgToPdf from './pages/JpgToPdf.jsx';
import MergePdf from './pages/MergePdf.jsx';
import CompressPdf from './pages/CompressPdf.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/"                element={<Home />} />
            <Route path="/pdf-to-word"     element={<PdfToWord />} />
            <Route path="/pdf-to-jpg"      element={<PdfToJpg />} />
            <Route path="/jpg-to-pdf"      element={<JpgToPdf />} />
            <Route path="/merge-pdf"       element={<MergePdf />} />
            <Route path="/compress-pdf"    element={<CompressPdf />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </ThemeProvider>
  );
}
