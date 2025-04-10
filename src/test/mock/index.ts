import { TransactionType, TransactionStatus } from '../../transactions/transaction.entity';
import { Role } from '../../common/enums/role.enum';

export const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword123',
    isVerified: true,
    role: Role.USER,
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
    type: TransactionType.FUNDING,
    status: TransactionStatus.SUCCESS,
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

export const mockTradeWallets = {
    USD: {
        id: '123e4567-e89b-12d3-a456-426614174004',
        user: mockUser,
        currency: 'USD',
        balance: 1000000
    },
    NGN: {
        id: '123e4567-e89b-12d3-a456-426614174005',
        user: mockUser,
        currency: 'NGN',
        balance: 200000
    }
};