const bcrypt = require('bcryptjs');
const User = require('../models/User');

class AuthService {
  /**
   * Create a new user
   * @param {Object} userData - User data object
   * @returns {Promise<Object>} Created user object
   */
  async createUser(userData) {
    try {
      const { firstName, lastName, email, password, company } = userData;

      // Create new user instance
      const user = new User({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        password,
        company: company ? company.trim() : undefined
      });

      // Save user to database (password will be hashed by pre-save middleware)
      const savedUser = await user.save();
      
      return savedUser;
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error
        throw new Error('User already exists with this email address');
      }
      throw error;
    }
  }

  /**
   * Validate user password
   * @param {string} candidatePassword - Password to validate
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} Password validation result
   */
  async validatePassword(candidatePassword, hashedPassword) {
    try {
      return await bcrypt.compare(candidatePassword, hashedPassword);
    } catch (error) {
      throw new Error('Password validation failed');
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  async findUserByEmail(email) {
    try {
      return await User.findByEmail(email);
    } catch (error) {
      throw new Error('Error finding user by email');
    }
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  async findUserById(userId) {
    try {
      return await User.findById(userId);
    } catch (error) {
      throw new Error('Error finding user by ID');
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user object
   */
  async updateUserProfile(userId, updateData) {
    try {
      const allowedUpdates = ['firstName', 'lastName', 'company', 'profilePicture'];
      const filteredData = {};

      // Filter only allowed fields
      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key) && updateData[key] !== undefined) {
          filteredData[key] = typeof updateData[key] === 'string' 
            ? updateData[key].trim() 
            : updateData[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        filteredData,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Validate current password
      const isCurrentPasswordValid = await this.validatePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deactivateUser(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const recentUsers = await User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });

      return {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        recentUsers
      };
    } catch (error) {
      throw new Error('Error fetching user statistics');
    }
  }
}

module.exports = new AuthService();
