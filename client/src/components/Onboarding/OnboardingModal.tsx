import React, { useState } from 'react';
import styled from 'styled-components';

const OnboardingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const OnboardingContainer = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d1810 100%);
  border: 2px solid rgba(181, 136, 99, 0.3);
  border-radius: 16px;
  padding: 40px;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
`;

const OnboardingHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const OnboardingTitle = styled.h1`
  color: #f0d9b5;
  font-size: 32px;
  margin: 0 0 8px 0;
  font-weight: 700;
`;

const OnboardingSubtitle = styled.p`
  color: #d0d0d0;
  font-size: 18px;
  margin: 0;
  font-style: italic;
`;

const MechanicsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-bottom: 32px;

  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const MechanicCard = styled.div`
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(181, 136, 99, 0.2);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
`;

const MechanicIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const MechanicTitle = styled.h3`
  color: #fbbf24;
  font-size: 20px;
  margin: 0 0 12px 0;
  font-weight: 600;
`;

const MechanicDescription = styled.p`
  color: #d0d0d0;
  line-height: 1.5;
  margin: 0;
  font-size: 15px;
`;

const FlowSection = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
`;

const FlowTitle = styled.h3`
  color: #4ade80;
  font-size: 22px;
  margin: 0 0 20px 0;
  text-align: center;
  font-weight: 600;
`;

const FlowSteps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (min-width: 600px) {
    flex-direction: row;
    justify-content: space-between;
  }
`;

const FlowStep = styled.div`
  background: rgba(181, 136, 99, 0.1);
  border: 1px solid rgba(181, 136, 99, 0.3);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  flex: 1;
  position: relative;

  &:not(:last-child)::after {
    content: '→';
    position: absolute;
    right: -20px;
    top: 50%;
    transform: translateY(-50%);
    color: #fbbf24;
    font-size: 24px;
    font-weight: bold;

    @media (max-width: 599px) {
      content: '↓';
      right: auto;
      bottom: -20px;
      top: auto;
      left: 50%;
      transform: translateX(-50%);
    }
  }
`;

const StepNumber = styled.div`
  background: #fbbf24;
  color: #1a1a1a;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
  font-weight: bold;
  font-size: 14px;
`;

const StepText = styled.p`
  color: #d0d0d0;
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
`;

const OnboardingButton = styled.button<{ $primary?: boolean }>`
  background: ${props => props.$primary 
    ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
    : 'rgba(181, 136, 99, 0.2)'
  };
  color: ${props => props.$primary ? '#1a1a1a' : '#f0d9b5'};
  border: 1px solid ${props => props.$primary ? '#16a34a' : 'rgba(181, 136, 99, 0.3)'};
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
  min-width: 140px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
`;

interface OnboardingModalProps {
  isVisible: boolean;
  onClose: () => void;
  onStartPractice: () => void;
  isManualView?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isVisible,
  onClose,
  onStartPractice,
  isManualView = false
}) => {
  if (!isVisible) return null;

  return (
    <OnboardingOverlay>
      <OnboardingContainer>
        <OnboardingHeader>
          <OnboardingTitle>⚔️ Welcome to Gambit Chess</OnboardingTitle>
          <OnboardingSubtitle>
            Where captures are resolved through strategic Battle Points duels
          </OnboardingSubtitle>
        </OnboardingHeader>

        <MechanicsGrid>
          <MechanicCard>
            <MechanicIcon>🎯</MechanicIcon>
            <MechanicTitle>Battle Points (BP)</MechanicTitle>
            <MechanicDescription>
              Each player starts with 39 Battle Points. Use them strategically to win capture duels or defend your most strategic pieces.
            </MechanicDescription>
          </MechanicCard>

          <MechanicCard>
            <MechanicIcon>⚔️</MechanicIcon>
            <MechanicTitle>Capture Duels</MechanicTitle>
            <MechanicDescription>
              When you attempt a capture, both players secretly allocate BP. Higher allocation wins the duel!
            </MechanicDescription>
          </MechanicCard>

          <MechanicCard>
            <MechanicIcon>🏃‍♂️</MechanicIcon>
            <MechanicTitle>Tactical Retreats</MechanicTitle>
            <MechanicDescription>
              If the attacker loses a capture duel, they can retreat their piece to its original square. Some pieces can retreat to other available squares at a cost.
            </MechanicDescription>
          </MechanicCard>

          <MechanicCard>
            <MechanicIcon>🔄</MechanicIcon>
            <MechanicTitle>BP Regeneration</MechanicTitle>
            <MechanicDescription>
              Gain BP each turn based on your piece activity and board control. Manage your economy wisely!
            </MechanicDescription>
          </MechanicCard>
        </MechanicsGrid>

        <FlowSection>
          <FlowTitle>How a Capture Works</FlowTitle>
          <FlowSteps>
            <FlowStep>
              <StepNumber>1</StepNumber>
              <StepText>Make a capture move</StepText>
            </FlowStep>
            <FlowStep>
              <StepNumber>2</StepNumber>
              <StepText>Both players secretly allocate Battle Points. A max of 10 BP can be allocated per duel, but be careful, once you assign as much as your piece's chess value, assigning any more BP will cost double from your pool.</StepText>
            </FlowStep>
            <FlowStep>
              <StepNumber>3</StepNumber>
              <StepText>Higher allocation wins the duel. Tie favors the defender.</StepText>
            </FlowStep>
            <FlowStep>
              <StepNumber>4</StepNumber>
              <StepText>Loser can retreat to original square or other squares at a cost</StepText>
            </FlowStep>
          </FlowSteps>
        </FlowSection>

        <ButtonContainer>
          {isManualView ? (
            <OnboardingButton $primary onClick={onClose}>
              OK
            </OnboardingButton>
          ) : (
            <>
              <OnboardingButton onClick={onClose}>
                Maybe Later
              </OnboardingButton>
              <OnboardingButton $primary onClick={onStartPractice}>
                Start Practice Game!
              </OnboardingButton>
            </>
          )}
        </ButtonContainer>
      </OnboardingContainer>
    </OnboardingOverlay>
  );
}; 