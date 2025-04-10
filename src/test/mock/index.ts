export const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword123',
    isVerified: true,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  export const mockWallet = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    user: mockUser,
    currency: 'NGN',
    balance: 1000
  };
  
  export const mockTransaction = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    type: 'FUNDING',
    status: 'SUCCESS',
    amount: 1000,
    currency: 'NGN',
    user: mockUser,
    createdAt: new Date()
  };
  
  export const mockFxRate = {
    id: '123e4567-e89b-12d3-a456-426614174003',
    base: 'USD',
    target: 'NGN',
    rate: 780.50,
    fetchedAt: new Date()
  };