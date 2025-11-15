import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const DashboardContainer = styled.div`
  padding: 0;
`;

const WelcomeSection = styled(motion.div)`
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
`;

const WelcomeTitle = styled.h1`
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const WelcomeSubtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2rem;
  backdrop-filter: blur(10px);
  transition: var(--transition-normal);

  &:hover {
    border-color: var(--accent-cyan);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
`;

const StatIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const StatValue = styled.div`
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-cyan);
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatChange = styled.div`
  font-size: 0.85rem;
  margin-top: 0.5rem;
  color: ${props => props.positive ? 'var(--success-color)' : 'var(--error-color)'};
  
  &::before {
    content: '${props => props.positive ? '↗' : '↘'}';
    margin-right: 0.25rem;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Card = styled(motion.div)`
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2rem;
  backdrop-filter: blur(10px);
  transition: var(--transition-normal);

  &:hover {
    border-color: var(--accent-cyan);
    box-shadow: var(--shadow-md);
  }
`;

const CardTitle = styled.h3`
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const RecentActivity = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(26, 26, 46, 0.5);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--accent-cyan);
`;

const ActivityIcon = styled.div`
  font-size: 1.5rem;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const ActivityTime = styled.div`
  color: var(--text-muted);
  font-size: 0.85rem;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const ActionButton = styled(motion.button)`
  background: var(--gradient-primary);
  color: var(--primary-bg);
  border: none;
  border-radius: var(--radius-md);
  padding: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &.secondary {
    background: transparent;
    color: var(--accent-cyan);
    border: 2px solid var(--accent-cyan);

    &:hover {
      background: var(--accent-cyan);
      color: var(--primary-bg);
    }
  }
`;

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      icon: '💰',
      value: '$124,500',
      label: 'Total Revenue',
      change: '+12.5%',
      positive: true
    },
    {
      icon: '📈',
      value: '89',
      label: 'Active Leads',
      change: '+8.2%',
      positive: true
    },
    {
      icon: '🎯',
      value: '67%',
      label: 'Conversion Rate',
      change: '+3.1%',
      positive: true
    },
    {
      icon: '⚡',
      value: '23',
      label: 'Deals Closed',
      change: '-2.4%',
      positive: false
    }
  ];

  const recentActivities = [
    {
      icon: '✅',
      title: 'Deal closed with Acme Corp',
      time: '2 hours ago'
    },
    {
      icon: '📞',
      title: 'Follow-up call scheduled',
      time: '4 hours ago'
    },
    {
      icon: '📧',
      title: 'Email campaign sent to 150 leads',
      time: '6 hours ago'
    },
    {
      icon: '👤',
      title: 'New lead added: Tech Solutions Inc',
      time: '8 hours ago'
    },
    {
      icon: '📊',
      title: 'Weekly report generated',
      time: '1 day ago'
    }
  ];

  return (
    <DashboardContainer>
      <WelcomeSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <WelcomeTitle>
          Welcome back, {user?.firstName}! 👋
        </WelcomeTitle>
        <WelcomeSubtitle>
          Here's what's happening with your sales today.
        </WelcomeSubtitle>
      </WelcomeSection>

      <StatsGrid>
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <StatIcon>{stat.icon}</StatIcon>
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
            <StatChange positive={stat.positive}>
              {stat.change} from last month
            </StatChange>
          </StatCard>
        ))}
      </StatsGrid>

      <ContentGrid>
        <MainContent>
          <Card
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <CardTitle>
              📊 Sales Performance
            </CardTitle>
            <div style={{ 
              height: '300px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'rgba(26, 26, 46, 0.5)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
                <div>Sales Chart Coming Soon</div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Interactive analytics dashboard
                </div>
              </div>
            </div>
          </Card>

          <Card
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <CardTitle>
              🎯 Top Opportunities
            </CardTitle>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem' 
            }}>
              {[
                { company: 'Tech Innovations Ltd', value: '$45,000', stage: 'Negotiation' },
                { company: 'Global Solutions Inc', value: '$32,000', stage: 'Proposal' },
                { company: 'Future Systems Corp', value: '$28,500', stage: 'Discovery' }
              ].map((opportunity, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'rgba(26, 26, 46, 0.5)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {opportunity.company}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {opportunity.stage}
                    </div>
                  </div>
                  <div style={{ 
                    color: 'var(--accent-cyan)', 
                    fontWeight: '700',
                    fontSize: '1.1rem'
                  }}>
                    {opportunity.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </MainContent>

        <Sidebar>
          <Card
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <CardTitle>
              ⚡ Quick Actions
            </CardTitle>
            <QuickActions>
              <ActionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ➕ Add Lead
              </ActionButton>
              <ActionButton
                className="secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📧 Send Email
              </ActionButton>
              <ActionButton
                className="secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📞 Schedule Call
              </ActionButton>
              <ActionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📊 View Reports
              </ActionButton>
            </QuickActions>
          </Card>

          <Card
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <CardTitle>
              🕐 Recent Activity
            </CardTitle>
            <RecentActivity>
              {recentActivities.map((activity, index) => (
                <ActivityItem key={index}>
                  <ActivityIcon>{activity.icon}</ActivityIcon>
                  <ActivityContent>
                    <ActivityTitle>{activity.title}</ActivityTitle>
                    <ActivityTime>{activity.time}</ActivityTime>
                  </ActivityContent>
                </ActivityItem>
              ))}
            </RecentActivity>
          </Card>
        </Sidebar>
      </ContentGrid>
    </DashboardContainer>
  );
};

export default Dashboard;
