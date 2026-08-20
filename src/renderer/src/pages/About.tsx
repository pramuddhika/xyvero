/* eslint-disable prettier/prettier */
import React from 'react'
import logoImage from '../assets/logo.jpeg'
import { Sparkles, ShieldCheck, Zap, FolderKanban, Palette, Mail } from 'lucide-react'

function About(): React.JSX.Element {
  const portfolioUrl = 'https://www.pramuddhika.com/'

  return (
    <section className="content-area about-page">
      {/* Hero Header Card */}
      <div className="about-hero-card">
        <div className="about-hero-content">
          <div className="about-logo-wrapper">
            <img src={logoImage} alt="Xyvero Logo" className="about-hero-logo" />
            <div className="about-logo-glow" />
          </div>

          <div className="about-hero-text">
            <div className="about-title-row">
              <h2 className="about-app-name">Xyvero</h2>
              <span className="about-version-badge">v0.0.1</span>
              <span className="about-status-badge">
                <Sparkles size={13} className="inline-block mr-1" />
                Personal Finance
              </span>
            </div>
            <p className="about-tagline">
              A personal finance application built to help you track expenses, manage accounts, and
              monitor your financial health with complete privacy and zero complexity.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="about-features-grid">
          <div className="about-feature-item">
            <div className="about-feature-icon">
              <ShieldCheck size={19} />
            </div>
            <div className="about-feature-copy">
              <h4>100% Local & Private</h4>
              <p>Your financial records and accounts remain securely stored on your own device.</p>
            </div>
          </div>

          <div className="about-feature-item">
            <div className="about-feature-icon">
              <Zap size={19} />
            </div>
            <div className="about-feature-copy">
              <h4>Fast & Fluid</h4>
              <p>
                Designed for daily speed, seamless navigation, and instant access to your records.
              </p>
            </div>
          </div>

          <div className="about-feature-item">
            <div className="about-feature-icon">
              <FolderKanban size={19} />
            </div>
            <div className="about-feature-copy">
              <h4>Account & Category Tracking</h4>
              <p>Easily organize cash, accounts, savings, investments, and categorized spending.</p>
            </div>
          </div>

          <div className="about-feature-item">
            <div className="about-feature-icon">
              <Palette size={19} />
            </div>
            <div className="about-feature-copy">
              <h4>Tailored Themes & Customization</h4>
              <p>
                Switch between dark and light modes, customize currencies, and match your
                preferences.
              </p>
            </div>
          </div>
        </div>

        {/* Direct Link Footer Bar */}
        <div className="about-link-footer">
          <div className="about-link-details">
            <Mail size={15} className="about-footer-icon" />
            <span className="about-link-caption">Official Website:</span>
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="about-footer-url"
            >
              {portfolioUrl}
            </a>
          </div>
          <span className="about-copyright">
            © {new Date().getFullYear()} Xyvero. All rights reserved.
          </span>
        </div>
      </div>
    </section>
  )
}

export default About
