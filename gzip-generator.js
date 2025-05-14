// 压缩当前目录下的所有文件（支持目录递归、指定压缩文件类型），并生成哈希指纹。
// 支持配置排除文件类型和保留原始文件。
// 适用于传统项目的静态文件压缩，提高加载速度。 依赖node执行环境。
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const crypto = require('crypto');

// 配置文件
const config = {
  sourceDir: './',
  outputDir: './dist',
  compressExt: ['.html', '.css', '.js'],
  excludeExt: ['.jpg', '.jpeg', '.png', '.gif'],
  keepOriginal: true
};

// 安全清空目录函数（完整保留）
const cleanOutputDir = () => {
  if (fs.existsSync(config.outputDir)) {
    // 增强型安全检查
    const protectedDirs = [
      process.cwd(),
      path.parse(process.cwd()).root, // 系统根目录
      path.join(process.cwd(), 'src')
    ].map(p => path.resolve(p));

    const targetDir = path.resolve(config.outputDir);
    if (protectedDirs.includes(targetDir)) {
      throw new Error(`危险操作：禁止删除保护目录 ${targetDir}`);
    }

    // 递归删除（带重试机制）
    fs.rmSync(config.outputDir, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100
    });
  }
  
  // 重建目录（带权限设置）
  fs.mkdirSync(config.outputDir, { 
    recursive: true,
    mode: 0o755 // 目录权限设置
  });
};

// 生成哈希指纹
const generateHash = (content) => {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
};

// 递归遍历目录（内存优化版）
const walkDir = (dir) => {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((files, dirent) => {
    const absPath = path.resolve(dir, dirent.name);
    return dirent.isDirectory() 
      ? files.concat(walkDir(absPath)) 
      : files.concat(absPath);
  }, []);
};

/****************** 主执行流程 ******************/
(async () => {
  try {
    // 阶段一：目录清理
    console.time('目录清理');
    cleanOutputDir();
    console.timeEnd('目录清理');

    // 阶段二：文件处理
    console.time('文件处理总耗时');
    
    const processFile = async (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const parsed = path.parse(filePath);
      
      // 生成目标路径
      const relativePath = path.relative(config.sourceDir, parsed.dir);
      const outputDir = path.join(config.outputDir, relativePath);
      
      // 前置创建目录（关键修复点）
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 排除文件处理
      if (config.excludeExt.includes(ext)) {
        const destPath = path.join(outputDir, parsed.base);
        fs.copyFileSync(filePath, destPath);
        return;
      }

      // 压缩文件处理
      if (config.compressExt.includes(ext)) {
        const content = fs.readFileSync(filePath);
        const hash = generateHash(content);
        const gzFileName = `${parsed.name}-${hash}${parsed.ext}.gz`;

        // 异步压缩封装
        await new Promise((resolve, reject) => {
          zlib.gzip(content, { level: 9 }, (err, compressed) => {
            if (err) return reject(err);
            
            fs.writeFile(
              path.join(outputDir, gzFileName), 
              compressed, 
              { flag: 'wx' }, // 防止覆盖已有文件
              (writeErr) => writeErr ? reject(writeErr) : resolve()
            );
          });
        });
      }

      // 保留原始文件
      if (config.keepOriginal) {
        const destPath = path.join(outputDir, parsed.base);
        fs.copyFileSync(filePath, destPath);
      }
    };

    // 并行处理文件（限制并发量）
    const files = walkDir(config.sourceDir);
    const concurrency = 10;
    for (let i = 0; i < files.length; i += concurrency) {
      await Promise.all(
        files.slice(i, i + concurrency).map(processFile)
      );
    }

    console.timeEnd('文件处理总耗时');
  } catch (error) {
    console.error('执行失败:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
})();
