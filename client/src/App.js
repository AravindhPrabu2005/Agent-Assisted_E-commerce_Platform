import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import SignupPage from './components/Signup';
import LoginPage from './components/Loginpage';
import Indexpage from './components/Indexpage';
import Adminpage from './components/Adminpage';
import AdminSignupPage from './components/AdminSignup';

const App = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/adminSignup" element={<AdminSignupPage />} />
                <Route path="/" element={isLoggedIn && !isAdmin ? <Indexpage /> : <Navigate to="/login" />} />
                <Route path="/admin" element={isLoggedIn && isAdmin ? <Adminpage /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
};

export default App;
