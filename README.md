# static-file-gzip
压缩当前目录下的所有文件（支持目录递归、指定压缩文件类型），并生成哈希指纹。<br>  
支持配置排除文件类型和保留原始文件。<br>  
适用于传统项目的静态文件压缩，提高加载速度。 依赖node执行环境。   <br> 
  sourceDir: 源文件目录<br>
  outputDir: 压缩后文件输出目录<br>
  compressExt: 压缩文件类型<br>
  excludeExt: 排除文件类型<br>
  keepOriginal: 是否保留源文件<br>
