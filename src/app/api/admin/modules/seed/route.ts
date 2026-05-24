import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }), user: null };
  }
  if (user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

const ML_MODULES = [
  {
    courseId: 'ml-bootcamp',
    title: 'Fundamentals of Machine Learning',
    description: 'Python basics, data structures, NumPy, Pandas introduction, statistical foundations',
    moduleOrder: 1,
    content: `Machine learning is a rapidly growing field that sits at the intersection of computer science, statistics, and domain expertise. This module lays the foundation for everything you will learn throughout the bootcamp.

We begin with Python programming fundamentals specifically tailored for data science. Python has become the lingua franca of ML because of its rich ecosystem of libraries, intuitive syntax, and active community. You will learn essential Python data structures including lists, dictionaries, sets, and tuples, and how to manipulate them efficiently.

Next, we dive into NumPy (Numerical Python), which provides the backbone for numerical computing in Python. NumPy arrays are dramatically faster and more memory-efficient than Python lists for numerical operations. You will master array creation, indexing, slicing, broadcasting, and vectorized operations — all of which are essential for implementing ML algorithms from scratch or working with frameworks like TensorFlow and PyTorch.

Pandas is our next stop — this library provides high-performance, easy-to-use data structures and analysis tools. You will learn to load data from CSV, JSON, SQL databases, and Excel files. We cover DataFrames, Series, indexing, filtering, grouping, merging, and aggregation. Real-world data is messy, and Pandas equips you with the tools to clean, transform, and prepare datasets for ML models.

Statistical foundations form the theoretical backbone of machine learning. We cover descriptive statistics (mean, median, mode, variance, standard deviation), probability distributions (normal, binomial, Poisson), hypothesis testing, correlation, and regression basics. Understanding these concepts is critical for evaluating model performance, selecting features, and interpreting results.

By the end of this module, you will be comfortable working with real datasets, performing exploratory data analysis (EDA), and understanding the statistical principles that underpin modern machine learning. You will build a data analysis pipeline from scratch as your first project.`,
  },
  {
    courseId: 'ml-bootcamp',
    title: 'Supervised Learning Algorithms',
    description: 'Linear/Logistic regression, decision trees, random forests, SVM, gradient boosting',
    moduleOrder: 2,
    content: `Supervised learning is the most widely used paradigm in machine learning, where models learn from labeled training data to make predictions on unseen data. This module covers the fundamental algorithms you will use most frequently in practice.

We start with Linear Regression, the simplest yet surprisingly powerful algorithm for predicting continuous values. You will learn the mathematical foundations including the cost function (MSE), gradient descent optimization, and the normal equation. We implement linear regression from scratch in NumPy, then compare with scikit-learn's implementation. Topics include simple and multiple regression, regularization (Ridge, Lasso, Elastic Net), and polynomial regression for capturing non-linear relationships.

Logistic Regression extends linear models to classification tasks. Despite its name, logistic regression is a classification algorithm used for binary and multi-class problems. You will understand the sigmoid function, maximum likelihood estimation, decision boundaries, and how to handle imbalanced datasets. We also cover evaluation metrics specific to classification: accuracy, precision, recall, F1-score, ROC curves, and AUC.

Decision Trees introduce non-linearity and interpretability. You will learn about information gain, entropy, Gini impurity, tree pruning, and the trade-off between bias and variance. We visualize decision boundaries and explore how trees make splits.

Random Forests combine multiple decision trees using ensemble learning (bagging) to reduce overfitting and improve accuracy. You will understand bootstrap aggregating, out-of-bag error estimation, and feature importance ranking.

Support Vector Machines (SVM) find the optimal hyperplane that maximizes the margin between classes. We cover linear SVMs, the kernel trick (RBF, polynomial), soft margin classification, and how to handle non-linearly separable data.

Finally, Gradient Boosting methods (XGBoost, LightGBM, CatBoost) are the workhorses of modern tabular ML. You will understand boosting theory, sequential learning, learning rate, and regularization. We compare all algorithms on real datasets and discuss when to use each one.

For your project, you will build an end-to-end prediction system using multiple algorithms, perform hyperparameter tuning with cross-validation, and select the best model.`,
  },
  {
    courseId: 'ml-bootcamp',
    title: 'Deep Learning Foundations',
    description: 'Neural networks, backpropagation, CNNs, RNNs, activation functions, optimization',
    moduleOrder: 3,
    content: `Deep learning has revolutionized artificial intelligence, powering everything from image recognition to natural language understanding. This module provides a comprehensive foundation in neural network architecture and training.

We begin with the biological inspiration behind artificial neural networks and build up from single neurons (perceptrons) to multi-layer feedforward networks. You will implement a neural network from scratch using only NumPy to understand forward propagation, where data flows through layers of interconnected nodes, each applying a weighted sum followed by an activation function.

Activation functions are crucial for introducing non-linearity into networks. We study sigmoid, tanh, ReLU, Leaky ReLU, ELU, GELU, and Swish, understanding their properties, advantages, and when to use each. You will learn why ReLU became the default choice and how modern variants address its limitations.

Backpropagation is the algorithm that makes neural network training possible. We derive the chain rule step by step, computing gradients layer by layer from the loss function back to the input. This mathematical understanding is essential for debugging training issues and designing architectures.

Optimization algorithms determine how networks update their weights. Beyond basic stochastic gradient descent (SGD), we cover momentum, Nesterov accelerated gradient, Adam, RMSprop, and learning rate scheduling strategies. You will understand the bias-variance tradeoff, overfitting prevention through dropout, batch normalization, L2 regularization, and early stopping.

Convolutional Neural Networks (CNNs) are designed for image data. We cover convolution operations, pooling layers, stride, padding, and architectures like VGGNet, ResNet, and EfficientNet. You will build image classifiers that can distinguish between thousands of categories.

Recurrent Neural Networks (RNNs) handle sequential data like text, time series, and audio. We study vanilla RNNs, the vanishing gradient problem, and how Long Short-Term Memory (LSTM) and Gated Recurrent Unit (GRU) cells solve it. We also introduce attention mechanisms, the precursor to transformers.

Throughout the module, you will use PyTorch as our primary framework, learning tensor operations, automatic differentiation, model building, and the training loop. Your project will involve building and training a deep learning model from scratch on a real-world dataset.`,
  },
  {
    courseId: 'ml-bootcamp',
    title: 'Natural Language Processing',
    description: 'Tokenization, embeddings, transformers, sentiment analysis, text generation',
    moduleOrder: 4,
    content: `Natural Language Processing (NLP) enables computers to understand, interpret, and generate human language. This module takes you from classical NLP techniques to state-of-the-art transformer models.

We begin with text preprocessing and tokenization — the process of converting raw text into numerical representations. You will learn about word tokenization, subword tokenization (BPE, WordPiece, SentencePiece), and how modern tokenizers balance vocabulary size and coverage. We cover text cleaning, stop word removal, stemming, and lemmatization.

Word embeddings represent words as dense vectors in a continuous space where semantically similar words are close together. We start with classical approaches like Word2Vec (CBOW and Skip-gram) and GloVe, understanding how they capture semantic relationships (king - man + woman = queen). We then move to contextual embeddings from models like ELMo, which generate different representations for the same word depending on its context.

The Transformer architecture, introduced in "Attention Is All You Need," revolutionized NLP. We break down self-attention, multi-head attention, positional encoding, and the encoder-decoder structure. You will understand why transformers replaced RNNs: parallel processing, long-range dependency handling, and scalability.

We fine-tune pre-trained models from Hugging Face, learning the transfer learning paradigm that dominates modern NLP. You will work with BERT for classification tasks, understanding masked language modeling and next sentence prediction as pre-training objectives.

Sentiment analysis is our first practical application. You will build models that classify text as positive, negative, or neutral, handling challenges like sarcasm, domain-specific language, and class imbalance. We compare traditional ML approaches with transformer-based methods.

Text generation covers autoregressive models like GPT. You will understand how language models generate text token by token, temperature sampling, top-k and top-p (nucleus) sampling, and prompt engineering basics. We discuss responsible AI practices, including bias detection and mitigation.

Your project will be an end-to-end NLP application: you will build a sentiment analysis pipeline, a text classifier, and a simple text generation system, deploying at least one as an API.`,
  },
  {
    courseId: 'ml-bootcamp',
    title: 'Computer Vision',
    description: 'Image classification, object detection, image segmentation, OpenCV, transfer learning',
    moduleOrder: 5,
    content: `Computer Vision (CV) is one of the most impactful applications of deep learning, enabling machines to interpret and understand visual information from the world. This module covers the full spectrum of modern CV techniques.

We start with image fundamentals using OpenCV, the most widely used computer vision library. You will learn image representation (pixels, channels, color spaces), image I/O, resizing, cropping, rotation, color conversion, and basic filtering operations. Understanding how computers represent images is essential for all subsequent topics.

Image classification assigns a single label to an entire image. We revisit CNNs in depth, starting from scratch and building up to modern architectures. You will implement data augmentation strategies (random cropping, flipping, color jittering, mixup, cutmix) that dramatically improve model generalization. We use pre-trained models from PyTorch's torchvision and fine-tune them on custom datasets.

Object detection goes beyond classification by identifying and localizing multiple objects within an image. We cover anchor boxes, Intersection over Union (IoU), Non-Maximum Suppression (NMS), and architectures including YOLO (You Only Look Once) family and Faster R-CNN. You will train an object detector on a custom dataset and evaluate it using mean Average Precision (mAP).

Image segmentation assigns a class label to every pixel in an image. We study semantic segmentation (FCN, U-Net), instance segmentation (Mask R-CNN), and panoptic segmentation. U-Net is particularly important for medical imaging applications, and you will build one from scratch.

Transfer learning is a critical technique in computer vision. Models pre-trained on massive datasets like ImageNet can be adapted to new domains with minimal data. We explore feature extraction (using pre-trained models as fixed feature extractors), fine-tuning (training some or all layers), and domain adaptation techniques.

We also cover practical deployment considerations: model optimization (quantization, pruning), inference speed optimization, and running models on edge devices. You will convert models to ONNX format and explore deployment options.

For the capstone project, you will build a complete computer vision application — such as a medical image classifier, an autonomous navigation system component, or a real-time object detection system with a web interface.`,
  },
  {
    courseId: 'ml-bootcamp',
    title: 'MLOps & Deployment',
    description: 'Model serving, Docker containers, API development, monitoring, CI/CD for ML',
    moduleOrder: 6,
    content: `Building a great machine learning model is only half the battle — getting it into production and keeping it running reliably is equally important. This module covers the tools and practices of MLOps (Machine Learning Operations).

We start with model serialization and versioning. You will learn to save and load models using pickle, joblib, PyTorch's state_dict, and the ONNX format. We discuss model versioning strategies and experiment tracking using MLflow, which helps you log parameters, metrics, and artifacts for every training run.

Docker containerization ensures your models run consistently across environments. We cover Docker fundamentals: writing Dockerfiles, building images, managing containers, and working with Docker Compose for multi-container applications. You will containerize your ML models with all dependencies, making them portable and reproducible.

Building REST APIs for model serving is our next focus. We use FastAPI (a modern, fast Python web framework) to create prediction endpoints. You will learn about request validation, response schemas, async processing, handling file uploads (for image models), and API documentation with OpenAPI/Swagger. We also cover model loading strategies (lazy loading, pre-warming) and batch prediction endpoints.

We explore model serving platforms including TensorFlow Serving, TorchServe, and Triton Inference Server. You will understand the trade-offs between different serving architectures: REST APIs, gRPC, and serverless functions.

Monitoring and observability are essential for production ML systems. We implement logging, health checks, performance metrics tracking, and data drift detection. You will learn to set up alerts for model performance degradation and automated retraining triggers.

CI/CD for ML extends traditional software CI/CD with ML-specific considerations. We cover automated testing (unit tests, integration tests, model validation tests), automated training pipelines, canary deployments for model updates, and A/B testing for comparing model versions.

We also discuss security considerations: input validation, rate limiting, authentication, and protecting against adversarial attacks.

For your project, you will deploy a complete ML system to production: containerized model, FastAPI server, monitoring, and CI/CD pipeline — a portfolio-ready demonstration of your MLOps skills.`,
  },
  {
    courseId: 'ml-bootcamp',
    title: 'Capstone Project',
    description: 'Build a complete end-to-end ML system from data collection to deployment',
    moduleOrder: 7,
    content: `The capstone project is the culmination of everything you have learned throughout the bootcamp. This is where you demonstrate your ability to tackle a real-world ML problem from start to finish, applying all the skills and knowledge from previous modules.

Your project begins with problem definition and scoping. You will identify a meaningful problem that can be solved with machine learning, define clear success metrics, and plan your approach. We provide a list of suggested project ideas, but you are encouraged to propose your own — the best projects come from genuine curiosity and passion.

Data collection and preparation is often the most time-consuming phase. You will source data from APIs, web scraping, public datasets, or generate synthetic data. We cover data cleaning, handling missing values, outlier detection, feature engineering, and creating train/validation/test splits. You will document your data pipeline so it is reproducible.

Exploratory data analysis (EDA) helps you understand your data before modeling. You will create visualizations, identify patterns and correlations, check for biases, and formulate hypotheses. This exploratory work informs your feature engineering and model selection decisions.

Model development follows an iterative process. You will start with a simple baseline model, then progressively build more sophisticated approaches. We expect you to experiment with multiple algorithms, perform rigorous hyperparameter tuning with cross-validation, and use proper evaluation methodology. You should compare at least three different approaches and justify your final model choice.

The deployment phase brings your model to life. You will containerize your solution, build a FastAPI server, and deploy it to a cloud platform. Your deployed model should be accessible via API and include proper documentation. We encourage you to create a simple web interface for demonstration.

Documentation and presentation are critical professional skills. You will write a comprehensive project report covering your methodology, results, challenges encountered, and lessons learned. You will also prepare a presentation and demo video.

Throughout the project, you will participate in code reviews with peers and receive feedback from mentors. This collaborative process mirrors real-world ML team workflows and helps you improve your code quality and communication skills.`,
  },
  {
    courseId: 'ml-bootcamp',
    title: 'Portfolio & Career Prep',
    description: 'GitHub portfolio setup, resume building, interview prep, networking strategies',
    moduleOrder: 8,
    content: `Landing your first ML role requires more than technical skills — you need a compelling portfolio, a polished resume, and strong interview performance. This final module prepares you for the job market.

We begin with building your GitHub portfolio. A well-organized GitHub profile is often the first thing recruiters look at. You will learn to structure repositories with clear README files (problem statement, approach, results, setup instructions), use notebooks effectively, write clean and documented code, and showcase your best work with visual demos. We cover GitHub Pages for hosting project websites and creating an impressive profile README.

Resume building focuses on the specific needs of ML job applications. We discuss how to describe ML projects with measurable impact, what keywords and skills to highlight, how to structure your resume for ATS (Applicant Tracking System) optimization, and how to tailor your resume for different roles (ML Engineer, Data Scientist, Research Engineer). We provide templates and conduct resume review sessions.

Technical interview preparation covers the most common types of ML interviews: coding interviews (Python, algorithms, data structures), ML fundamentals (bias-variance tradeoff, regularization, evaluation metrics), system design interviews (designing recommendation systems, search ranking, ML pipelines), and case studies. We provide practice problems and conduct mock interviews.

Behavioral interviews are equally important. You will learn the STAR method (Situation, Task, Action, Result) for structuring your answers to common behavioral questions. We practice questions about teamwork, conflict resolution, handling failure, and communicating technical concepts to non-technical stakeholders.

Networking strategies help you tap into the hidden job market. We cover LinkedIn optimization, how to reach out to recruiters and hiring managers, attending ML meetups and conferences, contributing to open-source projects, and building your professional brand through blogging and social media.

We also discuss salary negotiation, evaluating job offers, choosing between startup and large company roles, and planning your career growth path in ML.

By the end of this module, you will have a complete job application package: polished resume, impressive GitHub portfolio, LinkedIn profile, and interview preparation materials. You will be confident and ready to pursue ML roles.`,
  },
];

const LINUX_MODULES = [
  {
    courseId: 'linux-basics',
    title: 'Linux Fundamentals',
    description: 'History of Unix/Linux, distro landscape, installation basics, file system navigation',
    moduleOrder: 1,
    content: `Linux is the backbone of modern computing — from servers and smartphones to supercomputers and embedded devices. Understanding Linux is essential for any serious technology professional, and this module provides a solid foundation.

We begin with the history of Unix and Linux. You will learn about the Unix philosophy (modularity, simplicity, composability), how Richard Stallman started the GNU Project in 1983, and how Linus Torvalds created the Linux kernel in 1991. Understanding this history helps you appreciate why Linux is designed the way it is and the culture of the open-source community.

The Linux distribution landscape can be overwhelming for newcomers. We provide a clear taxonomy: Debian-based (Ubuntu, Debian, Linux Mint), Red Hat-based (Fedora, RHEL, CentOS, AlmaLinux), Arch-based (Arch Linux, Manjaro, EndeavourOS), and independent distributions (openSUSE, Gentoo, Slackware). We discuss the philosophies behind each family and help you choose the right distro for your needs. For this course, we focus on Arch Linux as our primary distribution because it teaches you how Linux actually works under the hood.

Installation basics cover different approaches: dual-booting alongside Windows, using a virtual machine (VirtualBox, VMware, QEMU), and WSL2 (Windows Subsystem for Linux). We walk through creating a bootable USB drive with Rufus or dd, partitioning concepts (MBR vs GPT, file systems), and the basic installation process. You will install Linux on your own hardware or VM during this module.

The Linux file system hierarchy is fundamentally different from Windows. We explore the root directory structure: /bin (essential binaries), /etc (configuration files), /home (user directories), /var (variable data), /tmp (temporary files), /usr (user programs), /dev (device files), /proc (process information), and /sys (kernel parameters). Understanding this hierarchy is crucial for navigating and administering a Linux system.

File system navigation covers essential commands: pwd (print working directory), ls (list files with options like -la, -h), cd (change directory), mkdir (create directories), touch (create files), cp (copy), mv (move/rename), rm (remove files and directories), and ln (create links). We also cover file permissions and ownership (chmod, chown), and how to read permission strings like -rwxr-xr--.

By the end of this module, you will be comfortable navigating the Linux file system, understanding the directory structure, and performing basic file operations from the terminal.`,
  },
  {
    courseId: 'linux-basics',
    title: 'Command Line Power User',
    description: 'Bash scripting, pipes/redirects, grep/sed/awk, process management, permissions',
    moduleOrder: 2,
    content: `The command line is where the true power of Linux reveals itself. This module transforms you from a basic terminal user into a command line power user capable of automating complex tasks.

We start with shell basics and environment configuration. You will understand the difference between login shells and non-login shells, how to configure your shell using .bashrc, .bash_profile, and /etc/environment. We cover environment variables (PATH, HOME, USER), shell aliases, and command history navigation.

Pipes and redirections are fundamental Unix concepts that enable you to chain commands together. You will master stdin, stdout, and stderr redirections (>, >>, 2>, &>), pipes (|), and advanced operators like tee, xargs, and process substitution (<()). These tools allow you to build powerful one-liners that process data streams efficiently.

grep is your search Swiss army knife. We cover basic pattern matching, extended regex (-E), Perl-compatible regex (-P), case-insensitive search (-i), line numbers (-n), counting matches (-c), and inverting matches (-v). You will use grep to search files, filter command output, and find patterns in logs.

sed (stream editor) performs text transformations on input streams. You will learn substitution (s/pattern/replacement/flags), deletion, printing specific lines, and in-place editing (-i). We cover addressing (line numbers, ranges, regex patterns) and multi-line editing.

awk is a powerful text processing language. You will learn its field-based processing model, pattern-action pairs, built-in variables (NR, NF, FS, OFS), and common one-liner patterns. awk excels at processing structured text like CSV files and log files.

Bash scripting automates repetitive tasks. We cover variables, conditionals (if/elif/else, case), loops (for, while, until), functions, arrays, and string manipulation. You will learn script best practices: set -euo pipefail, input validation, error handling, and making scripts executable with proper shebang lines. We build several practical scripts throughout the module.

Process management covers understanding processes (ps, top, htop), sending signals (kill, pkill), managing background and foreground processes (&, bg, fg, jobs, nohup), and understanding process states (running, sleeping, zombie). We also cover systemd service management for persistent processes.

File permissions in Linux use a three-tier system: owner, group, and others, each with read, write, and execute permissions. You will master chmod (symbolic and numeric modes), chown, chgrp, umask, and special permissions (setuid, setgid, sticky bit). We also cover Access Control Lists (ACLs) for finer-grained permission control.

Your project will be a collection of useful bash scripts that automate common system administration tasks.`,
  },
  {
    courseId: 'linux-basics',
    title: 'Arch Linux Deep Dive',
    description: 'Installation from scratch, pacman configuration, AUR usage, system tuning',
    moduleOrder: 3,
    content: `Arch Linux is a lightweight, flexible distribution that puts you in control of every aspect of your system. Installing and configuring Arch Linux from scratch is one of the best ways to truly understand how Linux works. This module provides a comprehensive guide to the Arch Linux ecosystem.

We start with the Arch Linux installation process using the archinstall script and the manual method. The manual installation covers: verifying the boot mode (UEFI vs BIOS), connecting to the internet, partitioning disks with fdisk or cfdisk, creating and mounting file systems, selecting an appropriate mirror, and installing the base system with pacstrap. You will learn to generate an fstab file, configure the time zone, set the locale, create a user account, and install and configure the bootloader (GRUB or systemd-boot).

The pacman package manager is Arch's signature tool. We cover all essential operations: installing packages (-S), removing packages (-R, -Rs), searching for packages (-Ss), querying installed packages (-Q, -Qi, -Ql), updating the system (-Syu), and clearing the package cache (-Sc). We also cover the pacman.conf configuration file, enabling the multilib repository for 32-bit applications, and setting up parallel downloads for faster updates.

The Arch User Repository (AUR) is one of Arch's greatest strengths — a community-driven repository containing tens of thousands of packages not in the official repositories. We cover AUR helpers like yay and paru, understanding PKGBUILD files, building packages from source, and the security considerations of using AUR packages. You will learn to evaluate AUR packages for safety and maintainability.

System tuning covers performance optimization. We explore CPU frequency scaling (performance governor), kernel parameters (sysctl), filesystem optimization (fstrim, mount options), memory management (swappiness, zram), and I/O schedulers. We also cover journald configuration for log management and tmpfiles.d for temporary file management.

Networking configuration covers NetworkManager, systemd-networkd, and basic network troubleshooting (ping, traceroute, nslookup, ss, ip). We configure firewalls with nftables or ufw and discuss SSH configuration for remote access.

System monitoring tools help you understand your system's resource usage. We cover htop, btop, neofetch, fastfetch, and custom monitoring scripts. We also discuss benchmarking tools for measuring CPU, memory, disk, and network performance.

By the end of this module, you will have a fully customized Arch Linux system that you built from the ground up, with deep understanding of every component.`,
  },
  {
    courseId: 'linux-basics',
    title: 'Wayland & Hyprland Setup',
    description: 'Display server concepts, Hyprland config, keybinds, animations, rules',
    moduleOrder: 4,
    content: `Wayland is the modern replacement for the X11 display server protocol, offering improved security, better performance, and cleaner architecture. Hyprland is a dynamic tiling Wayland compositor known for its beautiful animations, flexible configuration, and active development. This module guides you through setting up a complete Hyprland environment.

We begin with display server concepts. You will understand the difference between X11 and Wayland, why Wayland was created, and the advantages it offers: per-output scaling, reduced input latency, improved security (no root X server), and protocol modularity. We discuss Wayland protocols (xdg-shell, wlr-protocols, kde-protocols) and the role of the compositor.

Installing Hyprland on Arch Linux requires several dependencies. We walk through installing the hyprland package, a GPU driver (Mesa for AMD/Intel, nvidia-dkms for NVIDIA), and essential Wayland tools: a terminal emulator (Alacritty, Kitty, or Foot), an authentication agent (polkit-kde-agent or swaybg), a notification daemon, and a status bar (waybar).

The Hyprland configuration file (~/.config/hypr/hyprland.conf) is where the magic happens. We break down the configuration structure section by section:

Monitor configuration covers display arrangement, resolution, refresh rate, and scaling. We configure multi-monitor setups with proper positioning and workspace assignment.

Keybinds in Hyprland are highly customizable. We set up comprehensive key bindings following a consistent scheme: Super+Return for terminal, Super+Q to close windows, Super+Shift+E to exit, Super+arrow keys for focus movement, Super+Shift+arrow for window movement, Super+1-9 for workspace switching, and Super+Shift+1-9 to move windows to workspaces. We also configure window rules for specific applications.

Animations are Hyprland's standout feature. We configure bezier curves for different animation types, set animation speeds for windows opening/closing, workspace switching, border colors, and fading effects. You will learn to create smooth, aesthetically pleasing transitions.

Window rules allow application-specific behavior. We configure rules for floating windows (pavucontrol, file dialogs), workspace assignment for specific apps, window size constraints, and opacity settings.

We also cover startup applications, environment variables (XDG_CURRENT_DESKTOP, GTK_THEME, QT_QPA_PLATFORMTHEME), cursor themes, and integration with other Wayland tools like wl-clipboard, grim/slurp for screenshots, and wofi/rofi-wayland for launchers.

By the end of this module, you will have a fully functional, beautifully animated Hyprland setup.`,
  },
  {
    courseId: 'linux-basics',
    title: 'Dotfiles & Rice',
    description: 'GNU Stow, version control for configs, theming GTK/QT, terminal beautification',
    moduleOrder: 5,
    content: `Dotfiles are the configuration files that personalize your Linux experience, and "ricing" is the art of making your desktop look stunning. This module teaches you how to manage your configurations professionally and create a visually cohesive system.

We begin with GNU Stow, a symlink farm manager that simplifies dotfile management. Instead of manually creating symlinks, Stow automates the process. We set up a dotfiles directory structure where each application has its own folder (alacritty, hyprland, waybar, nvim, fish), and Stow creates the appropriate symlinks in your home directory. We cover common Stow operations: stow (create symlinks), stow -D (remove symlinks), stow -R (restow), and handling conflicts.

Version controlling your dotfiles with Git is essential for backup, synchronization across machines, and sharing with others. We initialize a Git repository in your dotfiles directory, create a comprehensive .gitignore, write meaningful commit messages, and push to GitHub. We discuss branching strategies for experimental configurations and how to quickly set up a new machine from your dotfiles repository.

Terminal beautification transforms your terminal from a basic tool into a work of art. We start with choosing and configuring a terminal emulator: Alacritty (GPU-accelerated, fast), Kitty (feature-rich, supports images), or Foot (lightweight, Wayland-native). Configuration covers font selection, color schemes, transparency, padding, cursor style, and key bindings.

Shell configuration covers switching from Bash to Zsh or Fish, and adding useful features. For Zsh, we set up Oh My Zsh or a custom configuration with plugins like zsh-autosuggestions, zsh-syntax-highlighting, and zsh-completions. For Fish, we configure the fundings plugin and tide prompt. We also cover Starship, a fast, cross-shell prompt that displays git status, language versions, and more.

Color schemes and theming create visual consistency. We use base16 or pywal to generate color palettes that work across all applications. We configure GTK themes (using nwg-look or lxappearance), icon themes (Papirus, Tela), and Qt themes (Kvantum or qt5ct) for a unified look.

Font configuration covers installing fonts (Nerd Fonts for terminal icons), configuring fontconfig for antialiasing and hinting, and selecting fonts for different purposes: monospace for terminals, sans-serif for UI, and serif for documents. We recommend fonts like JetBrains Mono, Fira Code, or Maple Mono for terminal use.

Wallpapers and visual elements complete the rice. We cover wallpaper tools (swaybg, hyprpaper, swww), setting up a wallpaper daemon, and creating animated or cycling wallpapers. We also discuss icon themes and cursor themes.

Your project will be creating a complete, themed dotfiles repository that you can share on GitHub.`,
  },
  {
    courseId: 'linux-basics',
    title: 'Advanced Customization',
    description: 'Custom scripts, status bars, notification daemons, launcher setup, productivity tools',
    moduleOrder: 6,
    content: `This final module takes your Linux customization to the advanced level, covering custom scripts, system integration, and productivity-boosting tools that complete your riced setup.

Custom scripts are the backbone of any well-configured system. We write scripts for common tasks: a screenshot script using grim/slurp that saves to a configurable directory and copies to clipboard, a volume/brightness control script that shows OSD notifications, a screen recording script using wf-recorder, a workspace indicator script, and a clipboard manager using rofi-wayland and wl-clipboard. We follow bash scripting best practices including error handling, input validation, and configuration file support.

Waybar is the premier status bar for Hyprland and other wlroots-based compositors. We create a comprehensive Waybar configuration covering: the module system (tray, clock, workspaces, window, cpu, memory, disk, network, battery, pulseaudio, custom modules), CSS styling to match your color scheme, click actions for module interaction, and IPC support for updating modules from scripts. We also cover eww (Elkowars Wacky Widgets) as an alternative for even more customization.

Notification daemons handle system notifications. We set up mako or dunst with custom configuration: positioning, size, border, colors, font, timeout, grouping behavior, and action buttons. We integrate notifications into our scripts so you get visual feedback for volume changes, screenshots, and system events.

Application launchers provide quick access to your installed applications. We configure rofi-wayland or wofi with custom themes, search modes (drun for applications, window mode for switching windows), and custom scripts as launcher entries. We also set up fuzzel as a lightweight alternative.

Clipboard management on Wayland requires special tools since there is no built-in clipboard manager. We set up cliphist (a clipboard history manager for Wayland) with rofi integration, allowing you to browse and select from your clipboard history.

Productivity tools round out your setup. We install and configure: a file manager (Thunar with custom actions, or Yazi in the terminal), a PDF viewer (Zathura or mupdf), an image viewer (imv or feh), a music player (mpd with ncmpcpp or cmus), a system monitor (btop or htop), and a note-taking tool. We also cover tiling assistant scripts, scratchpad terminals, and window rules for automatic application placement.

Automating your setup with a provisioning script ensures you can quickly recreate your environment. We write an Ansible playbook or a comprehensive shell script that installs all packages, applies configurations, sets up services, and deploys your dotfiles.

By the end of this module, you will have a complete, production-quality riced Linux setup with custom scripts, integrated tools, and a workflow that maximizes your productivity and aesthetic satisfaction.`,
  },
];

export async function POST() {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;

    const allModules = [...ML_MODULES, ...LINUX_MODULES];

    let created = 0;
    let skipped = 0;

    for (const mod of allModules) {
      const existing = await db.courseModule.findFirst({
        where: {
          courseId: mod.courseId,
          moduleOrder: mod.moduleOrder,
        },
      });

      if (existing) {
        skipped++;
      } else {
        await db.courseModule.create({ data: mod });
        created++;
      }
    }

    return NextResponse.json({
      message: 'Module seeding complete',
      created,
      skipped,
      total: allModules.length,
    });
  } catch (error) {
    console.error('Module seed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
