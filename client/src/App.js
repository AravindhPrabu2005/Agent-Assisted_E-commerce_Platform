import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import SignupPage from './components/Signup';
import LoginPage from './components/Loginpage';
import Indexpage from './components/Indexpage';
import Adminpage from './components/Adminpage';
import AdminSignupPage from './components/AdminSignup';
import Landing from './components/Landing';

const App = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/adminSignup" element={<AdminSignupPage />} />


                <Route path="/user/home" element={<Indexpage />} />


                <Route path="/admin/home" element={<Adminpage />} />
            </Routes>
        </Router>
    );
};

export default App;
