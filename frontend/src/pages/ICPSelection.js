import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import AgentCreationModal from '../components/AgentCreationModal';
import agentService from '../services/agentService';

const ICPContainer = styled.div`
  padding: 0;
  max-width: 1000px;
  margin: 0 auto;
`;

const HeaderSection = styled(motion.div)`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1.2rem;
  line-height: 1.6;
  max-width: 700px;
  margin: 0 auto;
`;

const FilterCard = styled(motion.div)`
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 3rem;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lg);
  transition: var(--transition-normal);

  &:hover {
    border-color: var(--accent-cyan);
    box-shadow: var(--shadow-glow);
  }

  @media (max-width: 768px) {
    padding: 2rem;
    margin: 1rem;
  }
`;

const FilterTitle = styled.h2`
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FilterDescription = styled.p`
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
  line-height: 1.6;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const FilterGroup = styled.div`
  background: rgba(26, 26, 46, 0.5);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: var(--transition-normal);

  &:hover {
    border-color: var(--accent-cyan);
    background: rgba(26, 26, 46, 0.7);
  }
`;

const FilterLabel = styled.div`
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DropdownContainer = styled.div`
  position: relative;
`;

const DropdownHeader = styled.div`
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    border-color: var(--accent-cyan);
  }

  &.open {
    border-color: var(--accent-cyan);
    box-shadow: var(--shadow-glow);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
`;

const DropdownArrow = styled.span`
  color: var(--text-muted);
  transition: var(--transition-fast);
  transform: ${props => props.open ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const DropdownContent = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(26, 26, 46, 0.95);
  border: 1px solid var(--accent-cyan);
  border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  backdrop-filter: blur(20px);
  z-index: 1000;
  max-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const SearchInput = styled.input`
  background: rgba(26, 26, 46, 0.9);
  border: none;
  border-bottom: 1px solid var(--border-color);
  padding: 0.75rem;
  color: var(--text-primary);
  font-family: var(--font-primary);
  outline: none;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    background: rgba(26, 26, 46, 1);
  }
`;

const OptionsList = styled.div`
  overflow-y: auto;
  max-height: 200px;
`;

const OptionItem = styled.div`
  padding: 0.75rem;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);

  &:hover {
    background: rgba(0, 246, 255, 0.1);
    color: var(--text-primary);
  }

  &.selected {
    background: rgba(0, 246, 255, 0.2);
    color: var(--accent-cyan);
  }

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--accent-cyan);
  }
`;

const SelectedTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const Tag = styled.span`
  background: var(--gradient-primary);
  color: var(--primary-bg);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .remove {
    cursor: pointer;
    font-weight: 700;
    
    &:hover {
      color: var(--error-color);
    }
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
`;

const Tab = styled.button`
  background: ${props => props.active ? 'var(--accent-cyan)' : 'transparent'};
  color: ${props => props.active ? 'var(--primary-bg)' : 'var(--text-secondary)'};
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: var(--transition-normal);
  font-family: var(--font-primary);
  font-size: 0.9rem;

  &:first-child {
    border-radius: var(--radius-md) 0 0 var(--radius-md);
  }

  &:last-child {
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
  }

  &:hover:not(.active) {
    color: var(--accent-cyan);
  }
`;

const AdvancedOptions = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: var(--transition-fast);
  margin-bottom: 0.75rem;

  &:hover {
    color: var(--text-primary);
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--accent-cyan);
  }
`;

const HelpText = styled.div`
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-top: 0.5rem;
  font-style: italic;
`;

const Select = styled.select`
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  color: var(--text-primary);
  font-size: 1rem;
  transition: var(--transition-normal);
  font-family: var(--font-primary);
  width: 100%;
  appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--accent-cyan);
    box-shadow: var(--shadow-glow);
  }
`;

const RangeInputGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
`;

const RangeInput = styled.input`
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  color: var(--text-primary);
  font-size: 1rem;
  transition: var(--transition-normal);
  font-family: var(--font-primary);

  &:focus {
    outline: none;
    border-color: var(--accent-cyan);
    box-shadow: var(--shadow-glow);
  }

  &::placeholder {
    color: var(--text-muted);
  }
`;

const RangeSeparator = styled.span`
  color: var(--text-muted);
  font-weight: 600;
`;

const RevenueOptions = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const RevenueOption = styled.button`
  background: ${props => props.active ? 'var(--accent-cyan)' : 'rgba(26, 26, 46, 0.8)'};
  color: ${props => props.active ? 'var(--primary-bg)' : 'var(--text-secondary)'};
  border: 1px solid ${props => props.active ? 'var(--accent-cyan)' : 'var(--border-color)'};
  border-radius: var(--radius-md);
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition-normal);
  font-family: var(--font-primary);

  &:hover {
    border-color: var(--accent-cyan);
    color: var(--accent-cyan);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TextArea = styled.textarea`
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
  color: var(--text-primary);
  font-size: 1rem;
  font-family: var(--font-primary);
  line-height: 1.6;
  resize: vertical;
  min-height: 120px;
  width: 100%;
  transition: var(--transition-normal);

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
  }
`;

const CharacterCount = styled.div`
  color: var(--text-muted);
  font-size: 0.85rem;
  text-align: right;
  margin-top: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const Button = styled(motion.button)`
  font-family: var(--font-primary);
  font-weight: 600;
  padding: 1rem 2rem;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 140px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.primary {
    background: var(--gradient-primary);
    color: var(--primary-bg);
    box-shadow: var(--shadow-md);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }

  &.secondary {
    background: transparent;
    color: var(--text-secondary);
    border: 2px solid var(--border-color);

    &:hover:not(:disabled) {
      color: var(--accent-cyan);
      border-color: var(--accent-cyan);
      box-shadow: var(--shadow-sm);
    }
  }
`;

// Dropdown component defined outside to prevent re-creation on each render
const MultiSelectDropdown = ({ 
  label, 
  placeholder, 
  options, 
  selectedItems, 
  setSelectedItems, 
  dropdownKey,
  showTabs = false,
  showAdvanced = false,
  dropdownStates,
  searchTerms,
  jobTitlesTab,
  setJobTitlesTab,
  includeSimilarTitles,
  setIncludeSimilarTitles,
  toggleDropdown,
  handleSearch,
  toggleSelection,
  removeTag,
  getFilteredOptions
}) => {
  const isOpen = dropdownStates[dropdownKey];
  const searchTerm = searchTerms[dropdownKey];
  const filteredOptions = getFilteredOptions(options, searchTerm);

  return (
    <FilterGroup>
      <FilterLabel>{label}</FilterLabel>
      
      {showTabs && (
        <TabContainer>
          <Tab 
            active={jobTitlesTab === 'simple'} 
            onClick={() => setJobTitlesTab('simple')}
          >
            Simple
          </Tab>
          <Tab 
            active={jobTitlesTab === 'advanced'} 
            onClick={() => setJobTitlesTab('advanced')}
          >
            Advanced
          </Tab>
        </TabContainer>
      )}

      <DropdownContainer>
        <DropdownHeader 
          className={isOpen ? 'open' : ''} 
          onClick={() => toggleDropdown(dropdownKey)}
        >
          <span style={{ color: selectedItems.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {selectedItems.length > 0 ? `${selectedItems.length} selected` : placeholder}
          </span>
          <DropdownArrow open={isOpen}>▼</DropdownArrow>
        </DropdownHeader>

        {isOpen && (
          <DropdownContent>
            <SearchInput
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => handleSearch(dropdownKey, e.target.value)}
              autoFocus
            />
            <OptionsList>
              {filteredOptions.map((option) => (
                <OptionItem
                  key={option}
                  className={selectedItems.includes(option) ? 'selected' : ''}
                  onClick={() => toggleSelection(selectedItems, setSelectedItems, option)}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(option)}
                    onChange={() => {}}
                  />
                  {option}
                </OptionItem>
              ))}
            </OptionsList>
          </DropdownContent>
        )}
      </DropdownContainer>

      {selectedItems.length > 0 && (
        <SelectedTags>
          {selectedItems.map((item) => (
            <Tag key={item}>
              {item}
              <span 
                className="remove" 
                onClick={() => removeTag(selectedItems, setSelectedItems, item)}
              >
                ×
              </span>
            </Tag>
          ))}
        </SelectedTags>
      )}

      {showAdvanced && jobTitlesTab === 'advanced' && (
        <AdvancedOptions>
          <HelpText>Use "quotation marks" to return exact matches</HelpText>
          <CheckboxItem>
            <input
              type="checkbox"
              checked={includeSimilarTitles}
              onChange={(e) => setIncludeSimilarTitles(e.target.checked)}
            />
            Include people with similar titles
          </CheckboxItem>
        </AdvancedOptions>
      )}
    </FilterGroup>
  );
};

const ErrorMessage = styled(motion.div)`
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: #ff3b30;
  font-size: 0.9rem;
  font-family: var(--font-primary);
`;

const ICPSelection = () => {
  const navigate = useNavigate();
  const [jobTitles, setJobTitles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [revenueType, setRevenueType] = useState('is between');
  const [revenueMin, setRevenueMin] = useState('');
  const [revenueMax, setRevenueMax] = useState('');
  const [employeeRange, setEmployeeRange] = useState('');
  const [fundingStages, setFundingStages] = useState([]);
  const [companyTypes, setCompanyTypes] = useState({
    private: false,
    public: false
  });
  const [messagingStyle, setMessagingStyle] = useState('');
  const [error, setError] = useState('');
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown states
  const [dropdownStates, setDropdownStates] = useState({
    jobTitles: false,
    companies: false,
    locations: false,
    funding: false
  });

  // Search states
  const [searchTerms, setSearchTerms] = useState({
    jobTitles: '',
    companies: '',
    locations: '',
    funding: ''
  });

  // Tab states for job titles
  const [jobTitlesTab, setJobTitlesTab] = useState('simple');
  const [includeSimilarTitles, setIncludeSimilarTitles] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);

  // Check if we're in update mode and load existing agent data
  React.useEffect(() => {
    const loadAgentData = async () => {
      try {
        setIsLoading(true);
        const agentId = sessionStorage.getItem('currentAgentId');
        const updateMode = sessionStorage.getItem('isUpdateMode') === 'true';
        
        setIsUpdateMode(updateMode);
        
        if (updateMode && agentId) {
          // Fetch existing agent data
          const response = await agentService.getAgentById(agentId);
          const agent = response.data.agent;
          
          // Populate form with existing ICP data
          if (agent.apollo) {
            const apollo = agent.apollo;
            
            if (apollo.jobTitles) setJobTitles(apollo.jobTitles);
            if (apollo.companies) setCompanies(apollo.companies);
            if (apollo.locations) setLocations(apollo.locations);
            if (apollo.revenue?.type) setRevenueType(apollo.revenue.type);
            if (apollo.revenue?.min) setRevenueMin(apollo.revenue.min.toString());
            if (apollo.revenue?.max) setRevenueMax(apollo.revenue.max.toString());
            if (apollo.employeeRange) setEmployeeRange(apollo.employeeRange);
            if (apollo.fundingStages) setFundingStages(apollo.fundingStages);
            if (apollo.companyTypes) {
              setCompanyTypes({
                private: apollo.companyTypes.private || false,
                public: apollo.companyTypes.public || false
              });
            }
            if (apollo.jobTitleSettings?.tab) setJobTitlesTab(apollo.jobTitleSettings.tab);
            if (apollo.jobTitleSettings?.includeSimilarTitles !== undefined) {
              setIncludeSimilarTitles(apollo.jobTitleSettings.includeSimilarTitles);
            }
            // Always set messagingStyle, even if empty
            setMessagingStyle(apollo.messagingStyle || '');
          }
        }
      } catch (error) {
        console.error('Error loading agent data:', error);
        setError('Failed to load agent data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAgentData();
  }, []);

  const handleBack = () => {
    navigate('/product-description');
  };

  const handleNext = async () => {
    setError('');
    
    try {
      // Get agent ID from session storage
      const agentId = sessionStorage.getItem('currentAgentId');
      if (!agentId) {
        throw new Error('Agent ID not found. Please start from the Agent configuration page.');
      }

      // Prepare ICP data for API
      const icpData = {
        jobTitles,
        companies,
        locations,
        revenueType,
        revenueMin: revenueMin ? parseFloat(revenueMin) : undefined,
        revenueMax: revenueMax ? parseFloat(revenueMax) : undefined,
        employeeRange: employeeRange || undefined,
        fundingStages,
        companyTypes,
        jobTitlesTab,
        includeSimilarTitles,
        messagingStyle: messagingStyle.trim()
      };


      // Update agent with ICP configuration
      const response = await agentService.updateAgentICP(agentId, icpData);
      console.log('ICP configuration updated successfully:', response.data);

      // Only activate the agent if it's a new creation, not an update
      if (!isUpdateMode) {
        const activationResponse = await agentService.activateAgent(agentId);
        console.log('Agent activated successfully:', activationResponse.data);
      }

      // Show success modal
      setShowModal(true);
    } catch (error) {
      console.error('Error updating ICP configuration:', error);
      setError(error.message || 'Failed to update ICP configuration. Please try again.');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    // Clear the current agent ID and update mode from session storage
    sessionStorage.removeItem('currentAgentId');
    sessionStorage.removeItem('isUpdateMode');
    // Navigate to dashboard after modal closes
    navigate('/dashboard');
  };

  // Sample data for dropdowns
  const jobTitleOptions = [
    'CEO', 'CTO', 'Marketing Manager', 'Sales Director', 'VP Sales', 
    'Marketing Director', 'Customer Success Manager', 'Product Manager',
    'Operations Manager', 'Business Development Manager', 'Account Executive',
    'Sales Representative', 'Marketing Coordinator', 'Customer Support'
  ];

  const companyOptions = [
    'Google', 'Microsoft', 'Apple', 'Amazon', 'Salesforce', 'HubSpot',
    'Zoom', 'Slack', 'Shopify', 'Stripe', 'Atlassian', 'Adobe',
    'Netflix', 'Spotify', 'Uber', 'Airbnb', 'Tesla', 'Meta'
  ];

  const locationOptions = [
    'San Francisco, CA', 'New York, NY', 'Los Angeles, CA', 'Chicago, IL',
    'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Denver, CO', 'Atlanta, GA',
    'London, UK', 'Toronto, Canada', 'Berlin, Germany', 'Paris, France',
    'Amsterdam, Netherlands', 'Sydney, Australia', 'Singapore'
  ];

  const fundingOptions = [
    'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 
    'Series D+', 'IPO', 'Acquired', 'Private Equity'
  ];

  const toggleDropdown = (dropdown) => {
    setDropdownStates(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const handleSearch = (dropdown, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [dropdown]: value
    }));
  };

  const toggleSelection = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const removeTag = (list, setList, value) => {
    setList(list.filter(item => item !== value));
  };

  const getFilteredOptions = (options, searchTerm) => {
    return options.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const revenueOptions = ['is between', 'is known', 'is unknown'];
  const employeeOptions = [
    '1-10', '11-50', '51-200', '201-500', '501-1000', 
    '1001-5000', '5001-10000', '10000+'
  ];


  if (isLoading) {
    return (
      <ICPContainer>
        <HeaderSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Title>Loading...</Title>
          <Subtitle>
            Loading agent data...
          </Subtitle>
        </HeaderSection>
      </ICPContainer>
    );
  }

  return (
    <ICPContainer>
      <HeaderSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Title>{isUpdateMode ? 'Update ICP Selection' : 'ICP Selection'}</Title>
        <Subtitle>
          {isUpdateMode 
            ? 'Review and update your Ideal Customer Profile filters to better target the right prospects.'
            : 'Define your Ideal Customer Profile by setting filters to target the right prospects. These filters will help your AI agent identify and focus on the most relevant leads.'
          }
        </Subtitle>
      </HeaderSection>

      <FilterCard
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <FilterTitle>
          {isUpdateMode ? ' Update Target Filters' : ' Target Filters'}
        </FilterTitle>
        <FilterDescription>
          {isUpdateMode 
            ? 'Review and update your target filters. Changes will be saved when you proceed.'
            : 'Set up filters to define your ideal customer profile. The more specific you are, the better your AI agent can identify high-quality prospects.'
          }
        </FilterDescription>

        {error && (
          <ErrorMessage
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </ErrorMessage>
        )}

        <FiltersGrid>
          {/* Job Titles */}
          <MultiSelectDropdown
            label=" Job Titles"
            placeholder="Include titles"
            options={jobTitleOptions}
            selectedItems={jobTitles}
            setSelectedItems={setJobTitles}
            dropdownKey="jobTitles"
            showTabs={true}
            showAdvanced={true}
            dropdownStates={dropdownStates}
            searchTerms={searchTerms}
            jobTitlesTab={jobTitlesTab}
            setJobTitlesTab={setJobTitlesTab}
            includeSimilarTitles={includeSimilarTitles}
            setIncludeSimilarTitles={setIncludeSimilarTitles}
            toggleDropdown={toggleDropdown}
            handleSearch={handleSearch}
            toggleSelection={toggleSelection}
            removeTag={removeTag}
            getFilteredOptions={getFilteredOptions}
          />

          {/* Company */}
          <MultiSelectDropdown
            label=" Company"
            placeholder="Include companies"
            options={companyOptions}
            selectedItems={companies}
            setSelectedItems={setCompanies}
            dropdownKey="companies"
            dropdownStates={dropdownStates}
            searchTerms={searchTerms}
            jobTitlesTab={jobTitlesTab}
            setJobTitlesTab={setJobTitlesTab}
            includeSimilarTitles={includeSimilarTitles}
            setIncludeSimilarTitles={setIncludeSimilarTitles}
            toggleDropdown={toggleDropdown}
            handleSearch={handleSearch}
            toggleSelection={toggleSelection}
            removeTag={removeTag}
            getFilteredOptions={getFilteredOptions}
          />

          {/* Location */}
          <MultiSelectDropdown
            label=" Location"
            placeholder="Include locations"
            options={locationOptions}
            selectedItems={locations}
            setSelectedItems={setLocations}
            dropdownKey="locations"
            dropdownStates={dropdownStates}
            searchTerms={searchTerms}
            jobTitlesTab={jobTitlesTab}
            setJobTitlesTab={setJobTitlesTab}
            includeSimilarTitles={includeSimilarTitles}
            setIncludeSimilarTitles={setIncludeSimilarTitles}
            toggleDropdown={toggleDropdown}
            handleSearch={handleSearch}
            toggleSelection={toggleSelection}
            removeTag={removeTag}
            getFilteredOptions={getFilteredOptions}
          />

          {/* Number of Employees */}
          <FilterGroup>
            <FilterLabel>
               # of Employees
            </FilterLabel>
            <Select 
              value={employeeRange} 
              onChange={(e) => setEmployeeRange(e.target.value)}
            >
              <option value="">Select employee range</option>
              {employeeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </FilterGroup>

          {/* Revenue */}
          <FilterGroup>
            <FilterLabel>
               Revenue
            </FilterLabel>
            <RevenueOptions>
              {revenueOptions.map((option) => (
                <RevenueOption
                  key={option}
                  active={revenueType === option}
                  onClick={() => setRevenueType(option)}
                >
                  {option}
                </RevenueOption>
              ))}
            </RevenueOptions>
            
            {revenueType === 'is between' && (
              <RangeInputGroup>
                <RangeInput
                  type="number"
                  placeholder="Min"
                  value={revenueMin}
                  onChange={(e) => setRevenueMin(e.target.value)}
                />
                <RangeSeparator>to</RangeSeparator>
                <RangeInput
                  type="number"
                  placeholder="Max"
                  value={revenueMax}
                  onChange={(e) => setRevenueMax(e.target.value)}
                />
              </RangeInputGroup>
            )}

            <CheckboxGroup>
              <CheckboxItem>
                <input
                  type="checkbox"
                  checked={companyTypes.private}
                  onChange={(e) => setCompanyTypes({
                    ...companyTypes,
                    private: e.target.checked
                  })}
                />
                Private Company
                <span className="count">135.0K</span>
              </CheckboxItem>
              <CheckboxItem>
                <input
                  type="checkbox"
                  checked={companyTypes.public}
                  onChange={(e) => setCompanyTypes({
                    ...companyTypes,
                    public: e.target.checked
                  })}
                />
                Public Company
                <span className="count">50.8K</span>
              </CheckboxItem>
            </CheckboxGroup>
          </FilterGroup>

          {/* Funding */}
          <MultiSelectDropdown
            label=" Funding"
            placeholder="Select funding stages"
            options={fundingOptions}
            selectedItems={fundingStages}
            setSelectedItems={setFundingStages}
            dropdownKey="funding"
            dropdownStates={dropdownStates}
            searchTerms={searchTerms}
            jobTitlesTab={jobTitlesTab}
            setJobTitlesTab={setJobTitlesTab}
            includeSimilarTitles={includeSimilarTitles}
            setIncludeSimilarTitles={setIncludeSimilarTitles}
            toggleDropdown={toggleDropdown}
            handleSearch={handleSearch}
            toggleSelection={toggleSelection}
            removeTag={removeTag}
            getFilteredOptions={getFilteredOptions}
          />
        </FiltersGrid>

        {/* Messaging Style Section */}
        <FilterGroup style={{ marginTop: '2rem' }}>
          <FilterLabel>
             Messaging Style (Optional)
          </FilterLabel>
          <HelpText style={{ marginBottom: '1rem' }}>
            Define the tone, style, and approach your AI agent should use when communicating with prospects. 
            This helps personalize outreach messages to match your brand voice.
          </HelpText>
          <TextArea
            placeholder="Describe your preferred messaging style, tone, and approach. For example: 'Use a professional but friendly tone. Focus on value proposition and avoid being too salesy. Keep messages concise and personalized. Always mention specific pain points relevant to their industry.'"
            value={messagingStyle}
            onChange={(e) => setMessagingStyle(e.target.value)}
            maxLength={2000}
          />
          <CharacterCount>
            {messagingStyle.length}/2000 characters
          </CharacterCount>
        </FilterGroup>

        <ButtonGroup>
          <Button
            type="button"
            className="secondary"
            onClick={handleBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back
          </Button>
          <Button
            type="button"
            className="primary"
            onClick={handleNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Next Step
            →
          </Button>
        </ButtonGroup>
      </FilterCard>

      <AgentCreationModal
        isOpen={showModal}
        onClose={handleModalClose}
        isUpdateMode={isUpdateMode}
      />
    </ICPContainer>
  );
};

export default ICPSelection;
