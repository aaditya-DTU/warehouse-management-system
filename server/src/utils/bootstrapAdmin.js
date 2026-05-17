import bcrypt from "bcrypt";
import User from "../models/User.js";

const getBootstrapConfig = () => {
  const username = process.env.ADMIN_USERNAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!username || !email || !password) {
    return null;
  }

  return {
    username,
    email,
    password,
  };
};

const ensureAdminUser = async () => {
  const config = getBootstrapConfig();

  if (!config) {
    console.log("Admin bootstrap skipped: missing ADMIN_USERNAME, ADMIN_EMAIL, or ADMIN_PASSWORD.");
    return;
  }

  const existingUser = await User.findOne({
    $or: [{ username: config.username }, { email: config.email }],
  });

  const passwordHash = await bcrypt.hash(config.password, 10);

  if (!existingUser) {
    await User.create({
      username: config.username,
      email: config.email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
      isDeleted: false,
    });

    console.log(`Admin bootstrap completed: created ${config.username}.`);
    return;
  }

  existingUser.username = config.username;
  existingUser.email = config.email;
  existingUser.passwordHash = passwordHash;
  existingUser.role = "ADMIN";
  existingUser.isActive = true;
  existingUser.isDeleted = false;

  await existingUser.save();

  console.log(`Admin bootstrap completed: updated ${config.username}.`);
};

export default ensureAdminUser;
