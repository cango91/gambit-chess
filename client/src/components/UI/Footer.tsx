import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 20px;
  text-align: center;
  color: #d0d0d0;
  font-size: 14px;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const Copyright = styled.div`
  color: #a0a0a0;
`;

const PortfolioLink = styled.a`
  color: #f0d9b5;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: #fbbf24;
  }
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;

  @media (max-width: 600px) {
    gap: 12px;
  }
`;

const FooterLink = styled(Link)`
  color: #f0d9b5;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: #fbbf24;
  }
`;

export const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <Copyright>
          © 2025, <PortfolioLink href="https://can.xn--glolu-jua30a.com" target="_blank" rel="noopener noreferrer">Can Göloğlu</PortfolioLink>
        </Copyright>
        <FooterLinks>
          <FooterLink to="/privacy-policy">Privacy Policy</FooterLink>
          <FooterLink to="/cookie-settings">Cookie Settings</FooterLink>
        </FooterLinks>
      </FooterContent>
    </FooterContainer>
  );
}; 