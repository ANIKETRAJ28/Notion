import { describe, expect, it, vi } from 'vitest';

describe('Mock functions', () => {
  it('should return mocked data', () => {
    const findUser = vi.fn();

    findUser.mockReturnValue({
      id: 'user-123',
      name: 'Test User',
    });

    const result = findUser();

    expect(result).toEqual({
      id: 'user-123',
      name: 'Test User',
    });

    expect(findUser).toHaveBeenCalled();
  });

  it('should return a resolved promise', async () => {
    const findUser = vi.fn();

    findUser.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });

    const result = await findUser();

    expect(result.email).toBe('test@example.com');
  });
});
