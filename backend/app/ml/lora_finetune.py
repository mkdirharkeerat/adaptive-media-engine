import os
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from typing import List, Dict, Any, Tuple

# Prevent OpenMP / PyTorch spin-lock on macOS
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
try:
    torch.set_num_threads(1)
except Exception:
    pass

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "saved_models")
LORA_PATH = os.path.join(MODEL_DIR, "lora_adapter.pt")

class LoRAEmbeddingAdapter(nn.Module):
    """
    Low-Rank Adaptation (LoRA) Projection Layer for Embedding Fine-Tuning.
    Adapts 384-dimensional dense semantic vectors using rank-r bottleneck:
    adapted_vec = W_in(x) + (B * A)(x)
    """
    def __init__(self, dim: int = 384, rank: int = 8, scaling: float = 1.0):
        super().__init__()
        self.dim = dim
        self.rank = rank
        self.scaling = scaling

        self.lora_down = nn.Linear(dim, rank, bias=False)
        self.lora_up = nn.Linear(rank, dim, bias=False)

        nn.init.kaiming_uniform_(self.lora_down.weight, a=np.sqrt(5))
        nn.init.zeros_(self.lora_up.weight)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        lora_out = self.lora_up(self.lora_down(x)) * self.scaling
        adapted = x + lora_out
        norm = adapted.norm(p=2, dim=-1, keepdim=True) + 1e-8
        return adapted / norm

class LoRATrainer:
    def __init__(self):
        self.adapter = LoRAEmbeddingAdapter(dim=384, rank=8)
        self.metrics: Dict[str, Any] = {}
        os.makedirs(MODEL_DIR, exist_ok=True)
        if os.path.exists(LORA_PATH):
            try:
                self.adapter.load_state_dict(torch.load(LORA_PATH, weights_only=True))
                print(f"[LoRA ML] Loaded adapted weights from {LORA_PATH}", flush=True)
            except Exception as e:
                print(f"[LoRA ML] Initializing new LoRA adapter ({e})", flush=True)

    def generate_feedback_triplets(self, n_triplets: int = 100) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        np.random.seed(42)
        dim = 384
        
        c1 = np.random.randn(dim).astype(np.float32)
        c2 = np.random.randn(dim).astype(np.float32)
        c1 /= np.linalg.norm(c1)
        c2 /= np.linalg.norm(c2)

        anchors, positives, negatives = [], [], []

        for _ in range(n_triplets):
            a = c1 + np.random.normal(0, 0.15, dim).astype(np.float32)
            a /= np.linalg.norm(a)

            p = c1 + np.random.normal(0, 0.18, dim).astype(np.float32)
            p /= np.linalg.norm(p)

            n = c2 + np.random.normal(0, 0.20, dim).astype(np.float32)
            n /= np.linalg.norm(n)

            anchors.append(a)
            positives.append(p)
            negatives.append(n)

        return (
            torch.tensor(np.array(anchors, dtype=np.float32)),
            torch.tensor(np.array(positives, dtype=np.float32)),
            torch.tensor(np.array(negatives, dtype=np.float32))
        )

    def train_lora(self, epochs: int = 10, lr: float = 1e-3) -> Dict[str, Any]:
        print(f"[LoRA ML] Fine-tuning Embedding Adapter using PyTorch (Epochs: {epochs}, LR: {lr})...", flush=True)
        anchors, positives, negatives = self.generate_feedback_triplets(n_triplets=100)

        criterion = nn.TripletMarginLoss(margin=0.4, p=2)
        optimizer = optim.AdamW(self.adapter.parameters(), lr=lr, weight_decay=1e-4)

        loss_history = []
        self.adapter.train()

        for epoch in range(1, epochs + 1):
            optimizer.zero_grad()
            
            a_emb = self.adapter(anchors)
            p_emb = self.adapter(positives)
            n_emb = self.adapter(negatives)

            loss = criterion(a_emb, p_emb, n_emb)
            loss.backward()
            optimizer.step()

            loss_val = float(loss.item())
            loss_history.append(round(loss_val, 5))
            if epoch % 2 == 0 or epoch == 1:
                print(f"[LoRA ML] Epoch {epoch:02d}/{epochs:02d} | Triplet Loss: {loss_val:.5f}", flush=True)

        torch.save(self.adapter.state_dict(), LORA_PATH)
        self.adapter.eval()

        self.metrics = {
            "model_type": "PyTorch LoRA Embedding Adapter (Triplet Loss)",
            "adapter_rank": 8,
            "loss_function": "TripletMarginLoss(margin=0.4)",
            "epochs": epochs,
            "initial_loss": loss_history[0] if loss_history else 0.0,
            "final_loss": loss_history[-1] if loss_history else 0.0,
            "loss_history": loss_history
        }
        return self.metrics

    def adapt_embedding(self, embedding_vector: np.ndarray) -> np.ndarray:
        self.adapter.eval()
        with torch.no_grad():
            t = torch.tensor(embedding_vector, dtype=torch.float32).unsqueeze(0)
            adapted = self.adapter(t).squeeze(0).numpy()
            return adapted

lora_trainer = LoRATrainer()
