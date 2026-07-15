import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { scenes } from "./script.js";

const V = new URL(".", import.meta.url).pathname;
const OUT = `${V}out/`;
const TMP = `${V}out/tmp/`;
mkdirSync(TMP, { recursive: true });

const durations = JSON.parse(readFileSync(`${V}assets/vo/durations.json`, "utf8"));
const sh = cmd => execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString();
const probe = f =>
  parseFloat(sh(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${f}"`));

const ENC =
  `-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 -video_track_timescale 15360 ` +
  `-c:a aac -ar 48000 -ac 2 -b:a 192k`;
const VF_APP = `scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,fps=30,format=yuv420p`;
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
      `-af "${AF_VO}" -t ${dur} ${ENC} -shortest "${seg}" 2>&1 | tail -1`,
    );
  } else {
    const framesDir = `${V}frames/${s.id}/`;
    const motion = (() => {
      const txt = readFileSync(`${framesDir}frames.txt`, "utf8");
      return [...txt.matchAll(/duration ([\d.]+)/g)].reduce((a, m) => a + parseFloat(m[1]), 0);
    })();
    const target = Math.max(motion, durations[s.id] + 0.7).toFixed(3);
    sh(
      `ffmpeg -y -f concat -safe 0 -i "${framesDir}frames.txt" -i "${vo}" ` +
      `-vf "${VF_APP},tpad=stop_mode=clone:stop_duration=6" -af "${AF_VO}" ` +
      `-t ${target} ${ENC} "${seg}" 2>&1 | tail -1`,
    );
  }
  const d = probe(seg);
  segs.push({ id: s.id, seg, d });
  console.log(`  seg ${s.id}: ${d.toFixed(2)}s`);
}

writeFileSync(`${TMP}concat.txt`, segs.map(x => `file 'seg_${x.id}.mp4'`).join("\n") + "\n");
sh(`cd "${TMP}" && ffmpeg -y -f concat -safe 0 -i concat.txt -c copy program.mp4 2>&1 | tail -1`);
const total = probe(`${TMP}program.mp4`);
console.log(`  program: ${total.toFixed(1)}s`);

// Music ducked under the program audio (VO), then loudnorm to -16 LUFS.
// Prefer the long bed; fall back to looping the 115s one (seam lands under ducked outro VO).
let music = `${V}assets/music-140.mp3`;
let musicLen = 0;
try { musicLen = probe(music); } catch {}
const musicInput = musicLen >= total - 6
  ? `-i "${music}"`
  : `-stream_loop -1 -i "${V}assets/music-test.mp3"`;
console.log(`  music: ${musicLen >= total - 6 ? "140s bed (apad tail)" : "looped 115s bed"}`);
sh(
  `ffmpeg -y -i "${TMP}program.mp4" ${musicInput} -filter_complex ` +
  `"[0:a]asplit=2[voM][voK];` +
  `[1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=duration=${total.toFixed(3)},apad=whole_dur=${total.toFixed(3)},volume=0.9[mus];` +
  `[mus][voK]sidechaincompress=threshold=0.02:ratio=12:attack=40:release=700:makeup=1[duck];` +
  `[voM][duck]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[out]" ` +
  `-map 0:v -map "[out]" -c:v copy -c:a aac -ar 48000 -b:a 192k "${OUT}demo-${Date.now()}.mp4" 2>&1 | tail -1`,
);
console.log("done:", sh(`ls -t ${OUT}demo-*.mp4 | head -1`).trim());
