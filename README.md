# 最优化方法教材习题解析

本仓库存放《最优化方法》课程教材习题解析，包含 LaTeX 源码及预编译好的 PDF 。欢迎提交 PR 补充或完善解析！

---

## 目录结构

```text
.
├── LaTeX/                       # LaTeX 源码目录
│   └── 最优化习题解析第一章.latex   # 第 1 章习题详解 (1.1 - 1.27)
├── HTML/                        # 交互式演示页面
│   └── 第二章-单纯形法/
│       ├── dist/单纯形法习题演算.html  # 单文件版，双击即可离线打开
│       ├── index.html             # 页面源码（引用 engine.js、problems.js）
│       ├── engine.js              # 精确分数单纯形 / 两阶段求解器
│       ├── problems.js            # 第二章 14 道习题
│       ├── build.py               # 打包单文件版：python build.py
│       └── 题目.tex               # 题目原文
├── PDF/                         # 编译输出 PDF 目录
│   └── 最优化习题解析第一章.pdf    # 预编译生成的 PDF 文档
├── compile.sh                   # 本地一键编译脚本 (Bash)
├── .gitignore                   # Git 忽略文件（忽略编译临时文件等）
└── README.md                    # 本文档
```

---

## 第二章：单纯形法交互演示

`HTML/第二章-单纯形法/dist/单纯形法习题演算.html` 是一个独立的 HTML 文件，下载后用浏览器打开即可，不需要安装任何东西。内容覆盖第二章 14 道题（5 道考试真题、习题 2.17 单纯形法 4 道、习题 2.18 两阶段单纯形法 5 道）：

- 逐张单纯形表动画：检验数、入基、最小比值 θ、主元、行变换，旁白给出每一步的算式；
- 右侧画出三维可行域和迭代路径（变量多于 3 个时改为基可行解柱状图），右下角始终显示原问题；
- 页面下方列出每道题的完整单纯形表，点击某张表可跳到对应步骤；
- 可以输入新的线性规划题目，自动生成同样的演示；
- 有旁白朗读（浏览器中文语音）、合成音效和背景配乐，可分别开关。

判优约定：检验数 σ_j = c_B B⁻¹ P_j − c_j，全部 σ_j ≤ 0 时取得极小值。所有数值用精确分数计算，答案已与 scipy 核对。

修改 `index.html`、`engine.js` 或 `problems.js` 后，运行 `python build.py` 重新生成单文件版。

---

## 编译方式

本项目的 LaTeX 源码采用了 `ctexart` 文档类，内置中文排版支持及数学符号、TikZ 几何绘图支持，必须使用 **XeLaTeX** 编译器。

### 方式一：Overleaf 在线编译（推荐）

无需在本地配置庞大的 TeX 发行版，直接导入 [Overleaf](https://www.overleaf.com/) 即可在线编译：

1. **新建项目**：登录 Overleaf，点击 **New Project** -> **Upload Project**（上传打包的 ZIP）或直接将 `LaTeX/` 下的源码文件导入。
2. **切换编译器为 XeLaTeX**：
   - 点击左上角的 **Menu**（菜单）。
   - 在 **Settings** -> **Compiler** 下拉菜单中，将默认的 `pdfLaTeX` 修改为 **`XeLaTeX`**。
   - **TeX Live version** 保持默认（最新版）即可。
3. **设置主文档**：若主文件名称不是 `main.tex`，在 **Menu** -> **Main document** 中选择对应的 `.latex` 或 `.tex` 文件（如 `最优化习题解析第一章.latex`）。
4. **编译与查看**：点击右侧 **Recompile** 按钮即可在线渲染并下载 PDF。

---

### 方式二：本地编译

#### 1. 前置环境要求
请确保本地已安装 TeX 发行版：
- **Windows**: [TeX Live](https://www.tug.org/texlive/) 或 [MiKTeX](https://miktex.org/)
- **macOS**: [MacTeX](https://www.tug.org/mactex/)
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt-get update
  sudo apt-get install texlive-xetex texlive-latex-extra texlive-lang-chinese latexmk
  ```

#### 2. 运行一键编译脚本
仓库内已提供自动化编译脚本 `compile.sh`，可自动管理临时构建目录 `.build/` 并将生成的 PDF 输出至 `PDF/` 目录：

```bash
# 赋予可执行权限（首次）
chmod +x compile.sh

# 执行编译
./compile.sh
```

#### 3. 手动命令行编译
若需单独编译特定文件，可直接运行：
```bash
xelatex -output-directory=PDF LaTeX/最优化习题解析第一章.latex
# 若有交叉引用或图表变动，建议再次执行以生成最终结果：
xelatex -output-directory=PDF LaTeX/最优化习题解析第一章.latex
```

---

## 包含章节与内容

- **第 1 章：预备知识（1.1 -- 1.27）**
  - 1.1 经典极值问题
  - 1.2 最优化问题实例
  - 1.3 最优化问题的基本概念
  - 1.4 二维问题的图解法
  - 1.5 梯度与 Hesse 矩阵
  - 1.6 多元函数的 Taylor 展开式
  - 1.7 凸集与凸函数
  - 1.8 极小点的判定条件
  - 1.9 算法及有关概念
  - 习题
