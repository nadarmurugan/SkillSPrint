// App.jsx - REVISED for Route Parameter

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Lessons from "./pages/Lessons";
import Notes from "./pages/Notes";
import Sprints from "./pages/Sprints"; // This component will now read the ID from the URL parameter
import AdminLogin from "./admin/admin_login.jsx";
import AdminDashboard from "./admin/admin_dashboard.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/notes" element={<Notes />} />
        {/* REVISED: Use a route parameter for the Sprint ID */}
        <Route path="/sprints/:sprintId" element={<Sprints />} /> 
        <Route path="/admin_login" element={<AdminLogin />} />
        <Route path="/admin_dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}



export default App;
