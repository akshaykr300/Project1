# Fake UPI Shield - Training Dataset Directory

This directory houses lawful, appropriately labelled datasets for training and evaluating the Convolutional Neural Network (CNN) classifier.

## Directory Structure
```
data/
└── dataset/
    ├── genuine/       # Legitimate, unmodified UPI payment confirmation screenshots
    │   └── .gitkeep
    └── suspicious/    # Counterfeit, spoofed, prank-app, or font-manipulated receipts
        └── .gitkeep
```

## Guidelines for Ethical Data Collection and Labelling
1. **Lawful Acquisition & Privacy Protection**:
   - Redact all personal identifiable numbers (e.g. personal mobile numbers, Aadhaar or account numbers).
   - Only use synthetic receipts or screenshots where explicit consent was provided by test participants.
2. **Class Balance**:
   - Maintain a balanced 1:1 or at most 1.5:1 ratio between `genuine` and `suspicious` images.
   - Recommended minimum for prototype generalization: 50 genuine and 50 suspicious screenshots across different UPI apps (Google Pay, PhonePe, Paytm, BHIM).
3. **Preventing Data Leakage**:
   - Do NOT place near-duplicate crops or multiple resolutions of the same transaction receipt across training and test splits.
   - Separate test sets by different users and different phone models.
4. **Resolution Standards**:
   - Keep native device resolutions (e.g., 1080x2400 or 720x1600). The preprocessing pipeline will automatically resize and normalize images to 224x224 for CNN tensor input.
