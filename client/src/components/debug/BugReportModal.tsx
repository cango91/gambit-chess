/**
 * Bug Report Modal Component
 * 
 * Simple, user-friendly interface for submitting bug reports
 * while capturing comprehensive debugging information behind the scenes.
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import * as shared from '@gambit-chess/shared';
import { submitBugReport, markFeatureUsed } from '../../utils/bug-reporting';
import { useGameStore } from '../../stores/gameStore';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #111827;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #6b7280;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalForm = styled.form`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    background-color: #f9fafb;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    background-color: #f9fafb;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    background-color: #f9fafb;
  }
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const InfoText = styled.div`
  font-size: 14px;
  color: #1e40af;
  
  p {
    margin: 0;
    
    &:first-child {
      font-weight: 500;
      margin-bottom: 4px;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 16px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  ${props => props.$variant === 'primary' ? `
    background: #dc2626;
    color: white;
    border: 1px solid transparent;
    
    &:hover:not(:disabled) {
      background: #b91c1c;
    }
    
    &:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
    }
  ` : `
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
    
    &:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.2);
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const AlertBox = styled.div<{ $success?: boolean }>`
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  
  ${props => props.$success ? `
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
  ` : `
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  `}
  
  p {
    margin: 0;
    font-size: 14px;
  }
`;

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<shared.BugCategory>('other' as shared.BugCategory);
  const [severity, setSeverity] = useState<shared.BugSeverity>('medium' as shared.BugSeverity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  const currentGame = useGameStore((state) => state.currentGame);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      markFeatureUsed('bug_reporting');
      
      const result = await submitBugReport(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          severity
        },
        currentGame?.id
      );

      if (result.success) {
        setSubmitResult({
          success: true,
          message: `Bug report submitted successfully! Report ID: ${result.reportId}`
        });
        
        // Reset form
        setTitle('');
        setDescription('');
        setCategory('other' as shared.BugCategory);
        setSeverity('medium' as shared.BugSeverity);
        
        // Close modal after a delay
        setTimeout(() => {
          onClose();
          setSubmitResult(null);
        }, 2000);
      } else {
        setSubmitResult({
          success: false,
          message: result.error || 'Failed to submit bug report'
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSubmitResult(null);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <HeaderContent>
            <span style={{ fontSize: '18px' }}>🐛</span>
            <ModalTitle>Report a Bug</ModalTitle>
          </HeaderContent>
          <CloseButton
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ×
          </CloseButton>
        </ModalHeader>

        <ModalForm onSubmit={handleSubmit}>
          {submitResult && (
            <AlertBox $success={submitResult.success}>
              <span style={{ flexShrink: 0 }}>
                {submitResult.success ? 'ℹ️' : '⚠️'}
              </span>
              <p>{submitResult.message}</p>
            </AlertBox>
          )}

          <FormGroup>
            <Label htmlFor="title">Title *</Label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue"
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as shared.BugCategory)}
              disabled={isSubmitting}
            >
              <option value="gameplay">Gameplay</option>
              <option value="duel_system">Duel System</option>
              <option value="bp_calculation">Battle Points</option>
              <option value="tactical_retreat">Tactical Retreat</option>
              <option value="ui_ux">User Interface</option>
              <option value="performance">Performance</option>
              <option value="mobile">Mobile</option>
              <option value="other">Other</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="severity">Severity</Label>
            <Select
              id="severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as shared.BugSeverity)}
              disabled={isSubmitting}
            >
              <option value="low">Low - Minor issue</option>
              <option value="medium">Medium - Noticeable problem</option>
              <option value="high">High - Significantly affects use</option>
              <option value="critical">Critical - Cannot play</option>
              <option value="enhancement">Enhancement - Feature request</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="description">Description *</Label>
            <TextArea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, what you expected to happen, and any steps to reproduce the issue..."
              required
              disabled={isSubmitting}
              rows={4}
            />
          </FormGroup>

          <InfoBox>
            <span style={{ color: '#3b82f6', flexShrink: 0 }}>ℹ️</span>
            <InfoText>
              <p>Automatic Data Collection</p>
              <p>
                Technical information about your browser, game state, and recent actions 
                will be automatically included to help us debug the issue.
              </p>
            </InfoText>
          </InfoBox>

          <ButtonGroup>
            <Button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              $variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              $variant="primary"
            >
              {isSubmitting ? (
                <LoadingSpinner />
              ) : (
                <span>🐛</span>
              )}
              <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
            </Button>
          </ButtonGroup>
        </ModalForm>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default BugReportModal; 