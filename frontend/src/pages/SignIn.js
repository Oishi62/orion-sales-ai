import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const SignInContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-bg);
  padding: 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(0, 246, 255, 0.1) 0%, transparent 70%);
    animation: rotate 20s linear infinite;
  }

  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SignInCard = styled(motion.div)`
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 3rem;
  width: 100%;
  max-width: 450px;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lg);
  position: relative;
  z-index: 1;

  @media (max-width: 480px) {
    padding: 2rem;
    margin: 1rem;
  }
`;

const Logo = styled.h1`
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
  font-size: 1.1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
  color: var(--text-primary);
  font-size: 1rem;
  transition: var(--transition-normal);
  font-family: var(--font-primary);

  &:focus {
    outline: none;
    border-color: var(--accent-cyan);
    box-shadow: var(--shadow-glow);
    background: rgba(26, 26, 46, 0.9);
  }

  &::placeholder {
    color: var(--text-muted);
  }

  &.error {
    border-color: var(--error-color);
    box-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
  }
`;

const ErrorMessage = styled.span`
  color: var(--error-color);
  font-size: 0.85rem;
  margin-top: 0.25rem;
`;

const SubmitButton = styled(motion.button)`
  background: var(--gradient-primary);
  color: var(--primary-bg);
  border: none;
  border-radius: var(--radius-md);
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: var(--transition-normal);
  font-family: var(--font-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LinkContainer = styled.div`
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
`;

const StyledLink = styled(Link)`
  color: var(--accent-cyan);
  text-decoration: none;
  font-weight: 500;
  transition: var(--transition-fast);

  &:hover {
    color: var(--accent-violet);
    text-shadow: 0 0 8px var(--accent-violet);
  }
`;


const SignIn = () => {
  const { signIn, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      const result = await signIn(data);
      
      if (result.success) {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setError('root', {
          type: 'manual',
          message: result.error || 'Sign in failed'
        });
      }
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SignInContainer>
        <LoadingSpinner size="large" text="Loading..." />
      </SignInContainer>
    );
  }

  return (
    <SignInContainer>
      <SignInCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Logo>ORION AI</Logo>
        <Subtitle>Welcome back to the future of sales</Subtitle>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Please enter a valid email address'
                }
              })}
            />
            {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className={errors.password ? 'error' : ''}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            {errors.password && <ErrorMessage>{errors.password.message}</ErrorMessage>}
          </FormGroup>

          {errors.root && (
            <ErrorMessage style={{ textAlign: 'center', fontSize: '1rem' }}>
              {errors.root.message}
            </ErrorMessage>
          )}

          <SubmitButton
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="small" showText={false} />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </SubmitButton>


        </Form>

        <LinkContainer>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Don't have an account?
          </p>
          <StyledLink to="/signup">Create Account</StyledLink>
        </LinkContainer>
      </SignInCard>
    </SignInContainer>
  );
};

export default SignIn;
