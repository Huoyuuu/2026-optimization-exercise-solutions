#!/usr/bin/env bash
# ==============================================================================
# LaTeX 自动化编译脚本
# 默认使用 xelatex (支持 ctex 中文排版)。编译各章目录（第X章-*/）下的 .tex / .latex，
# PDF 输出到源文件所在的章节目录。用法：./compile.sh [章节目录 ...]，不带参数时编译全部章节
# ==============================================================================

set -e

# 获取脚本所在根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BUILD_DIR=".build"
mkdir -p "$BUILD_DIR"

echo "=== 开始编译 LaTeX 文档 ==="

# 查找各章目录下的 .tex 或 .latex 文件（不进入子目录，第二章的 源码/题目.tex 不参与编译）
shopt -s nullglob
DIRS=("$@")
[ ${#DIRS[@]} -eq 0 ] && DIRS=(第*章*/)
FILES=()
for d in "${DIRS[@]}"; do FILES+=("${d%/}"/*.tex "${d%/}"/*.latex); done

if [ ${#FILES[@]} -eq 0 ]; then
    echo "未在章节目录下找到 .tex 或 .latex 文件！"
    exit 1
fi

for file in "${FILES[@]}"; do
    filename=$(basename "$file")
    basename_no_ext="${filename%.*}"
    echo "----------------------------------------"
    echo "正在编译: $filename ..."

    # 优先使用 latexmk（带 xelatex 引擎自动处理多次交叉引用），若不可用则降级调用 xelatex
    if command -v latexmk >/dev/null 2>&1; then
        echo "使用 latexmk (-xelatex) 进行编译..."
        latexmk -xelatex \
                -interaction=nonstopmode \
                -output-directory="$BUILD_DIR" \
                "$file"
    else
        echo "使用 xelatex 进行二次编译..."
        xelatex -interaction=nonstopmode -output-directory="$BUILD_DIR" "$file"
        xelatex -interaction=nonstopmode -output-directory="$BUILD_DIR" "$file"
    fi

    # 把生成的 PDF 复制回源文件所在的章节目录
    out_dir="$(dirname "$file")"
    if [ -f "$BUILD_DIR/$basename_no_ext.pdf" ]; then
        cp -f "$BUILD_DIR/$basename_no_ext.pdf" "$out_dir/$basename_no_ext.pdf"
        echo "✓ 成功生成: $out_dir/$basename_no_ext.pdf"
    else
        echo "✗ 未找到生成的 PDF: $BUILD_DIR/$basename_no_ext.pdf"
        exit 1
    fi
done

echo "========================================"
echo "所有文档编译完成！PDF 已输出到各章节目录。"
