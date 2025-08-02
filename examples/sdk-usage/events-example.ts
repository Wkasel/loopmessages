#!/usr/bin/env ts-node
/**
 * Events Example
 *
 * This example demonstrates how to create a custom service that extends
 * the EventService base class and how to listen for events.
 */
import { EventService } from '../../src/index.js';

// -----------------------------------------------------------------------------
// CUSTOM EVENTS DEMO
// -----------------------------------------------------------------------------

// Define event types for our custom service
enum UserEvents {
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
}

// Simple user interface
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

/**
 * Custom UserService that extends EventService
 * This demonstrates how to create your own services with event emitting capabilities
 */
class UserService extends EventService {
  private users: Map<string, User> = new Map();

  /**
   * Create a new UserService
   */
  constructor() {
    super();
    console.log('[UserService] Initialized');
  }

  /**
   * Create a new user
   */
  async createUser(name: string, email: string): Promise<User> {
    try {
      console.log(`[UserService] Creating user: ${name} (${email})`);

      const user: User = {
        id: this.generateId(),
        name,
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.users.set(user.id, user);

      // Emit user created event
      this.emit(UserEvents.USER_CREATED, {
        userId: user.id,
        name: user.name,
        email: user.email,
      });

      return user;
    } catch (error) {
      console.error('[UserService] Error creating user:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Update a user
   */
  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    try {
      console.log(`[UserService] Updating user ${id}`);

      const user = this.users.get(id);
      if (!user) {
        throw new Error(`User ${id} not found`);
      }

      const updatedUser: User = {
        ...user,
        ...updates,
        updatedAt: new Date(),
      };

      this.users.set(id, updatedUser);

      // Emit user updated event
      this.emit(UserEvents.USER_UPDATED, {
        userId: id,
        updates,
        previousData: user,
      });

      return updatedUser;
    } catch (error) {
      console.error('[UserService] Error updating user:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      console.log(`[UserService] Deleting user ${id}`);

      const user = this.users.get(id);
      if (!user) {
        throw new Error(`User ${id} not found`);
      }

      this.users.delete(id);

      // Emit user deleted event
      this.emit(UserEvents.USER_DELETED, {
        userId: id,
        deletedUser: user,
      });
    } catch (error) {
      console.error('[UserService] Error deleting user:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Record a user login
   */
  async recordLogin(id: string): Promise<void> {
    try {
      console.log(`[UserService] Recording login for user ${id}`);

      const user = this.users.get(id);
      if (!user) {
        throw new Error(`User ${id} not found`);
      }

      user.lastLogin = new Date();

      // Emit login event
      this.emit(UserEvents.USER_LOGIN, {
        userId: id,
        timestamp: user.lastLogin,
      });
    } catch (error) {
      console.error('[UserService] Error recording login:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Record a user logout
   */
  async recordLogout(id: string): Promise<void> {
    console.log(`[UserService] Recording logout for user ${id}`);

    // Emit logout event
    this.emit(UserEvents.USER_LOGOUT, {
      userId: id,
      timestamp: new Date(),
    });
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * Generate a simple ID for demo purposes
   */
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// -----------------------------------------------------------------------------
// DEMO: USING THE EVENT-DRIVEN SERVICE
// -----------------------------------------------------------------------------

async function runDemo() {
  console.log('\n=== Event Service Demo ===\n');

  // Create a new UserService instance
  const userService = new UserService();

  // Register event listeners
  userService.on(UserEvents.USER_CREATED, data => {
    console.log(`✨ Event: User created - ${data.name} (${data.email})`);
  });

  userService.on(UserEvents.USER_UPDATED, data => {
    console.log(`📝 Event: User ${data.userId} updated:`, data.updates);
  });

  userService.on(UserEvents.USER_DELETED, data => {
    console.log(`🗑️  Event: User ${data.userId} deleted`);
  });

  userService.on(UserEvents.USER_LOGIN, data => {
    console.log(`🔐 Event: User ${data.userId} logged in at ${data.timestamp}`);
  });

  userService.on(UserEvents.USER_LOGOUT, data => {
    console.log(`🚪 Event: User ${data.userId} logged out at ${data.timestamp}`);
  });

  userService.on('error', error => {
    console.error(`❌ Event: Error occurred -`, error.message);
  });

  try {
    // Create a user
    console.log('\n--- Creating user ---');
    const user1 = await userService.createUser('John Doe', 'john@example.com');
    console.log('User created:', user1);

    // Update the user
    console.log('\n--- Updating user ---');
    await userService.updateUser(user1.id, { name: 'John Smith' });

    // Record login
    console.log('\n--- Recording login ---');
    await userService.recordLogin(user1.id);

    // Create another user
    console.log('\n--- Creating another user ---');
    const user2 = await userService.createUser('Jane Doe', 'jane@example.com');

    // List all users
    console.log('\n--- All users ---');
    const allUsers = userService.getAllUsers();
    console.log(`Total users: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`);
    });

    // Record logout
    console.log('\n--- Recording logout ---');
    await userService.recordLogout(user1.id);

    // Delete a user
    console.log('\n--- Deleting user ---');
    await userService.deleteUser(user2.id);

    // Try to update non-existent user (will trigger error event)
    console.log('\n--- Triggering error ---');
    await userService.updateUser('non_existent_id', { name: 'Ghost' });
  } catch (error) {
    console.log('Expected error caught:', (error as Error).message);
  }

  console.log('\n=== Demo Complete ===\n');
}

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}

export { UserService, UserEvents };
