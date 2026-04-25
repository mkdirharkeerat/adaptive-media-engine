#!/usr/bin/env python3
"""
Adaptive Media Recommendation - Machine Learning Training & Evaluation CLI

Executes the complete training pipeline for all 4 core machine learning models:
1. Supervised Depth Scorer (XGBoost Regressor)
2. Supervised Context / Mode Classifier (Multinomial Logistic Regression)
3. Unsupervised Sub-Genre Discovery (KMeans + Silhouette Score)
4. PyTorch LoRA Embedding Adapter (Triplet Margin Loss Fine-Tuning)
"""

import sys
import os

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.ml.depth_scorer import depth_scorer
from app.ml.context_classifier import context_classifier
from app.ml.clustering import evaluate_optimal_clusters
from app.ml.lora_finetune import lora_trainer
from app.ml.embeddings import compute_text_embedding

def print_header(title: str):
    print("\n" + "=" * 70, flush=True)
    print(f"  🚀  {title.upper()}", flush=True)
    print("=" * 70, flush=True)

def main():
    print_header("Adaptive Media Recommendation - ML Training Pipeline")

    # 1. Train Depth Scorer (XGBoost)
    print("\n[Step 1/4] Training Supervised XGBoost Depth & Drop-Off Scorer...", flush=True)
    depth_res = depth_scorer.train(n_samples=3000)
    print(f"  ✓ Model: {depth_res['model_type']}", flush=True)
    print(f"  ✓ Train Samples: {depth_res['train_size']}, Test Samples: {depth_res['test_size']}", flush=True)
    print(f"  ✓ R² Score: {depth_res['r2_score']:.4f} (Benchmark: >0.90)", flush=True)
    print(f"  ✓ RMSE: {depth_res['rmse']:.4f}", flush=True)
    print(f"  ✓ MAE: {depth_res['mae']:.4f}", flush=True)
    print("  ✓ Feature Importances:", flush=True)
    for feat, imp in depth_res['feature_importances'].items():
        print(f"      - {feat:20s}: {imp:.4f}", flush=True)

    # 2. Train Context Classifier (Logistic Regression)
    print("\n[Step 2/4] Training Supervised Context / Mode Classifier...", flush=True)
    context_res = context_classifier.train(n_samples=2000)
    print(f"  ✓ Model: {context_res['model_type']}", flush=True)
    print(f"  ✓ Accuracy: {context_res['accuracy'] * 100:.2f}% (Benchmark: >85%)", flush=True)
    print(f"  ✓ Weighted F1-Score: {context_res['f1_score']:.4f}", flush=True)
    print("  ✓ Confusion Matrix:", flush=True)
    for row in context_res['confusion_matrix']:
        print(f"      {row}", flush=True)

    # 3. Unsupervised KMeans Clustering
    print("\n[Step 3/4] Evaluating Unsupervised Sub-Genre KMeans Clustering...", flush=True)
    sample_texts = [
        "Cyberpunk dystopian neo-noir mystery with replicants",
        "Deep desert planet political revolution and sandworms",
        "Raw post-apocalyptic survival chase across wasteland",
        "Introspective two-decade melancholy romance in New York",
        "Corporate satire and brutal family power struggle",
        "High-stress Chicago kitchen culinary drama and grief",
        "Complex multi-generational time travel paradox in German town",
        "Hard sci-fi interstellar survival and alien friendship",
        "Micro-cosmic horror Cultural Revolution alien contact",
        "Dark academia classics students psychological thriller"
    ]
    sample_embeddings = [compute_text_embedding(t) for t in sample_texts]
    clustering_res = evaluate_optimal_clusters(sample_embeddings, max_k=5)
    print(f"  ✓ Optimal Clusters (k): {clustering_res['optimal_k']}", flush=True)
    print(f"  ✓ Best Silhouette Score: {clustering_res['best_silhouette']:.4f}", flush=True)
    print("  ✓ Silhouette Scores by k:", flush=True)
    for k, s in clustering_res['silhouette_scores'].items():
        print(f"      - k={k}: {s:.4f}", flush=True)

    # 4. PyTorch LoRA Embedding Fine-Tuning
    print("\n[Step 4/4] Fine-Tuning PyTorch LoRA Embedding Adapter on User Feedback...", flush=True)
    lora_res = lora_trainer.train_lora(epochs=15, lr=1e-3)
    print(f"  ✓ Adapter Architecture: Low-Rank Projection (Rank {lora_res['adapter_rank']})", flush=True)
    print(f"  ✓ Loss Objective: {lora_res['loss_function']}", flush=True)
    print(f"  ✓ Initial Loss: {lora_res['initial_loss']:.5f} ➔ Final Loss: {lora_res['final_loss']:.5f}", flush=True)
    print(f"  ✓ Loss Reduction: {((lora_res['initial_loss'] - lora_res['final_loss']) / lora_res['initial_loss'] * 100):.1f}%", flush=True)

    print_header("All 4 Machine Learning Models Successfully Trained & Persisted to Disk!")

if __name__ == "__main__":
    main()
