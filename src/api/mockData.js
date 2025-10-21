// Mock data for CRM system
const STORAGE_KEYS = {
  customers: 'crm_customers',
  interactions: 'crm_interactions',
  tickets: 'crm_tickets',
  segments: 'crm_segments'
};

// Generate initial mock data
const generateMockCustomers = () => {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Jennifer'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const companies = ['TechCorp', 'InnovateLLC', 'GlobalSoft', 'DataPro', 'CloudTech', 'SmartSys', 'DevCorp', 'NextGen', 'ProTech', 'DigitalMax'];
  const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Media'];
  const statuses = ['Active', 'Inactive', 'Prospect', 'Qualified'];

  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    email: `customer${i + 1}@example.com`,
    phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    company: companies[Math.floor(Math.random() * companies.length)],
    industry: industries[Math.floor(Math.random() * industries.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    value: Math.floor(Math.random() * 100000) + 5000,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastContact: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    address: {
      street: `${Math.floor(Math.random() * 9999) + 1} Main St`,
      city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
      state: ['NY', 'CA', 'IL', 'TX', 'AZ'][Math.floor(Math.random() * 5)],
      zip: String(Math.floor(Math.random() * 90000) + 10000)
    },
    tags: ['VIP', 'Enterprise', 'SMB', 'Startup', 'Lead'].slice(0, Math.floor(Math.random() * 3) + 1)
  }));
};

const generateMockInteractions = () => {
  const types = ['Email', 'Phone', 'Meeting', 'Chat', 'Social'];
  const channels = ['Website', 'LinkedIn', 'Email Campaign', 'Phone Call', 'In-Person'];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    customerId: Math.floor(Math.random() * 50) + 1,
    type: types[Math.floor(Math.random() * types.length)],
    channel: channels[Math.floor(Math.random() * channels.length)],
    subject: `Customer interaction ${i + 1}`,
    notes: `Detailed notes about interaction ${i + 1}. Customer showed interest in our products.`,
    date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    duration: Math.floor(Math.random() * 120) + 5,
    outcome: ['Positive', 'Neutral', 'Negative'][Math.floor(Math.random() * 3)],
    nextAction: ['Follow up', 'Send proposal', 'Schedule demo', 'Close deal'][Math.floor(Math.random() * 4)]
  }));
};

const generateMockTickets = () => {
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  const categories = ['Technical', 'Billing', 'General', 'Feature Request'];
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    customerId: Math.floor(Math.random() * 50) + 1,
    title: `Support ticket ${i + 1}`,
    description: `Customer needs help with issue ${i + 1}. This is a detailed description of the problem.`,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    assignedTo: `Agent ${Math.floor(Math.random() * 5) + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    responses: [
      {
        id: 1,
        author: 'Customer',
        message: 'I need help with this issue',
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        author: 'Support Agent',
        message: 'We are looking into this issue and will get back to you soon.',
        timestamp: new Date().toISOString()
      }
    ]
  }));
};

// Initialize data if not exists
const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.customers)) {
    localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(generateMockCustomers()));
  }
  if (!localStorage.getItem(STORAGE_KEYS.interactions)) {
    localStorage.setItem(STORAGE_KEYS.interactions, JSON.stringify(generateMockInteractions()));
  }
  if (!localStorage.getItem(STORAGE_KEYS.tickets)) {
    localStorage.setItem(STORAGE_KEYS.tickets, JSON.stringify(generateMockTickets()));
  }
  if (!localStorage.getItem(STORAGE_KEYS.segments)) {
    localStorage.setItem(STORAGE_KEYS.segments, JSON.stringify([]));
  }
};

// Data provider functions
export const mockDataProvider = {
  // Customers
  getCustomers: async (page = 1, limit = 10, search = '', filters = {}) => {
    initializeData();
    const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.customers));
    
    let filtered = customers;
    
    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.firstName.toLowerCase().includes(searchLower) ||
        customer.lastName.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.company.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(customer => customer.status === filters.status);
    }
    if (filters.industry) {
      filtered = filtered.filter(customer => customer.industry === filters.industry);
    }
    
    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = filtered.slice(start, end);
    
    return {
      data: paginatedData,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit)
    };
  },

  getCustomer: async (id) => {
    initializeData();
    const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.customers));
    return customers.find(customer => customer.id === parseInt(id));
  },

  createCustomer: async (customerData) => {
    initializeData();
    const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.customers));
    const newCustomer = {
      id: Math.max(...customers.map(c => c.id)) + 1,
      ...customerData,
      createdAt: new Date().toISOString()
    };
    customers.push(newCustomer);
    localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(customers));
    return newCustomer;
  },

  updateCustomer: async (id, customerData) => {
    initializeData();
    const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.customers));
    const index = customers.findIndex(customer => customer.id === parseInt(id));
    if (index !== -1) {
      customers[index] = { ...customers[index], ...customerData };
      localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(customers));
      return customers[index];
    }
    throw new Error('Customer not found');
  },

  deleteCustomer: async (id) => {
    initializeData();
    const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.customers));
    const filtered = customers.filter(customer => customer.id !== parseInt(id));
    localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(filtered));
    return { success: true };
  },

  // Interactions
  getInteractions: async (customerId = null, page = 1, limit = 10) => {
    initializeData();
    let interactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.interactions));
    
    if (customerId) {
      interactions = interactions.filter(interaction => interaction.customerId === parseInt(customerId));
    }
    
    interactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = interactions.slice(start, end);
    
    return {
      data: paginatedData,
      total: interactions.length,
      page,
      limit,
      totalPages: Math.ceil(interactions.length / limit)
    };
  },

  createInteraction: async (interactionData) => {
    initializeData();
    const interactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.interactions));
    const newInteraction = {
      id: Math.max(...interactions.map(i => i.id)) + 1,
      ...interactionData,
      date: new Date().toISOString()
    };
    interactions.push(newInteraction);
    localStorage.setItem(STORAGE_KEYS.interactions, JSON.stringify(interactions));
    return newInteraction;
  },

  // Support Tickets
  getTickets: async (page = 1, limit = 10, filters = {}) => {
    initializeData();
    let tickets = JSON.parse(localStorage.getItem(STORAGE_KEYS.tickets));
    
    if (filters.status) {
      tickets = tickets.filter(ticket => ticket.status === filters.status);
    }
    if (filters.priority) {
      tickets = tickets.filter(ticket => ticket.priority === filters.priority);
    }
    if (filters.customerId) {
      tickets = tickets.filter(ticket => ticket.customerId === parseInt(filters.customerId));
    }
    
    tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = tickets.slice(start, end);
    
    return {
      data: paginatedData,
      total: tickets.length,
      page,
      limit,
      totalPages: Math.ceil(tickets.length / limit)
    };
  },

  getTicket: async (id) => {
    initializeData();
    const tickets = JSON.parse(localStorage.getItem(STORAGE_KEYS.tickets));
    return tickets.find(ticket => ticket.id === parseInt(id));
  },

  updateTicket: async (id, ticketData) => {
    initializeData();
    const tickets = JSON.parse(localStorage.getItem(STORAGE_KEYS.tickets));
    const index = tickets.findIndex(ticket => ticket.id === parseInt(id));
    if (index !== -1) {
      tickets[index] = { ...tickets[index], ...ticketData, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.tickets, JSON.stringify(tickets));
      return tickets[index];
    }
    throw new Error('Ticket not found');
  },

  // Statistics
  getStats: async () => {
    initializeData();
    const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.customers));
    const interactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.interactions));
    const tickets = JSON.parse(localStorage.getItem(STORAGE_KEYS.tickets));
    
    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'Active').length,
      totalInteractions: interactions.length,
      openTickets: tickets.filter(t => t.status === 'Open').length,
      totalRevenue: customers.reduce((sum, c) => sum + c.value, 0),
      avgCustomerValue: customers.reduce((sum, c) => sum + c.value, 0) / customers.length
    };
  }
};