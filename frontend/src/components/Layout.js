import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
// Tooltip removed per latest requirements

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: var(--gradient-bg);
`;

const Sidebar = styled(motion.aside)`
  width: ${props => props.isCollapsed ? '80px' : '280px'};
  background: var(--gradient-card);
  border-right: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
  transition: width 0.3s ease;
  position: fixed;
  height: 100vh;
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: ${props => props.isOpen ? '280px' : '-280px'};
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
  }
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: ${props => props.sidebarCollapsed ? '80px' : '280px'};
  transition: margin-left 0.3s ease;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;


const SidebarHeader = styled.div`
  padding: 2rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  text-align: center;
  position: relative;
`;

const Logo = styled.h1`
  font-family: var(--font-heading);
  font-size: ${props => props.collapsed ? '1.5rem' : '2rem'};
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  transition: font-size 0.3s ease;
`;

const NavMenu = styled.nav`
  padding: 1rem 0;
`;

const NavItem = styled(motion.div)`
  width: 100%;
  padding: 0.85rem 1.75rem;
  margin: 0.35rem 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  border-radius: 16px;

  &:hover {
    background: rgba(0, 246, 255, 0.12);
    color: var(--accent-cyan);
    transform: translateX(5px);
  }

  &.active {
    background: var(--gradient-primary);
    color: var(--primary-bg);
    font-weight: 600;
    box-shadow: var(--shadow-glow);
  }

  .icon {
    font-size: 1.25rem;
    min-width: 20px;
  }

  .text {
    opacity: ${props => props.collapsed ? 0 : 1};
    transition: opacity 0.3s ease;
    white-space: nowrap;
  }
`;

const UserProfile = styled.div`
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
  display: flex;
  flex-direction: ${props => props.collapsed ? 'column' : 'row'};
  align-items: center;
  gap: ${props => props.collapsed ? '0.5rem' : '1rem'};
  background: rgba(14, 14, 30, 0.6);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
`;


const UserInfo = styled.div`
  flex: 1;
  opacity: ${props => props.collapsed ? 0 : 1};
  transition: opacity 0.3s ease;

  .name {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  .email {
    color: var(--text-muted);
    font-size: 0.8rem;
  }
`;

const LogoutButton = styled.button`
  border: none;
  background: rgba(0, 246, 255, 0.15);
  color: var(--accent-cyan);
  padding: ${props => props.collapsed ? '0.4rem' : '0.45rem 0.9rem'};
  border-radius: var(--radius-md);
  font-size: ${props => props.collapsed ? '1rem' : '0.8rem'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: ${props => props.collapsed ? '32px' : 'auto'};
  height: ${props => props.collapsed ? '32px' : 'auto'};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--accent-cyan);
    color: var(--primary-bg);
    box-shadow: var(--shadow-md);
  }
`;


const CollapseToggle = styled.button`
  background: none;
  border: none;
  color: var(--accent-cyan);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;

  &:hover {
    background: rgba(0, 246, 255, 0.1);
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const ContentArea = styled.div`
  padding: 2rem;
  min-height: calc(100vh - 80px);
`;

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { icon: '☰', text: 'Dashboard', path: '/dashboard' },
    { icon: '</>', text: 'Agent', path: '/agent' },
    { icon: '🖧', text: 'Workflow', path: '/workflow' },

  ];

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };


  return (
    <LayoutContainer>
      <AnimatePresence>
        {mobileMenuOpen && (
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMobileMenu}
          />
        )}
      </AnimatePresence>

      <Sidebar
        isCollapsed={sidebarCollapsed}
        isOpen={mobileMenuOpen}
        initial={false}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <SidebarContent>
          <CollapseToggle onClick={toggleSidebar}>
            {sidebarCollapsed ? '→' : '←'}
          </CollapseToggle>

          <SidebarHeader>
            <Logo collapsed={sidebarCollapsed}>
              {sidebarCollapsed ? 'OA' : 'ORION AI'}
            </Logo>
          </SidebarHeader>

          <NavMenu>
            {navigationItems.map((item, index) => (
              <NavItem
                key={index}
                collapsed={sidebarCollapsed}
                className={location.pathname === item.path ? 'active' : ''}
                onClick={() => handleNavigation(item.path)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="icon">{item.icon}</span>
                <span className="text">{item.text}</span>
              </NavItem>
            ))}
          </NavMenu>

          <UserProfile collapsed={sidebarCollapsed}>
            <UserInfo collapsed={sidebarCollapsed}>
              <div className="name">{user?.fullName || 'User'}</div>
              <div className="email">{user?.email}</div>
            </UserInfo>
            <LogoutButton onClick={handleLogout} collapsed={sidebarCollapsed}>
              {sidebarCollapsed ? '⏻' : 'Logout'}
            </LogoutButton>
          </UserProfile>
        </SidebarContent>
      </Sidebar>

      <MainContent sidebarCollapsed={sidebarCollapsed}>


        <ContentArea>
          {children}
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout;
