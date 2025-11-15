import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const SignUpContainer = styled.div`
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
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(138, 43, 226, 0.1) 0%, transparent 70%);
    animation: rotate 25s linear infinite reverse;
  }

  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SignUpCard = styled(motion.div)`
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 3rem;
  width: 100%;
  max-width: 500px;
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

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
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

const PasswordStrength = styled.div`
  margin-top: 0.5rem;
  display: flex;
  gap: 0.25rem;
`;

const StrengthBar = styled.div`
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background: ${props => {
    if (props.strength >= props.index) {
      if (props.strength <= 1) return 'var(--error-color)';
      if (props.strength <= 2) return 'var(--warning-color)';
      return 'var(--success-color)';
    }
    return 'rgba(255, 255, 255, 0.1)';
  }};
  transition: var(--transition-normal);
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

const SignUp = () => {
  const { signUp, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm();

  const watchPassword = watch('password', '');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Calculate password strength
  useEffect(() => {
    const calculateStrength = (password) => {
      let strength = 0;
      if (password.length >= 6) strength++;
      if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
      if (password.match(/\d/)) strength++;
      if (password.match(/[^a-zA-Z\d]/)) strength++;
      return strength;
    };

    setPasswordStrength(calculateStrength(watchPassword));
  }, [watchPassword]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      const result = await signUp(data);
      
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('root', {
          type: 'manual',
          message: result.error || 'Sign up failed'
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
      <SignUpContainer>
        <LoadingSpinner size="large" text="Loading..." />
      </SignUpContainer>
    );
  }

  return (
    <SignUpContainer>
      <SignUpCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Logo>SALES AI</Logo>
        <Subtitle>Join the future of sales automation</Subtitle>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                className={errors.firstName ? 'error' : ''}
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters'
                  },
                  pattern: {
                    value: /^[a-zA-Z\s]+$/,
                    message: 'First name can only contain letters'
                  }
                })}
              />
              {errors.firstName && <ErrorMessage>{errors.firstName.message}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                className={errors.lastName ? 'error' : ''}
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters'
                  },
                  pattern: {
                    value: /^[a-zA-Z\s]+$/,
                    message: 'Last name can only contain letters'
                  }
                })}
              />
              {errors.lastName && <ErrorMessage>{errors.lastName.message}</ErrorMessage>}
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@company.com"
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
            <Label htmlFor="company">Company (Optional)</Label>
            <Input
              id="company"
              type="text"
              placeholder="Your Company Name"
              {...register('company')}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              className={errors.password ? 'error' : ''}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain uppercase, lowercase, and number'
                }
              })}
            />
            {watchPassword && (
              <PasswordStrength>
                {[1, 2, 3, 4].map(index => (
                  <StrengthBar
                    key={index}
                    strength={passwordStrength}
                    index={index}
                  />
                ))}
              </PasswordStrength>
            )}
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
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </SubmitButton>
        </Form>

        <LinkContainer>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Already have an account?
          </p>
          <StyledLink to="/signin">Sign In</StyledLink>
        </LinkContainer>
      </SignUpCard>
    </SignUpContainer>
  );
};

export default SignUp;
