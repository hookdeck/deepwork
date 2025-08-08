#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import crypto from "crypto";
import {
  ensureHookdeckConnections,
  updateWebhookSource,
} from "../src/lib/hookdeck/initialize";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer));
  });
};

// Helper function to replace environment variables using regex
function replaceEnvVar(content: string, varName: string, value: string) {
  const regex = new RegExp(`(${varName}=).*$`, "gm");
  return content.replace(regex, `$1${value}`);
}

async function main() {
  console.log("🚀 DeepWork Development Setup\n");
  console.log(
    "This script will help you set up your environment for local development.\n"
  );
  console.log("Requirements:");
  console.log("- A Hookdeck account (https://hookdeck.com)");
  console.log("- An OpenAI API account (https://platform.openai.com)");
  console.log(
    "- Demo authentication uses simple username/password (default: demo/password)\n"
  );

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), ".env.local");
  const envExamplePath = path.join(process.cwd(), ".env.local.example");

  let envContent = "";

  if (fs.existsSync(envPath)) {
    const overwrite = await question(
      ".env.local already exists. Overwrite? (y/N): "
    );
    if (overwrite.toLowerCase() !== "y") {
      console.log("Setup cancelled.");
      process.exit(0);
    }
  }

  // Copy from example if it exists
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, "utf8");
  }

  console.log("\n📝 Environment Configuration\n");

  // NextAuth configuration
  const nextAuthSecret = crypto.randomBytes(32).toString("base64");
  envContent = replaceEnvVar(envContent, "NEXTAUTH_SECRET", nextAuthSecret);
  const appUrl =
    (await question("Enter your App URL (default: http://localhost:3000): ")) ||
    "http://localhost:3000";
  envContent = replaceEnvVar(envContent, "APP_URL", appUrl);
  console.log("✅ Generated NEXTAUTH_SECRET");

  // Ask for API keys
  console.log("\n🔑 API Keys Configuration\n");

  // Demo Authentication
  console.log("🔐 Demo Authentication Setup\n");
  const customAuth = await question(
    "Use custom demo credentials? (y/N - default: demo/password): "
  );

  let demoUsername = "demo";
  let demoPassword = "password";
  if (customAuth.toLowerCase() === "y") {
    demoUsername =
      (await question("Enter demo username (default: demo): ")) || "demo";
    demoPassword =
      (await question("Enter demo password (default: password): ")) ||
      "password";
    envContent = replaceEnvVar(envContent, "DEMO_USERNAME", demoUsername);
    envContent = replaceEnvVar(envContent, "DEMO_PASSWORD", demoPassword);
    console.log("✅ Configured custom demo credentials");
  } else {
    console.log("✅ Using default demo credentials (demo/password)");
  }

  // Hookdeck (REQUIRED)
  console.log("\n🪝 Hookdeck Configuration (REQUIRED)\n");
  console.log(
    "You need a Hookdeck account to handle webhook queuing and routing."
  );
  console.log("Sign up at: https://hookdeck.com\n");
  console.log(
    "Project credentials available at: https://dashboard.hookdeck.com/settings/project/secrets\n"
  );

  const hookdeckApiKey = await question("Enter your Hookdeck API key: ");
  if (!hookdeckApiKey.trim()) {
    console.error("❌ Hookdeck API key is required for local development");
    process.exit(1);
  }

  const hookdeckSigningSecret = await question(
    "Enter your Hookdeck signing secret: "
  );
  if (!hookdeckSigningSecret.trim()) {
    console.error(
      "❌ Hookdeck signing secret is required for webhook verification"
    );
    process.exit(1);
  }

  envContent = replaceEnvVar(envContent, "HOOKDECK_API_KEY", hookdeckApiKey);
  envContent = replaceEnvVar(
    envContent,
    "HOOKDECK_SIGNING_SECRET",
    hookdeckSigningSecret
  );

  console.log("✅ Configured Hookdeck credentials");

  // OpenAI (REQUIRED)
  console.log("\n🤖 OpenAI Configuration (REQUIRED)\n");
  console.log(
    "You need an OpenAI API key with access to the Deep Research API."
  );
  console.log("Get your API key at: https://platform.openai.com/api-keys\n");

  const openaiApiKey = await question("Enter your OpenAI API key: ");
  if (!openaiApiKey.trim()) {
    console.error("❌ OpenAI API key is required for research functionality");
    process.exit(1);
  }

  envContent = replaceEnvVar(envContent, "OPENAI_API_KEY", openaiApiKey);
  console.log("✅ Configured OpenAI API key");

  // Debug mode
  console.log("\n🐛 Debug Configuration\n");
  const enableDebug = await question("Enable debug mode? (y/N): ");
  if (enableDebug.toLowerCase() === "y") {
    envContent = replaceEnvVar(envContent, "DEBUG", "true");
    envContent = replaceEnvVar(envContent, "LOG_LEVEL", "debug");
    console.log("✅ Enabled debug mode");
  }

  // Write the file
  fs.writeFileSync(envPath, envContent);
  console.log("\n✅ Environment file created at .env.local");

  // Initialize Hookdeck connections
  console.log("\n2. Initializing Hookdeck connections...");
  const connections = await ensureHookdeckConnections(
    hookdeckApiKey,
    openaiApiKey,
    appUrl
  );
  console.log("✅ Hookdeck connections initialized");
  console.log("   - Queue URL:", connections.queue.sourceUrl);
  console.log("   - Webhook Source URL:", connections.webhook.sourceUrl);

  console.log("\n3. Create OpenAI webhook:");
  console.log(
    "   - Go to https://platform.openai.com/settings/project/webhooks"
  );
  console.log('   - Click "Create webhook"');
  console.log(`   - For the "URL", use: ${connections.webhook.sourceUrl}`);
  console.log('   - For the "Events", select all "response.*" events.');

  const openaiWebhookSecret = await question(
    "\nEnter your OpenAI webhook signing secret: "
  );
  if (!openaiWebhookSecret.trim()) {
    console.error("❌ OpenAI webhook secret is required");
    process.exit(1);
  }

  console.log("\n4. Update Hookdeck source with OpenAI webhook secret...");
  await updateWebhookSource(
    connections.webhook.sourceId,
    openaiWebhookSecret.trim(),
    hookdeckApiKey
  );
  console.log("✅ Hookdeck source updated");

  console.log("\n📋 Next Steps:\n");
  console.log("1. Start the development server in a separate terminal:");
  console.log("   npm run dev\n");

  console.log("2. Start webhook forwarding in a separate terminal:");
  console.log("   npm run hookdeck:listen\n");

  console.log("3. Visit http://localhost:3000");
  console.log(
    `4. Login with demo credentials (username: ${demoUsername}, password: ${demoPassword})`
  );
  console.log("5. Submit a research topic to test the end-to-end flow.\n");

  console.log("For detailed instructions, see DEVELOPMENT.md");

  rl.close();
}

main().catch(console.error);
