# BMI 6106 — Estimation I: Interactive Figures

Interactive browser-based visualizations for the **Estimation I** lecture in BMI 6106 (Intro to Probability and Statistics, University of Utah). Six figures cover the core concepts of the lecture: point estimation, sampling distributions, the Law of Large Numbers, the Central Limit Theorem, and confidence intervals.

---

## Figures

| # | Figure | Lecture Slides | What it shows |
|---|--------|---------------|---------------|
| 1 | **Bias & Variance** | 5–6 | Archery-target metaphor. Click through four quadrants (Low/High Bias × Low/High Variance) to see how shot patterns shift and how the MSE bar decomposes into Bias² + Variance. |
| 2 | **Sampling Distributions** | 9–10 | Side-by-side: population distribution (left) vs. sampling distribution of x̄ (right). Switch between Exponential, Uniform, Bimodal, and Normal populations; drag the n slider to watch the right histogram converge to normal. |
| 3 | **CLT Convergence** | 15–16 | Five panels for n = 1, 5, 10, 30, 100 drawn from the same non-normal population. Illustrates how the sampling distribution shape and SE change as n grows. |
| 4 | **SE vs SD** | 11 | Two overlapping curves on the same axis. Drag n from 5 to 200: the SD curve (amber) stays fixed; the SE curve (teal) narrows as σ/√n. Live ±σ and ±SE brackets update in real time. |
| 5 | **Law of Large Numbers** | 13 | Five simultaneous running-mean traces from n = 1 to n = 400, all converging to the true μ. Hit ↺ to generate new random paths — they all converge, directly countering the Gambler's Fallacy. |
| 6 | **Confidence Intervals** | 20–21 | 60 CIs from 60 independent samples. Teal bars capture μ; red bars miss. Sliders for confidence level, n, and number of intervals. Correct and incorrect interpretations shown side by side. |

---

## Files

```
BMI6106_Estimation_Visuals.html   — single self-contained app (deploy this)
estimation_visuals.jsx            — React source code
README.md                         — this file
```

---

