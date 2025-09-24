const fs = require("fs").promises;
const path = require("path");
const bcrypt = require("bcryptjs");

const USERS_FILE = path.join(__dirname, "../data/users.json");

class FileUser {
  constructor(data) {
    this.id = data.id || Date.now().toString();
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.avatar = data.avatar || "";
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  async save() {
    try {
      // Hash password if it's not already hashed
      if (this.password && !this.password.startsWith("$2a$")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }

      const users = await FileUser.getAllUsers();
      const existingIndex = users.findIndex((u) => u.id === this.id);

      if (existingIndex >= 0) {
        users[existingIndex] = this;
      } else {
        users.push(this);
      }

      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      return this;
    } catch (error) {
      throw error;
    }
  }

  static async getAllUsers() {
    try {
      const data = await fs.readFile(USERS_FILE, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
        return [];
      }
      throw error;
    }
  }

  static async findOne(query) {
    try {
      const users = await FileUser.getAllUsers();

      if (query.$or) {
        return users.find((user) =>
          query.$or.some((condition) => {
            return Object.keys(condition).every(
              (key) => user[key] === condition[key]
            );
          })
        );
      }

      return users.find((user) =>
        Object.keys(query).every((key) => user[key] === query[key])
      );
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const users = await FileUser.getAllUsers();
      return users.find((user) => user.id === id);
    } catch (error) {
      throw error;
    }
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

module.exports = FileUser;
