#!/usr/bin/env bash
# ==============================================================================
# LaTeX 自动化编译脚本
# 默认使用 xelatex (支持 ctex 中文排版)，编译输出 PDF 到 ./PDF 目录
# ==============================================================================

set -e

# 获取脚本所在根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LATEX_DIR="LaTeX"
PDF_DIR="PDF"
BUILD_DIR=".build"

# 确保输出目录存在
mkdir -p "$PDF_DIR"
mkdir -p "$BUILD_DIR"

echo "=== 开始编译 LaTeX 文档 ==="

# 查找 LaTeX 目录下的所有 .tex 或 .latex 文件
shopt -s nullglob
FILES=("$LATEX_DIR"/*.tex "$LATEX_DIR"/*.latex)

if [ ${#FILES[@]} -eq 0 ]; then
    echo "未在 $LATEX_DIR 目录下找到 .tex 或 .latex 文件！"
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

    # 移动生成的 PDF 到 PDF 目录
    if [ -f "$BUILD_DIR/$basename_no_ext.pdf" ]; then
        cp -f "$BUILD_DIR/$basename_no_ext.pdf" "$PDF_DIR/$basename_no_ext.pdf"
        echo "✓ 成功生成: $PDF_DIR/$basename_no_ext.pdf"
    else
        echo "✗ 未找到生成的 PDF: $BUILD_DIR/$basename_no_ext.pdf"
        exit 1
    fi
done

echo "========================================"
echo "所有文档编译完成！输出文件位于 $PDF_DIR 目录。"
