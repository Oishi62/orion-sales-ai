import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 2rem;
`;

const ModalContent = styled(motion.div)`
  background: var(--gradient-card);
  border: 2px solid var(--accent-cyan);
  border-radius: var(--radius-xl);
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  backdrop-filter: blur(20px);
  box-shadow: 0 0 50px rgba(0, 246, 255, 0.3), var(--shadow-lg);
  position: relative;

  @media (max-width: 480px) {
    padding: 2rem;
    margin: 1rem;
  }
`;

const LoadingSpinner = styled(motion.div)`
  width: 80px;
  height: 80px;
  border: 4px solid rgba(0, 246, 255, 0.2);
  border-top: 4px solid var(--accent-cyan);
  border-radius: 50%;
  margin: 0 auto 2rem;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const AIIcon = styled(motion.div)`
  font-size: 4rem;
  margin: 0 auto 2rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const LoadingTitle = styled(motion.h2)`
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const LoadingMessage = styled(motion.p)`
  color: var(--text-secondary);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(0, 246, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 3px;
`;

const SuccessIcon = styled(motion.div)`
  font-size: 5rem;
  color: var(--success-color);
  margin: 0 auto 2rem;
`;

const SuccessTitle = styled(motion.h2)`
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 700;
  color: var(--success-color);
  margin-bottom: 1rem;
`;

const SuccessMessage = styled(motion.p)`
  color: var(--text-secondary);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const CloseButton = styled(motion.button)`
  background: var(--gradient-primary);
  color: var(--primary-bg);
  border: none;
  border-radius: var(--radius-md);
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  font-family: var(--font-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
`;

const AgentCreationModal = ({ isOpen, onClose, isUpdateMode = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const loadingMessages = isUpdateMode ? [
    "🔄 Updating your AI Sales Agent...",
    "🧠 Processing updated product information...",
    "🎯 Applying new ICP filters...",
    "📊 Reconfiguring lead scoring algorithms...",
    "✨ Optimizing your agent with new settings...",
    "🔍 Updating intelligent prospect research...",
    "📧 Refreshing personalized message templates...",
    "🚀 Enhancing outreach strategies...",
    "⚡ Fine-tuning updated AI conversation flows...",
    "🎉 Almost done! Finalizing updates..."
  ] : [
    "🤖 Initializing your AI Sales Agent...",
    "🧠 Analyzing your product description...",
    "🎯 Processing your ICP filters...",
    "📊 Configuring lead scoring algorithms...",
    "✨ Now sit back while we configure your perfect SDR...",
    "🔍 Setting up intelligent prospect research...",
    "📧 Preparing personalized message templates...",
    "🚀 Optimizing outreach strategies...",
    "⚡ Fine-tuning AI conversation flows...",
    "🎉 Almost ready! Finalizing your agent..."
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setProgress(0);
      setIsComplete(false);
      return;
    }

    const totalDuration = 8000; // 8 seconds total
    const stepDuration = totalDuration / loadingMessages.length;
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const nextStep = prev + 1;
        if (nextStep >= loadingMessages.length) {
          setIsComplete(true);
          clearInterval(interval);
          return prev;
        }
        return nextStep;
      });
    }, stepDuration);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, totalDuration / 100);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [isOpen, loadingMessages.length]);


  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ModalContent
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {!isComplete ? (
              <>
                <LoadingSpinner
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                
                <LoadingTitle
                  key="loading-title"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Creating Your AI Agent
                </LoadingTitle>

                <LoadingMessage
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  {loadingMessages[currentStep]}
                </LoadingMessage>

                <ProgressBar>
                  <ProgressFill
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </ProgressBar>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}
                >
                  {Math.round(progress)}% Complete
                </motion.div>
              </>
            ) : (
              <>
                <SuccessIcon
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                >
                  ✅
                </SuccessIcon>

                <SuccessTitle
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {isUpdateMode ? 'Agent Updated Successfully!' : 'Agent Created Successfully!'}
                </SuccessTitle>

                <SuccessMessage
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {isUpdateMode 
                    ? '🎉 Your AI Sales Agent has been updated with the new settings. It will use the updated information for better prospect targeting.'
                    : '🎉 Your AI Sales Agent is now ready! It will automatically research prospects, score leads, and generate personalized outreach messages.'
                  }
                </SuccessMessage>

                <CloseButton
                  onClick={onClose}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                 Close
                </CloseButton>
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default AgentCreationModal;
