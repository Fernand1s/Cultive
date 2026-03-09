import React from 'react';
import '../css/LoadingScreen.css';
import logo from '../assets/logo.png';

export const LoadingScreen = () => {
    return (
        <div className="loading-container">
            <div className="loading-glass-card">
                <div className="logo-wrapper">
                    <div className="logo-glow"></div>
                    <img src={logo} alt="Logo Cultiva+" className="loading-logo" />
                </div>

                <h2 className="loading-title">Cultiva<span className="title-highlight">+</span></h2>

                {/* Nova barra de progresso moderna */}
                <div className="loading-bar-container">
                    <div className="loading-bar"></div>
                </div>

                <p className="loading-text">Preparando o ecossistema<span className="loading-dots"></span></p>
            </div>
        </div>
    );
};