#!/usr/bin/env ts-node
/**
 * Events Example
 *
 * This example demonstrates how to create a custom service that extends
 * the EventService base class and how to listen for events.
 */
import { EventService } from '../src/index.js';
import type { LogLevel } from '../src/index.js';

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
  constructor(logLevel: LogLevel = 'info') {
    // Initialize the EventService with the log level
    super(logLevel);
    this.logger.debug('UserService initialized');
  }

  /**
   * Create a new user
   */
  createUser(name: string, email: string): User {
    // Generate a simple ID
    const id = Math.random().toString(36).substring(2, 11);

    const now = new Date();
    const user: User = {
      id,
      name,
      email,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, user);
    this.logger.info(`User created: ${name} (${id})`);

    // Emit the event with event data
    this.emitEvent(UserEvents.USER_CREATED, { user });

    return user;
  }

  /**
   * Update a user
   */
  updateUser(id: string, data: Partial<User>): User | null {
    const user = this.users.get(id);

    if (!user) {
      const error = new Error(`User not found: ${id}`);
      this.emitError(error);
      return null;
    }

    // Update user data
    const updatedUser = {
      ...user,
      ...data,
      id, // Ensure ID doesn't change
      createdAt: user.createdAt, // Ensure creation date doesn't change
      updatedAt: new Date(), // Update the updatedAt timestamp
    };

    this.users.set(id, updatedUser);
    this.logger.info(`User updated: ${updatedUser.name} (${id})`);

    // Emit the event with old and new data
    this.emitEvent(UserEvents.USER_UPDATED, {
      previousUser: user,
      updatedUser,
    });

    return updatedUser;
  }

  /**
   * Delete a user
   */
  deleteUser(id: string): boolean {
    const user = this.users.get(id);

    if (!user) {
      const error = new Error(`User not found: ${id}`);
      this.emitError(error);
      return false;
    }

    this.users.delete(id);
    this.logger.info(`User deleted: ${user.name} (${id})`);

    // Emit the event with deleted user data
    this.emitEvent(UserEvents.USER_DELETED, { user });

    return true;
  }

  /**
   * Record a user login
   */
  loginUser(id: string): User | null {
    const user = this.users.get(id);

    if (!user) {
      const error = new Error(`User not found: ${id}`);
      this.emitError(error);
      return null;
    }

    const updatedUser = {
      ...user,
      lastLogin: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    this.logger.info(`User logged in: ${user.name} (${id})`);

    // Emit the event with user data
    this.emitEvent(UserEvents.USER_LOGIN, { user: updatedUser });

    return updatedUser;
  }

  /**
   * Record a user logout
   */
  logoutUser(id: string): User | null {
    const user = this.users.get(id);

    if (!user) {
      const error = new Error(`User not found: ${id}`);
      this.emitError(error);
      return null;
    }

    this.logger.info(`User logged out: ${user.name} (${id})`);

    // Emit the event with user data
    this.emitEvent(UserEvents.USER_LOGOUT, { user });

    return user;
  }

  /**
   * Get a user by ID
   */
  getUser(id: string): User | null {
    return this.users.get(id) || null;
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}

// -----------------------------------------------------------------------------
// DEMO APPLICATION
// -----------------------------------------------------------------------------

async function main() {
  console.log('EVENT·SERVICE·EXAMPLE');
  console.log('=====================');

  // Create a new user service - we'll set it to debug level to see all the log messages
  const userService = new UserService('debug');

  // Set up event listeners
  console.log('\n=== Setting Up Event Listeners ===');

  userService.on(UserEvents.USER_CREATED, data => {
    console.log(`🎉 New user created: ${data.user.name} (${data.user.id})`);
  });

  userService.on(UserEvents.USER_UPDATED, data => {
    console.log(`📝 User updated: ${data.updatedUser.name} (${data.updatedUser.id})`);
    console.log(`   Previous name: ${data.previousUser.name}`);
    console.log(`   New name: ${data.updatedUser.name}`);
  });

  userService.on(UserEvents.USER_DELETED, data => {
    console.log(`🗑️ User deleted: ${data.user.name} (${data.user.id})`);
  });

  userService.on(UserEvents.USER_LOGIN, data => {
    console.log(`🔑 User logged in: ${data.user.name} at ${data.user.lastLogin?.toLocaleString()}`);
  });

  userService.on(UserEvents.USER_LOGOUT, data => {
    console.log(`🚪 User logged out: ${data.user.name}`);
  });

  userService.on('error', error => {
    console.error(`❌ Error in UserService: ${error.message}`);
  });

  // Perform some operations that will trigger events
  console.log('\n=== Performing User Operations ===');

  // Create users
  const alice = userService.createUser('Alice Smith', 'alice@example.com');
  const bob = userService.createUser('Bob Johnson', 'bob@example.com');

  // Pause briefly to demonstrate async nature of events
  await new Promise(resolve => setTimeout(resolve, 500));

  // Update a user
  userService.updateUser(alice.id, { name: 'Alice Williams' });

  await new Promise(resolve => setTimeout(resolve, 500));

  // Login and logout
  userService.loginUser(bob.id);

  await new Promise(resolve => setTimeout(resolve, 500));

  userService.logoutUser(bob.id);

  await new Promise(resolve => setTimeout(resolve, 500));

  // Try operations with errors
  console.log('\n=== Testing Error Handling ===');
  userService.updateUser('non-existent-id', { name: 'This will fail' });

  await new Promise(resolve => setTimeout(resolve, 500));

  // Delete a user
  userService.deleteUser(alice.id);

  console.log('\n=== All Users ===');
  console.log(userService.getAllUsers());

  console.log('\n=== Example Completed ===');
}

// Run the demo
main().catch(error => {
  console.error('Unexpected error:', error);
});
