import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const SettingsContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d1810 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
`;

const SettingsContent = styled.div`
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(45deg, #b58863, #f0d9b5);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
`;

const BackLink = styled(Link)`
  color: #f0d9b5;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  transition: color 0.2s;

  &:hover {
    color: #fbbf24;
  }
`;

const Section = styled.section`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  color: #f0d9b5;
  font-size: 24px;
  margin-bottom: 16px;
`;

const Paragraph = styled.p`
  line-height: 1.6;
  margin-bottom: 16px;
  color: #d0d0d0;
`;

const SettingItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SettingInfo = styled.div`
  flex: 1;
`;

const SettingName = styled.h3`
  color: #f0d9b5;
  font-size: 18px;
  margin: 0 0 8px 0;
`;

const SettingDescription = styled.p`
  color: #d0d0d0;
  margin: 0;
  font-size: 14px;
`;

const ClearButton = styled.button`
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }
`;

const ContactInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-top: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const CookieSettings: React.FC = () => {
  const handleClearGameData = () => {
    const confirmed = window.confirm('This will clear all your saved game preferences and statistics. Continue?');
    if (confirmed) {
      // Clear all game-related localStorage except cookie consent
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('gambit-chess-') && key !== 'gambit-chess-cookie-consent') {
          localStorage.removeItem(key);
        }
      });
      alert('Game data cleared successfully!');
    }
  };

  const handleClearAll = () => {
    const confirmed = window.confirm('This will clear ALL data and you will need to accept cookies again. Continue?');
    if (confirmed) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <SettingsContainer>
      <SettingsContent>
        <BackLink to="/">← Back to Gambit Chess</BackLink>
        
        <Header>
          <Title>Cookie Settings</Title>
        </Header>

        <Section>
          <SectionTitle>About Cookies & Local Storage</SectionTitle>
          <Paragraph>
            Gambit Chess uses your browser's local storage to save your preferences and game data. This information stays on your device and is never transmitted to our servers. You can manage or clear this data at any time.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>Stored Data</SectionTitle>
          
          <SettingItem>
            <SettingInfo>
              <SettingName>Cookie Consent</SettingName>
              <SettingDescription>
                Remembers that you've accepted our cookie policy. Required for the game to function.
              </SettingDescription>
            </SettingInfo>
          </SettingItem>

          <SettingItem>
            <SettingInfo>
              <SettingName>Game Preferences</SettingName>
              <SettingDescription>
                Your game settings, tutorial completion status, and other preferences.
              </SettingDescription>
            </SettingInfo>
            <ClearButton onClick={handleClearGameData}>
              Clear
            </ClearButton>
          </SettingItem>

          <SettingItem>
            <SettingInfo>
              <SettingName>All Data</SettingName>
              <SettingDescription>
                Clear everything and start fresh. You'll need to accept cookies again.
              </SettingDescription>
            </SettingInfo>
            <ClearButton onClick={handleClearAll}>
              Clear All
            </ClearButton>
          </SettingItem>
        </Section>

        <ContactInfo>
          <SectionTitle>Contact Information</SectionTitle>
          <Paragraph>
            If you have questions about cookies or data usage in Gambit Chess, you can contact the developer at: <a href="mailto:can@xn--glolu-jua30a.com" style={{ color: '#f0d9b5', textDecoration: 'none' }}><strong>can@göloğlu.com</strong></a>
          </Paragraph>
          <Paragraph style={{ fontSize: '14px', marginBottom: 0 }}>
            <strong>Last Updated:</strong> January 25, 2025
          </Paragraph>
        </ContactInfo>
      </SettingsContent>
    </SettingsContainer>
  );
}; 