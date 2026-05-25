import MainLayout from "@/layout/MainLayout"
import { Routes, Route, Navigate } from "react-router-dom"
import { defaultRoute, DisplayMode, routes } from "./shared/config/routes"

export default function App() {

  return (
    <Routes>
      <Route path="/"         element={<MainLayout />} >
        <Route index element={<Navigate to={defaultRoute.path} replace />}/>
        {routes.filter((route) => route.displayMode === DisplayMode.Sidebar).map((route) => <Route key={route.id} id={route.id} path={route.path} element={<route.Component />} />)}
      </Route>
    </Routes>
  )
}

