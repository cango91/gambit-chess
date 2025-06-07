import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const PolicyContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d1810 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
`;

const PolicyContent = styled.div`
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

const ContactInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-top: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const PrivacyPolicy: React.FC = () => {
  return (
    <PolicyContainer>
      <PolicyContent>
        <BackLink to="/">← Back to Gambit Chess</BackLink>
        
        <Header>
          <Title>Privacy Policy</Title>
        </Header>

        <Section>
          <SectionTitle>1. Information We Collect</SectionTitle>
          <Paragraph>
            Gambit Chess is designed to respect your privacy. We collect minimal information necessary to provide the game service:
          </Paragraph>
          <Paragraph>
            • <strong>Session Data</strong>: Temporary session identifiers to maintain your game state during play
          </Paragraph>
          <Paragraph>
            • <strong>Game Data</strong>: Move history, game outcomes, and practice session statistics (stored locally in your browser)
          </Paragraph>
          <Paragraph>
            • <strong>Technical Data</strong>: Basic error logs and performance metrics to improve the game experience
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>2. How We Use Your Information</SectionTitle>
          <Paragraph>
            The limited data we collect is used solely to:
          </Paragraph>
          <Paragraph>
            • Provide and maintain the game functionality
          </Paragraph>
          <Paragraph>
            • Improve game performance and fix bugs
          </Paragraph>
          <Paragraph>
            • Analyze game mechanics for balancing purposes
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>3. Data Storage and Security</SectionTitle>
          <Paragraph>
            • Most game data is stored locally in your browser and never transmitted to our servers
          </Paragraph>
          <Paragraph>
            • Session data is temporary and automatically deleted when your session ends
          </Paragraph>
          <Paragraph>
            • We do not store personal information, accounts, or user profiles
          </Paragraph>
          <Paragraph>
            • No registration or login is required to play Gambit Chess
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>4. Cookies and Local Storage</SectionTitle>
          <Paragraph>
            We use cookies to track your session and improve your experience. We do not use cookies to track your activity outside of the game.
          </Paragraph>
          <Paragraph>
            We use browser local storage to save your preferences and game settings. This data remains on your device and is not transmitted to our servers. You can clear this data at any time through your browser settings.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>5. Third-Party Services</SectionTitle>
          <Paragraph>
            Gambit Chess does not integrate with third-party tracking services, social media platforms, or advertising networks. The game operates independently without external data sharing.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>6. Children's Privacy</SectionTitle>
          <Paragraph>
            Gambit Chess is suitable for all ages. We do not knowingly collect personal information from children under 13. Since no personal information is required to play, this policy applies equally to all users regardless of age.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>7. Changes to This Policy</SectionTitle>
          <Paragraph>
            We may update this privacy policy occasionally. Any changes will be posted on this page with an updated effective date. Continued use of Gambit Chess after changes constitutes acceptance of the updated policy.
          </Paragraph>
        </Section>

        <ContactInfo>
          <SectionTitle>Contact Information</SectionTitle>
          <Paragraph>
            If you have questions about this privacy policy or Gambit Chess, you can contact the developer at: <a href="mailto:can@xn--glolu-jua30a.com" style={{ color: '#f0d9b5', textDecoration: 'none' }}><strong>can@göloğlu.com</strong></a>
          </Paragraph>
          <Paragraph style={{ fontSize: '14px', marginBottom: 0 }}>
            <strong>Effective Date:</strong> January 25, 2025
          </Paragraph>
        </ContactInfo>
      </PolicyContent>
    </PolicyContainer>
  );
}; 