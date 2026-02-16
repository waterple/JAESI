import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProgressProvider } from "@/context/ProgressContext";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import RandomQuizPage from "@/pages/RandomQuizPage";
import SpacedRepPage from "@/pages/SpacedRepPage";
import SequentialPage from "@/pages/SequentialPage";
import WrongAnswerPage from "@/pages/WrongAnswerPage";
import StudyPage from "@/pages/StudyPage";

export default function App() {
  return (
    <ProgressProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/quiz/random" element={<RandomQuizPage />} />
            <Route path="/quiz/spaced" element={<SpacedRepPage />} />
            <Route path="/quiz/sequential" element={<SequentialPage />} />
            <Route path="/wrong-answers" element={<WrongAnswerPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProgressProvider>
  );
}
