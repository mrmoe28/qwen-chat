import { hash } from "bcryptjs";
import { prisma } from "../lib/prisma.js";

async function createAdminUser() {
  const email = process.env.ADMIN_EMAIL || "admin@ledgerflow.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Admin User";

  console.log(`Creating admin user with email: ${email}`);

  try {
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user to be admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          isAdmin: true,
          passwordHash: await hash(password, 12),
        },
      });
      console.log(`✅ Updated existing user ${email} to admin status`);
      return updatedUser;
    }

    // Create new admin user
    const hashedPassword = await hash(password, 12);
    
    const adminUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        isAdmin: true,
        subscriptionStatus: "active", // Give admin full access
      },
    });

    // Create a workspace for the admin
    const workspace = await prisma.workspace.create({
      data: {
        name: "Admin Workspace",
        slug: `admin-workspace-${Date.now()}`,
        companyName: "Ledgerflow Admin",
        companyEmail: email,
      },
    });

    // Create membership
    await prisma.membership.create({
      data: {
        userId: adminUser.id,
        workspaceId: workspace.id,
        role: "OWNER",
      },
    });

    // Set default workspace
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { defaultWorkspaceId: workspace.id },
    });

    console.log(`✅ Created admin user: ${email}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🏢 Workspace: ${workspace.name}`);
    console.log(`\nThe admin user can sign in at /admin with full platform access.`);

    return adminUser;
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
}

createAdminUser()
  .then(() => {
    console.log("\n🎉 Admin user setup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to create admin user:", error);
    process.exit(1);
  });