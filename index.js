/**
 * SteveBuzz Discord Bot
 * Listens for voice channel join (voiceStateUpdate): when a member — lama atau baru —
 * yang cocok TARGET_USER_ID/TARGET_USERNAME masuk ke voice channel (atau voice channel tertentu),
 * bot mengirim MESSAGE_TEXT ke TARGET_CHANNEL_ID (channel teks) sebanyak SEND_COUNT kali.
 * Cooldown mencegah trigger berulang untuk user yang sama dalam COOLDOWN_SECONDS.
 */

const { Client, GatewayIntentBits } = require('discord.js');
const { loadConfig, validateConfig } = require('./config.js');

// --- Config & validation ---
const config = loadConfig();
const validationErrors = validateConfig(config);
if (validationErrors.length > 0) {
  console.error('[startup] Configuration errors:', validationErrors.join('; '));
  process.exit(1);
}

// Debug: tampilkan config yang terbaca (tanpa token) — bantu cek env di Railway/local
console.log('[startup] Config loaded: TARGET_CHANNEL_ID=' + (config.targetChannelId ? config.targetChannelId : '(empty)') +
  ', TARGET_VOICE_CHANNEL_ID=' + (config.targetVoiceChannelId || '(any)') +
  ', TARGET_USER_ID=' + (config.targetUserId || '(empty)') +
  ', TARGET_USERNAME=' + (config.targetUsername || '(empty)') +
  ', MESSAGE_TEXT length=' + config.messageText.length +
  ', token present=' + !!config.token);

// --- Cooldown: userId -> last trigger timestamp (ms) ---
const cooldownUntilByUser = new Map();
const COOLDOWN_MS = config.cooldownSeconds * 1000;

function isOnCooldown(userId) {
  const until = cooldownUntilByUser.get(userId);
  if (!until) return false;
  if (Date.now() >= until) {
    cooldownUntilByUser.delete(userId);
    return false;
  }
  return true;
}

function setCooldown(userId) {
  cooldownUntilByUser.set(userId, Date.now() + COOLDOWN_MS);
}

function matchesTarget(member) {
  const id = member.user?.id;
  const username = member.user?.username ?? '';

  if (config.targetUserId && id === config.targetUserId) return true;
  if (config.targetUsername && username.toLowerCase() === config.targetUsername.toLowerCase()) return true;
  return false;
}

/**
 * Sends the same message to channel `count` times with `delayMs` between sends.
 * Handles rate limits (429): waits for retry_after then continues.
 * Logs each send and errors; does not throw.
 */
async function sendNMessagesWithDelay(channel, content, count, delayMs) {
  const channelId = channel?.id ?? 'unknown';
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < count; i++) {
    try {
      await channel.send(content);
      sent++;
      console.log(`[send] Channel ${channelId} message ${i + 1}/${count} sent.`);
    } catch (err) {
      failed++;
      if (err.code === 50013) {
        console.error(`[send] Missing permission in channel ${channelId}:`, err.message);
        break;
      }
      if (err.code === 10003) {
        console.error(`[send] Channel ${channelId} not found.`);
        break;
      }
      if (err.code === 50001) {
        console.error(`[send] Cannot access channel ${channelId} (VIEW_CHANNEL).`);
        break;
      }
      if (err.code === 429) {
        const retryAfter = (err.retryAfter ?? 1) * 1000;
        console.warn(`[send] Rate limited; waiting ${retryAfter}ms then retrying...`);
        await sleep(retryAfter);
        try {
          await channel.send(content);
          sent++;
        } catch (retryErr) {
          console.error(`[send] Retry failed:`, retryErr.message);
          failed++;
        }
      } else {
        console.error(`[send] Error sending to ${channelId}:`, err.code, err.message);
      }
    }

    if (i < count - 1 && delayMs > 0) await sleep(delayMs);
  }

  return { sent, failed };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Discord client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once('ready', () => {
  console.log(`[ready] Logged in as ${client.user.tag}`);
  if (config.guildId) {
    const guild = client.guilds.cache.get(config.guildId);
    console.log(`[ready] Guild filter: ${config.guildId} ${guild ? `(${guild.name})` : '(not in cache)'}`);
  }
  console.log(`[ready] Trigger: user joins voice channel${config.targetVoiceChannelId ? ` (channel ${config.targetVoiceChannelId})` : ' (any)'} → send to text channel ${config.targetChannelId}, count=${config.sendCount}, delay=${config.delayMs}ms, cooldown=${config.cooldownSeconds}s`);
});

// Trigger: member (lama atau baru) masuk ke voice channel
client.on('voiceStateUpdate', async (oldState, newState) => {
  // Hanya saat user *masuk* ke suatu voice channel (bukan pindah/keluar)
  if (!newState.channelId) return; // keluar dari voice
  if (oldState.channelId === newState.channelId) return; // tidak ada perubahan channel

  const member = newState.member;
  if (!member?.user) return;

  const guildId = newState.guild?.id;
  const userId = member.user.id;
  const username = member.user.username ?? 'unknown';

  if (config.guildId && guildId !== config.guildId) return;

  // Opsional: hanya trigger kalau masuk ke voice channel tertentu
  if (config.targetVoiceChannelId && newState.channelId !== config.targetVoiceChannelId) return;

  if (!matchesTarget(member)) return;

  console.log(`[trigger] Matched voice join: ${username} (${userId}) joined voice channel ${newState.channelId} in guild ${guildId}`);

  if (isOnCooldown(userId)) {
    console.log(`[trigger] User ${userId} on cooldown; skipping.`);
    return;
  }

  setCooldown(userId);

  const channel = await client.channels.fetch(config.targetChannelId).catch((err) => {
    console.error(`[trigger] Failed to fetch channel ${config.targetChannelId}:`, err.message);
    return null;
  });

  if (!channel) {
    console.error(`[trigger] Channel ${config.targetChannelId} not found or not accessible.`);
    return;
  }

  const permissions = channel.permissionsFor(client.user);
  if (!permissions?.has('ViewChannel') || !permissions?.has('SendMessages')) {
    console.error(`[trigger] Bot lacks VIEW_CHANNEL or SEND_MESSAGES in channel ${config.targetChannelId}.`);
    return;
  }

  const { sent, failed } = await sendNMessagesWithDelay(
    channel,
    config.messageText,
    config.sendCount,
    config.delayMs
  );

  console.log(`[trigger] Done. Sent: ${sent}, failed: ${failed} for user ${userId}.`);
});

client.login(config.token).catch((err) => {
  console.error('[startup] Login failed:', err.message);
  process.exit(1);
});
