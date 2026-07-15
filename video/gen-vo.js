import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { config } from "dotenv";
import { scenes } from "./script.js";

config({ path: new URL(".env.local", import.meta.url).pathname });

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error("ELEVENLABS_API_KEY missing");

const VOICE = "UgBBYS2sOqTuMpoF3BR0"; // "Conversations"
const OUT = new URL("assets/vo/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

async function tts(text, file) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_v3",
        voice_settings: { stability: 0.4, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
      }),
    },
  );
  if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

function seconds(file) {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`,
  );
  return parseFloat(out.toString().trim());
}

const only = process.argv[2]; // optional: generate one scene id (a smoke test)
let durations = {};
try {
  durations = JSON.parse(readFileSync(`${OUT}durations.json`, "utf8"));
} catch {}
for (const s of scenes) {
  if (only && s.id !== only) continue;
  const mp3 = `${OUT}${s.id}.mp3`;
  if (!existsSync(mp3) || only) {
    process.stdout.write(`  ${s.id}… `);
    await tts(s.vo, mp3);
    console.log("ok");
  }
  durations[s.id] = seconds(mp3);
}
writeFileSync(`${OUT}durations.json`, JSON.stringify(durations, null, 2));
console.log("durations:", durations);
