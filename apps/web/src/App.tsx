import MainLayout from "@/layout/MainLayout"
import { Routes, Route, Navigate } from "react-router-dom"
import { Dashboard, Nutrition, Workouts, Planning, Notes, Habits } from "./pages"

export default function App() {

  return (
    <Routes>
      <Route path="/"         element={<MainLayout />} >
        <Route index            element={<Navigate to={"/dashboard"} replace />} />
        <Route path="dashboard" element={<Dashboard/>} />
        <Route path="nutrition" element={<Nutrition/>} />
        <Route path="workouts"  element={<Workouts/>} />
        <Route path="planning"  element={<Planning/>} />
        <Route path="habits"  element={<Habits/>} />
        <Route path="notes" element={<Notes/>} />
      </Route>
    </Routes>
  )
}

