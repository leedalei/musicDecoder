const fs = require("fs").promises
const path = require("path");
const { song_detail } = require("NeteaseCloudMusicApi");

const BAZINGA = 0xa3;
const BLOCK_SIZE = 256 * 1024;
const CACHE_EXT = ".uc";
const OUTPUT_EXT = ".mp3";

function decode(buffer) {
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] ^= BAZINGA;
  }
}

/**
 * 
 * @param {路径字符串} inputPath [F:\somefile\something.uc]
 * @param {输出文件夹路径} outputPath [默认和输入路径相同]
 */
async function decodeFile(inputPath, outputPath) {
  const stat = await fs.stat(inputPath);
  const buffer = Buffer.alloc(stat.size);
  const reader = await fs.open(inputPath, "r");
  for (let offset = 0; offset < stat.size; offset += BLOCK_SIZE) {
    const length = offset + BLOCK_SIZE > stat.size ? stat.size - offset : BLOCK_SIZE;
    await reader.read(buffer, offset, length);
  }
  await reader.close();
  decode(buffer);
  let arr = inputPath.split(/\\/);//通过\裁剪，最后一个部分即是fileName部分
  let originName = arr[arr.length - 1];
  const filename = await decodeInfo(originName) || originName;
  outputPath = outputPath || (inputPath.replace(originName, '') + filename + OUTPUT_EXT);
  const writer = await fs.open(outputPath, "w");
  await writer.write(buffer, 0, stat.size);
  await writer.close();
  return buffer;
}

/**
 * 
 * @param {缓存文件名}} filename [id-128-加密字串]
 */
async function decodeInfo(filename) {
  //观察缓存文件命名规则可知，歌曲id-128-加密字串，通过网易云的api传入歌曲id来获取歌曲信息，从而生成新的mp3文件
  const ids = filename.split("-");
  if (ids.length !== 3) return filename;
  try {
    const rsp = await song_detail({ ids: ids[0] });
    if (rsp.body.songs.length === 0) return filename;
    const song = rsp.body.songs[0];
    return song.name + "-" + song.ar.map((artist) => artist.name).join(",");
  } catch (err) {
    return filename;
  }
}

module.exports = {
  decode,
  decodeFile
};