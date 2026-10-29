"""
ml/src/metrics.py

Evaluation metrics for ocular alertness:
- Standard metrics: Accuracy, Precision, Recall, F1, ROC-AUC
- Critical alarm metric: False-Open Rate (FAR for closed eyes, false positives)
- Calibration: Expected Calibration Error (ECE) and Temperature Scaling
- Subgroup stratification: Domain (IR vs RGB), Lighting (dark/dim/bright), Glasses (yes/no)
"""

from typing import Dict, Any, Tuple
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)
from scipy.optimize import minimize

def compute_classification_metrics(
    y_true: np.ndarray,
    y_pred_prob: np.ndarray,
    threshold: float = 0.5
) -> Dict[str, float]:
    """
    Computes comprehensive binary classification metrics.
    For an alarm app, False-Open Rate (closed eyes classified as open) is the most critical failure mode.
    """
    y_pred = (y_pred_prob >= threshold).astype(int)

    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    try:
        auc = float(roc_auc_score(y_true, y_pred_prob))
    except ValueError:
        auc = 0.5 # Single class present in slice

    # Confusion matrix: tn, fp, fn, tp
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()

    # False-Open Rate (FAR): Closed eyes misclassified as Open = FP / (FP + TN)
    far_closed = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

    # False-Closed Rate (FRR): Open eyes misclassified as Closed = FN / (FN + TP)
    frr_open = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0

    return {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "roc_auc": auc,
        "false_open_rate": far_closed,
        "false_closed_rate": frr_open,
        "tp": int(tp),
        "fp": int(fp),
        "tn": int(tn),
        "fn": int(fn),
    }

def compute_expected_calibration_error(
    y_true: np.ndarray,
    y_pred_prob: np.ndarray,
    n_bins: int = 10
) -> Tuple[float, np.ndarray, np.ndarray]:
    """
    Computes Expected Calibration Error (ECE) and bin statistics.
    ECE measures difference between predicted probabilities and empirical accuracy.
    """
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    bin_indices = np.digitize(y_pred_prob, bins) - 1

    ece = 0.0
    bin_accs = []
    bin_confs = []

    for i in range(n_bins):
        mask = bin_indices == i
        if np.sum(mask) > 0:
            bin_acc = np.mean(y_true[mask])
            bin_conf = np.mean(y_pred_prob[mask])
            weight = np.sum(mask) / len(y_true)
            ece += weight * np.abs(bin_acc - bin_conf)
            bin_accs.append(bin_acc)
            bin_confs.append(bin_conf)
        else:
            bin_accs.append(0.0)
            bin_confs.append((bins[i] + bins[i+1]) / 2)

    return float(ece), np.array(bin_accs), np.array(bin_confs)

class TemperatureScaler:
    """
    Temperature scaling for post-processing neural network logits:
    p = sigmoid(logit / T)
    Optimizes negative log likelihood to calibrate confidence.
    """
    def __init__(self):
        self.temperature = 1.0

    def fit(self, logits: np.ndarray, y_true: np.ndarray):
        def nll(temp):
            t = temp[0]
            scaled = logits / max(1e-4, t)
            # Binary cross entropy
            probs = 1.0 / (1.0 + np.exp(-scaled))
            eps = 1e-7
            probs = np.clip(probs, eps, 1.0 - eps)
            loss = -np.mean(y_true * np.log(probs) + (1.0 - y_true) * np.log(1.0 - probs))
            return loss

        res = minimize(nll, [1.0], bounds=[(0.05, 10.0)], method="L-BFGS-B")
        self.temperature = float(res.x[0])
        return self

    def scale(self, logits: np.ndarray) -> np.ndarray:
        scaled = logits / self.temperature
        return 1.0 / (1.0 + np.exp(-scaled))
