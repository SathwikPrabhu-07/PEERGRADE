import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import MySkills from "./pages/MySkills";
import Discover from "./pages/Discover";
import Requests from "./pages/Requests";
import RequestDetail from "./pages/RequestDetail";
import Sessions from "./pages/Sessions";
import Assignments from "./pages/Assignments";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const App = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    {/* Protected routes */}
    <Route path="/dashboard" element={
      <ProtectedRoute><Dashboard /></ProtectedRoute>
    } />
    <Route path="/my-skills" element={
      <ProtectedRoute><MySkills /></ProtectedRoute>
    } />
    <Route path="/discover" element={
      <ProtectedRoute><Discover /></ProtectedRoute>
    } />
    <Route path="/requests" element={
      <ProtectedRoute><Requests /></ProtectedRoute>
    } />
    <Route path="/requests/:id" element={
      <ProtectedRoute><RequestDetail /></ProtectedRoute>
    } />
    <Route path="/sessions" element={
      <ProtectedRoute><Sessions /></ProtectedRoute>
    } />
    <Route path="/assignments" element={
      <ProtectedRoute><Assignments /></ProtectedRoute>
    } />
    <Route path="/profile" element={
      <ProtectedRoute><Profile /></ProtectedRoute>
    } />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
