import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Admin from '@/pages/Admin'
import Recipes from '@/pages/Recipes'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/oppskrifter" element={<Recipes />} />
      </Routes>
    </BrowserRouter>
  )
}
