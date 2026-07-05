This repository accompanies the paper:

**Socrates or Smartypants: Testing Logic Reasoning Capabilities of Large Language Models with Logic Programming-based Test Oracles**

📄 **Website:** [Website](https://remarkably-mind-blowing-lab.github.io/smarty-pat-logic-bench/)

📚 **Dataset:** [SmartyPat-Bench on HuggingFace](https://huggingface.co/datasets/zhx123/Smarty)

## 🧠 Overview

Our work introduces SmartyPat-Bench, a challenging benchmark for evaluating logical reasoning in Large Language Models (LLMs) using naturally expressed logical fallacies from high-quality Reddit posts. Unlike existing benchmarks, SmartyPat-Bench provides detailed fallacy annotations and more diverse data.

We also present SmartyPat, an automated framework using logic programming-based oracles (Prolog) to systematically generate logical fallacies, which are then refined into natural language by LLMs with Claude 3.7 extended thinking. Our evaluation shows that SmartyPat produces fallacies comparable to human-generated content while significantly outperforming baseline methods.

Key findings reveal that excessive reasoning steps can hinder fallacy detection accuracy, while structured reasoning enhances fallacy categorization performance in LLMs.

## 📦 Repository Structure

This repository is organized as follows:

- **/fig**: Contains resources used to generate figures such as bar charts and other visualizations
- **/statistics**: Contains scripts for:
  - Calculating F1 scores and categorization metrics
  - Generating general statistics of the dataset
- **/reddit**: Contains:
  - Original data from the "shittyscience" Reddit channel
  - Evaluator files for our customized evaluator scoring system
- **/fallacy**: 
  - Contains subdirectories for each model (`/fallacy/<modelname>`)
  - Each model directory contains files used to generate results in the `/res` directory
- **/res**: Contains all experimental results and output data
- **/PrologPrompt**: Contains prompts for generating Prolog files:
  - `prompt.py`: Prompts used with Claude 3.7 extended thinking to generate valid Prolog pairs
  - `conversion.py`: Prompts used for sentence conversion to Prolog format
- **fallacies.pl**: Main Prolog file containing the results of our study
