/**
 * Config loader: .env (if present), then process.env, then optional config.json overrides.
 * All parameters for target user, channel, message, send count, delay, and cooldown.
 */

const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (_) {
  // dotenv optional
}

const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadConfig() {
  const env = { ...process.env };

  let fileConfig = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
      console.error('[config] Failed to parse config.json:', e.message);
    }
  }

  const raw = {
    DISCORD_BOT_TOKEN: env.DISCORD_BOT_TOKEN ?? fileConfig.DISCORD_BOT_TOKEN,
    GUILD_ID: env.GUILD_ID ?? fileConfig.GUILD_ID ?? null,
    TARGET_USER_ID: env.TARGET_USER_ID ?? fileConfig.TARGET_USER_ID ?? null,
    TARGET_USERNAME: env.TARGET_USERNAME ?? fileConfig.TARGET_USERNAME ?? null,
    TARGET_CHANNEL_ID: env.TARGET_CHANNEL_ID ?? fileConfig.TARGET_CHANNEL_ID,
    MESSAGE_TEXT: env.MESSAGE_TEXT ?? fileConfig.MESSAGE_TEXT ?? '',
    SEND_COUNT: env.SEND_COUNT ?? fileConfig.SEND_COUNT ?? 1,
    DELAY_MS: env.DELAY_MS ?? fileConfig.DELAY_MS ?? 1000,
    COOLDOWN_SECONDS: env.COOLDOWN_SECONDS ?? fileConfig.COOLDOWN_SECONDS ?? 60,
  };

  const config = {
    token: raw.DISCORD_BOT_TOKEN?.trim() || null,
    guildId: raw.GUILD_ID?.trim() || null,
    targetUserId: raw.TARGET_USER_ID?.trim() || null,
    targetUsername: raw.TARGET_USERNAME?.trim() || null,
    targetChannelId: raw.TARGET_CHANNEL_ID?.trim() || null,
    messageText: typeof raw.MESSAGE_TEXT === 'string' ? raw.MESSAGE_TEXT : String(raw.MESSAGE_TEXT ?? ''),
    sendCount: Math.max(1, parseInt(raw.SEND_COUNT, 10) || 1),
    delayMs: Math.max(0, parseInt(raw.DELAY_MS, 10) || 1000),
    cooldownSeconds: Math.max(0, parseInt(raw.COOLDOWN_SECONDS, 10) || 60),
  };

  return config;
}

function validateConfig(config) {
  const errors = [];
  if (!config.token) errors.push('DISCORD_BOT_TOKEN is required');
  if (!config.targetChannelId) errors.push('TARGET_CHANNEL_ID is required');
  if (!config.targetUserId && !config.targetUsername) {
    errors.push('At least one of TARGET_USER_ID or TARGET_USERNAME is required');
  }
  if (config.messageText.length === 0) errors.push('MESSAGE_TEXT cannot be empty');
  return errors;
}

module.exports = { loadConfig, validateConfig, CONFIG_PATH };
