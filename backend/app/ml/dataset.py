"""
Machine Learning Dataset Preparation & Validation
Scans dataset directories, validates sample readability, checks class balance,
performs train/val/test splits, and configures data augmentation.
"""
import os
import glob
import logging
from typing import Dict, Any, List, Tuple
from PIL import Image

logger = logging.getLogger("fake_upi_shield.dataset")


def get_dataset_summary(dataset_root: str = "data/dataset") -> Dict[str, Any]:
    """
    Inspects dataset folders, counts samples per class, and checks for corrupted files.
    Classes expected: 'genuine' and 'suspicious'.
    """
    genuine_dir = os.path.join(dataset_root, "genuine")
    suspicious_dir = os.path.join(dataset_root, "suspicious")

    os.makedirs(genuine_dir, exist_ok=True)
    os.makedirs(suspicious_dir, exist_ok=True)

    valid_extensions = ("*.jpg", "*.jpeg", "*.png", "*.webp")

    genuine_files: List[str] = []
    suspicious_files: List[str] = []

    for ext in valid_extensions:
        genuine_files.extend(glob.glob(os.path.join(genuine_dir, ext)))
        suspicious_files.extend(glob.glob(os.path.join(suspicious_dir, ext)))

    # Verify readability of images
    corrupt_files: List[str] = []
    readable_genuine = 0
    readable_suspicious = 0

    for fpath in genuine_files:
        try:
            with Image.open(fpath) as img:
                img.verify()
            readable_genuine += 1
        except Exception:
            corrupt_files.append(fpath)

    for fpath in suspicious_files:
        try:
            with Image.open(fpath) as img:
                img.verify()
            readable_suspicious += 1
        except Exception:
            corrupt_files.append(fpath)

    total_readable = readable_genuine + readable_suspicious
    imbalance_ratio = 1.0
    if total_readable > 0:
        min_class = min(readable_genuine, readable_suspicious)
        max_class = max(readable_genuine, readable_suspicious)
        imbalance_ratio = round(max_class / max(min_class, 1), 2)

    warnings: List[str] = []
    if total_readable == 0:
        warnings.append("No valid training images found in data/dataset/genuine or data/dataset/suspicious.")
    elif total_readable < 40:
        warnings.append(
            f"Dataset has only {total_readable} samples. At least 40-50 samples per class are recommended "
            "for basic generalization."
        )
    if imbalance_ratio > 3.0 and total_readable > 0:
        warnings.append(f"Significant class imbalance detected (ratio {imbalance_ratio}:1). Training may bias toward dominant class.")
    if corrupt_files:
        warnings.append(f"Found {len(corrupt_files)} corrupted or unreadable image files.")

    return {
        "dataset_ready": (readable_genuine >= 10 and readable_suspicious >= 10),
        "genuine_count": readable_genuine,
        "suspicious_count": readable_suspicious,
        "total_samples": total_readable,
        "dataset_path": os.path.abspath(dataset_root),
        "corrupt_files_count": len(corrupt_files),
        "class_imbalance_ratio": imbalance_ratio,
        "warnings": warnings
    }


def split_dataset(
    dataset_root: str = "data/dataset",
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    random_seed: int = 42
) -> Dict[str, List[Tuple[str, int]]]:
    """
    Performs stratified train/val/test split across genuine (0) and suspicious (1) images.
    Returns: {"train": [(filepath, label), ...], "val": [...], "test": [...]}
    """
    import random
    random.seed(random_seed)

    summary = get_dataset_summary(dataset_root)
    if not summary["dataset_ready"]:
        raise ValueError("Insufficient dataset samples to perform split. Provide at least 10 samples per class.")

    genuine_dir = os.path.join(dataset_root, "genuine")
    suspicious_dir = os.path.join(dataset_root, "suspicious")
    valid_extensions = ("*.jpg", "*.jpeg", "*.png", "*.webp")

    g_files = []
    s_files = []
    for ext in valid_extensions:
        g_files.extend(glob.glob(os.path.join(genuine_dir, ext)))
        s_files.extend(glob.glob(os.path.join(suspicious_dir, ext)))

    random.shuffle(g_files)
    random.shuffle(s_files)

    def partition(files: List[str], label: int):
        n = len(files)
        n_train = int(n * train_ratio)
        n_val = int(n * val_ratio)
        train_items = [(f, label) for f in files[:n_train]]
        val_items = [(f, label) for f in files[n_train:n_train + n_val]]
        test_items = [(f, label) for f in files[n_train + n_val:]]
        return train_items, val_items, test_items

    g_train, g_val, g_test = partition(g_files, 0)
    s_train, s_val, s_test = partition(s_files, 1)

    train_set = g_train + s_train
    val_set = g_val + s_val
    test_set = g_test + s_test

    random.shuffle(train_set)
    random.shuffle(val_set)
    random.shuffle(test_set)

    return {
        "train": train_set,
        "val": val_set,
        "test": test_set
    }
