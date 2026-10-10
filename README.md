# 最优化方法教材习题解析

《最优化方法》课程教材的习题解析，按章节组织。第一章是 LaTeX 写的解析和编译好的 PDF；第二章是单纯形法的交互式演示页面，一个 HTML 文件，下载后用浏览器打开即可。

欢迎提交 PR 补充或修正。

## 目录结构

```text
.
├── 第一章-预备知识/
│   ├── 最优化习题解析第一章.latex     # 第 1 章习题详解（1.1 – 1.27）
│   └── 最优化习题解析第一章.pdf       # 编译好的 PDF
├── 第二章-单纯形法/
│   ├── 单纯形法习题演算.html          # 演示页面单文件版，双击即可离线打开
│   └── 源码/
│       ├── index.html                # 页面源码（引用 engine.js、problems.js）
│       ├── engine.js                 # 精确分数的单纯形 / 两阶段求解器
│       ├── problems.js               # 第二章 14 道题的输入数据
│       ├── build.py                  # 打包单文件版
│       └── 题目.tex                  # 题目原文
├── compile.sh                        # LaTeX 一键编译脚本（Bash）
├── .gitignore
└── README.md
```

## 第一章：预备知识

`第一章-预备知识/最优化习题解析第一章.pdf` 可以直接阅读。覆盖习题 1.1 – 1.27，对应教材以下各节：

- 1.1 经典极值问题
- 1.2 最优化问题实例
- 1.3 最优化问题的基本概念
- 1.4 二维问题的图解法
- 1.5 梯度与 Hesse 矩阵
- 1.6 多元函数的 Taylor 展开式
- 1.7 凸集与凸函数
- 1.8 极小点的判定条件
- 1.9 算法及有关概念

## 第二章：单纯形法

下载 `第二章-单纯形法/单纯形法习题演算.html`，用浏览器打开。页面不需要联网，没网时只是字体换成系统字体。

题目共 14 道：考试真题 5 道（两阶段单纯形法），习题 2.17 单纯形法 4 道，习题 2.18 两阶段单纯形法 5 道。页面内容：

- 每道题从标准化讲起，然后逐张单纯形表演示：检验数、入基变量、最小比值 θ、主元、行变换，旁白给出每一步的算式。
- 右侧画出原变量空间里的可行域和迭代路径；变量多于 3 个的题改为画基可行解各分量的柱状图。原问题一直显示在右下角。
- 页面下方列出每道题的全部单纯形表，点击某张表，演示跳到对应步骤。
- 有旁白朗读（浏览器中文语音）、音效和背景音乐，可以分别关掉。
- 页面底部可以输入新的线性规划题目，生成同样的解题过程。

约定：

- 统一化为求最小值，max 问题取 z = −f。
- 检验数 σ_j = c_B B⁻¹ P_j − c_j，全部 σ_j ≤ 0 时取得极小值。
- 入基取最大的正检验数，出基按最小比值，并列时取下标小的。
- 松弛 / 剩余变量接着原变量编号（x4, x5, …），人工变量记作 u1, u2, …。

全部计算用精确分数，14 道题的结果已用 scipy 核对。其中考试真题 1 和习题 2.17(2) 无界；考试真题 2 和习题 2.18(3) 有多重最优解；习题 2.18(2) 和 2.18(5) 在阶段一结束时有冗余约束需要删行。

### 修改第二章演示

源码在 `第二章-单纯形法/源码/`。直接用浏览器打开 `index.html` 就能预览（需要联网加载样式和图标）。改完后重新打包单文件版：

```bash
cd 第二章-单纯形法/源码
python build.py ../单纯形法习题演算.html
```

`build.py` 只用 Python 标准库。第一次运行会下载 Tailwind 和 Lucide 脚本并缓存到 `vendor/`（已在 `.gitignore` 中忽略）。

要增加题目，在 `problems.js` 里按现有格式添加一段文本即可：

```text
# 标题: 习题 2.17 (1)
# 分组: 课后习题 2.17 · 单纯形法
min x1 - 3x2 + 2x3
-2x1 + 4x2 <= 12
3x1 - x2 + 2x3 <= 7
-4x1 + 3x2 + 8x3 <= 10
```

## 编译 LaTeX

LaTeX 源码使用 `ctexart` 文档类，需要用 **XeLaTeX** 编译。

### Overleaf 在线编译

1. 在 [Overleaf](https://www.overleaf.com/) 新建项目，选 **New Project → Upload Project**，上传章节目录里的 `.latex` 文件。
2. **Menu → Settings → Compiler** 改成 **XeLaTeX**，TeX Live 版本保持默认。
3. 主文件不叫 `main.tex` 时，在 **Menu → Main document** 里选对应的 `.latex` 文件。
4. 点 **Recompile** 编译并下载 PDF。

### 本地编译

先安装 TeX 发行版：

- Windows：[TeX Live](https://www.tug.org/texlive/) 或 [MiKTeX](https://miktex.org/)
- macOS：[MacTeX](https://www.tug.org/mactex/)
- Ubuntu / Debian：

  ```bash
  sudo apt-get update
  sudo apt-get install texlive-xetex texlive-latex-extra texlive-lang-chinese latexmk
  ```

然后运行 `compile.sh`。它会编译每个章节目录下的 `.tex` / `.latex` 文件，临时文件放在 `.build/`，PDF 输出到源文件所在的章节目录：

```bash
chmod +x compile.sh            # 首次运行前
./compile.sh                   # 编译全部章节
./compile.sh 第一章-预备知识     # 只编译某一章
```

也可以手动编译单个文件（有交叉引用时需要编译两遍）：

```bash
cd 第一章-预备知识
xelatex 最优化习题解析第一章.latex
xelatex 最优化习题解析第一章.latex
```
