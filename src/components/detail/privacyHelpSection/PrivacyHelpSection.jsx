import React, { useState } from 'react';
import './privacyHelpSection.css';

const PrivacyHelpSection = () => {
  const [isHelpSectionOpen, setIsHelpSectionOpen] = useState(false);
  const [isReportUserOpen, setIsReportUserOpen] = useState(false);
  const [isTermsPrivacyOpen, setIsTermsPrivacyOpen] = useState(false);
  const [isDeactivateAccountOpen, setIsDeactivateAccountOpen] = useState(false);
  const [isReportBugOpen, setIsReportBugOpen] = useState(false);

  // Functions for toggling submenus
  const toggleHelpSection = (e) => {
    e.stopPropagation();  // Stop the click from closing the menu
    setIsHelpSectionOpen((prevState) => !prevState);
  };

  const toggleReportUser = (e) => {
    e.stopPropagation();
    setIsReportUserOpen((prevState) => !prevState);
  };

  const toggleTermsPrivacy = (e) => {
    e.stopPropagation();
    setIsTermsPrivacyOpen((prevState) => !prevState);
  };

  const toggleDeactivateAccount = (e) => {
    e.stopPropagation();
    setIsDeactivateAccountOpen((prevState) => !prevState);
  };

  const toggleReportBug = (e) => {
    e.stopPropagation();
    setIsReportBugOpen((prevState) => !prevState);
  };

  // Handle menu actions
  const handleDeactivateAccount = () => {
    console.log('Account deactivated');
  };

  const submitReport = () => {
    console.log('User reported');
  };

  const submitBugReport = () => {
    console.log('Bug reported');
  };

  const openHelpArticle = (article) => {
    console.log(`Opening ${article}`);
  };

  return (
    <div>      
      <div className="option-p">
        <div className="title" onClick={toggleHelpSection}>
          <span>Help & Support</span>
          <img src="./arrowDown.png" alt="Arrow Icon" />
        </div>
        {isHelpSectionOpen && (
          <div className="help-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="help-item" onClick={() => openHelpArticle('faq')}>
              FAQ
            </div>
            <div className="help-item" onClick={() => openHelpArticle('contact')}>
              Contact Support
            </div>
          </div>
        )}
      </div>

      <div className="option-p">
        <div className="title" onClick={toggleReportUser}>
          <span>Report User</span>
          <img src="./arrowDown.png" alt="Arrow Icon" />
        </div>
        {isReportUserOpen && (
          <div className="report-user-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="report-item">
              <label>
                Reason:
                <select>
                  <option value="abuse">Abuse</option>
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                </select>
              </label>
            </div>
            <div className="report-item">
              <button onClick={submitReport}>Submit Report</button>
            </div>
          </div>
        )}
      </div>

      <div className="option-p">
        <div className="title" onClick={toggleTermsPrivacy}>
          <span>Terms & Privacy</span>
          <img src="./arrowDown.png" alt="Arrow Icon" />
        </div>
        {isTermsPrivacyOpen && (
          <div className="terms-privacy-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="terms-privacy-item">
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>
            </div>
            <div className="terms-privacy-item">
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="option-p">
        <div className="title" onClick={toggleDeactivateAccount}>
          <span>Deactivate Account</span>
          <img src="./arrowDown.png" alt="Arrow Icon" />
        </div>
        {isDeactivateAccountOpen && (
          <div className="deactivate-account-dropdown" onClick={(e) => e.stopPropagation()}>
            <p>Are you sure you want to deactivate your account?</p>
            <button onClick={handleDeactivateAccount}>Yes, Deactivate</button>
            <button onClick={toggleDeactivateAccount}>Cancel</button>
          </div>
        )}
      </div>

      <div className="option-p">
        <div className="title" onClick={toggleReportBug}>
          <span>Report a Bug</span>
          <img src="./arrowDown.png" alt="Arrow Icon" />
        </div>
        {isReportBugOpen && (
          <div className="bug-report-dropdown" onClick={(e) => e.stopPropagation()}>
            <textarea placeholder="Describe the bug..." rows="4" />
            <button onClick={submitBugReport}>Submit Report</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyHelpSection;