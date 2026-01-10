
import fs from 'fs';
import path from 'path';
import https from 'https';

const list = JSON.parse(fs.readFileSync(new URL('./images.json', import.meta.url)));

function fetchToFile(url, outPath){
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const file = fs.createWriteStream(outPath);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(resolve); });
    }).on('error', reject);
  });
}

(async () => {
  for (const item of list){
    try {
      console.log('Downloading', item.url, '->', item.path);
      await fetchToFile(item.url, item.path);
    } catch (e) {
      console.error('Image download failed:', item.url, e.message);
    }
  }
})();
