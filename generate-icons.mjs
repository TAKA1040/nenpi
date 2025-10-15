import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';

// 出力先ディレクトリの作成
const publicDir = './public';
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// 元画像のパス
const inputImage = './Icons/nenpi.png';

// 生成するアイコンのサイズ定義
const iconSizes = [
  // ファビコン
  { width: 16, height: 16, name: 'favicon-16x16.png' },
  { width: 32, height: 32, name: 'favicon-32x32.png' },
  { width: 48, height: 48, name: 'favicon-48x48.png' },

  // PWA用（Android）
  { width: 192, height: 192, name: 'android-chrome-192x192.png' },
  { width: 512, height: 512, name: 'android-chrome-512x512.png' },

  // Apple Touch Icon（iOS）
  { width: 180, height: 180, name: 'apple-touch-icon.png' },

  // Windowsタイル
  { width: 144, height: 144, name: 'mstile-144x144.png' },
];

// OGP画像（SNSシェア用）- アスペクト比が異なるため別処理
const ogpImage = { width: 1200, height: 630, name: 'og-image.png' };

async function generateIcons() {
  console.log('🚀 アイコン生成を開始します...\n');

  try {
    // 通常のアイコン生成
    for (const size of iconSizes) {
      await sharp(inputImage)
        .resize(size.width, size.height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(`${publicDir}/${size.name}`);
      console.log(`✅ ${size.name} (${size.width}x${size.height})`);
    }

    // OGP画像生成（背景付き）
    await sharp(inputImage)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 250, b: 240, alpha: 1 } // クリーム色の背景
      })
      .extend({
        top: 59,
        bottom: 59,
        left: 344,
        right: 344,
        background: { r: 255, g: 250, b: 240, alpha: 1 }
      })
      .png()
      .toFile(`${publicDir}/${ogpImage.name}`);
    console.log(`✅ ${ogpImage.name} (${ogpImage.width}x${ogpImage.height}) - SNSシェア用`);

    // favicon.ico用に32x32を別途コピー
    await sharp(inputImage)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(`${publicDir}/favicon.ico`);
    console.log(`✅ favicon.ico (32x32) - ブラウザタブ用`);

    console.log('\n🎉 すべてのアイコンが生成されました！');
    console.log(`📁 出力先: ${publicDir}/`);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

generateIcons();
