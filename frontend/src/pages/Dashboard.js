import React from 'react';
import styled from 'styled-components';

const Placeholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  font-size: 1.25rem;
  color: var(--text-secondary);
`;

const Dashboard = () => (
  <Placeholder>
    This page is under development, please check later.
  </Placeholder>
);

export default Dashboard;
