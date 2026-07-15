import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { scenes } from "./script.js";

const V = new URL(".", import.meta.url).pathname;
const OUT = `${V}out/`;
const TMP = `${V}out/tmp/`;
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const durations = JSON.parse(readFileSync(`${V}assets/vo/durations.json`, "utf8"));

// Failures must never be swallowed: no shell pipes; capture and rethrow with context.
function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString();
  } catch (e) {
    const err = (e.stderr ?? Buffer.from("")).toString().split("\n").filter(Boolean).slice(-4).join("\n");
    throw new Error(`command failed:\n${cmd}\n--- last stderr ---\n${err}`);
  }
}
const probe = f =>
  parseFloat(sh(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${f}"`));

const ENC =
  `-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 -video_track_timescale 15360 ` +
  `-c:a aac -ar 48000 -ac 2 -b:a 192k`;
const VF_APP = `scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,fps=30,format=yuv420p,tpad=stop_mode=clone:stop_duration=8`;
const AF_VO = `adelay=300|300,aresample=48000,aformat=channel_layouts=stereo,apad`;

const segs = [];
for (const s of scenes) {
  const vo = `${V}assets/vo/${s.id}.mp3`;
  const seg = `${TMP}seg_${s.id}.mp4`;

  if (s.kind === "card") {
    const dur = (durations[s.id] + 1.4).toFixed(3);
    const fadeOut = (durations[s.id] + 1.4 - 0.5).toFixed(3);
    sh(
      `ffmpeg -y -loop 1 -framerate 30 -t ${dur} -i "${V}assets/cards/${s.card}.png" -i "${vo}" ` +
      `-vf "scale=1920:1080,format=yuv420p,fade=t=in:st=0:d=0.5,fade=t=out:st=${fadeOut}:d=0.5" ` +
      `-af "${AF_VO}" -t ${dur} ${ENC} -shortest "${seg}"`,
    );
  } else {
    const framesDir = `${V}frames/${s.id}/`;
    const overlay = `${V}assets/captions/${s.id}.png`;
    if (!existsSync(overlay)) throw new Error(`missing caption overlay for ${s.id}`);
    const motion = [...readFileSync(`${framesDir}frames.txt`, "utf8").matchAll(/duration ([\d.]+)/g)]
      .reduce((a, m) => a + parseFloat(m[1]), 0);
    const target = Math.max(motion, durations[s.id] + 0.7).toFixed(3);
    sh(
      `ffmpeg -y -f concat -safe 0 -i "${framesDir}frames.txt" -i "${vo}" -i "${overlay}" ` +
      `-filter_complex "[0:v]${VF_APP}[base];[base][2:v]overlay=0:0:format=auto[v]" ` +
      `-map "[v]" -map 1:a -af "${AF_VO}" -t ${target} ${ENC} "${seg}"`,
    );
  }
  const d = probe(seg);
  const need = s.kind === "card" ? durations[s.id] + 1.3 : durations[s.id] + 0.6;
  if (d < need) throw new Error(`seg ${s.id} is ${d}s but VO needs ${need}s — refusing to ship cut narration`);
  segs.push({ id: s.id, d });
  console.log(`  seg ${s.id}: ${d.toFixed(2)}s`);
}

writeFileSync(`${TMP}concat.txt`, segs.map(x => `file 'seg_${x.id}.mp4'`).join("\n") + "\n");
sh(`cd "${TMP}" && ffmpeg -y -f concat -safe 0 -i concat.txt -c copy program.mp4`);
const total = probe(`${TMP}program.mp4`);
console.log(`  program: ${total.toFixed(1)}s`);

let music = `${V}assets/music-170.mp3`;
let musicLen = 0;
try { musicLen = probe(music); } catch {}
if (musicLen < total - 6) {
  music = `${V}assets/music-140.mp3`;
  try { musicLen = probe(music); } catch { musicLen = 0; }
}
const musicInput = musicLen >= total - 6 ? `-i "${music}"` : `-stream_loop -1 -i "${V}assets/music-test.mp3"`;
console.log(`  music: ${musicLen >= total - 6 ? `${Math.round(musicLen)}s bed` : "looped 115s bed"}`);

const out = `${OUT}demo-${Date.now()}.mp4`;
sh(
  `ffmpeg -y -i "${TMP}program.mp4" ${musicInput} -filter_complex ` +
  `"[0:a]asplit=2[voM][voK];` +
  `[1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=duration=${total.toFixed(3)},apad=whole_dur=${total.toFixed(3)},volume=0.9[mus];` +
  `[mus][voK]sidechaincompress=threshold=0.02:ratio=12:attack=40:release=700:makeup=1[duck];` +
  `[voM][duck]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[out]" ` +
  `-map 0:v -map "[out]" -c:v copy -c:a aac -ar 48000 -b:a 192k "${out}"`,
);
console.log("done:", out);
