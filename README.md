# static-file-gzip
压缩当前目录下的所有文件（支持目录递归、指定压缩文件类型），并生成哈希指纹。
支持配置排除文件类型和保留原始文件。
适用于传统项目的静态文件压缩，提高加载速度。 依赖node执行环境。
  sourceDir: 源文件目录
  outputDir: 压缩后文件输出目录
  compressExt: 压缩文件类型
  excludeExt: 排除文件类型
  keepOriginal: 是否保留源文件
