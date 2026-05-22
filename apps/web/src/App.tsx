import MainLayout from "@/layout/MainLayout"
import { Routes, Route, Navigate } from "react-router-dom"
import { routes } from "./shared/config/routes"

export default function App() {

  return (
    <Routes>
      <Route path="/"         element={<MainLayout />} >
        {routes.filter((route) => route.showInSidebar === true).map((route) => <Route id={route.id} path={route.path} element={<route.Component />} />)}
      </Route>
    </Routes>
  )
}

