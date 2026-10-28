-- ==============================================================================
-- FAKE UPI SHIELD - DATABASE SCHEMA
-- Target Database: MySQL 8.0+
-- Database Name: fake_upi_detector
-- Description: Complete executable schema for storing analysis history,
--              machine learning model versions, and background training jobs.
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `fake_upi_detector`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `fake_upi_detector`;

-- ------------------------------------------------------------------------------
-- Table: model_versions
-- Stores registered ML CNN model weights, training configurations, and test metrics
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `model_versions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `version_name` VARCHAR(64) NOT NULL UNIQUE COMMENT 'Unique identifier, e.g., cnn_v1.0.0',
  `file_path` VARCHAR(255) NOT NULL COMMENT 'Relative or absolute path to .keras or .h5 file',
  `architecture` VARCHAR(128) NOT NULL DEFAULT 'CustomCNN_v1',
  `input_shape` VARCHAR(32) NOT NULL DEFAULT '(224, 224, 3)',
  `dataset_metadata` JSON NOT NULL COMMENT 'Counts of genuine/suspicious samples used',
  `training_metrics` JSON NULL COMMENT 'Final epoch train_loss, train_acc, val_loss, val_acc',
  `test_metrics` JSON NULL COMMENT 'Held-out test precision, recall, f1, accuracy, confusion matrix',
  `class_mapping` JSON NOT NULL COMMENT '{"0": "genuine", "1": "suspicious"}',
  `is_active` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether this model is loaded for live inference',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_model_active` (`is_active`),
  INDEX `idx_model_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table: training_jobs
-- Tracks asynchronous or background CNN model training jobs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `training_jobs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_id` VARCHAR(64) NOT NULL UNIQUE COMMENT 'UUID or unique string for job lookup',
  `status` ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `dataset_config` JSON NOT NULL COMMENT 'Dataset path, split ratios, batch size, epochs',
  `current_epoch` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_epochs` INT UNSIGNED NOT NULL DEFAULT 10,
  `progress_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `logs` MEDIUMTEXT NULL COMMENT 'Epoch stdout logs, loss/accuracy steps',
  `error_details` TEXT NULL COMMENT 'Exception traceback if failed',
  `model_version_id` INT UNSIGNED NULL COMMENT 'Linked model version produced if completed',
  `started_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_training_model_version`
    FOREIGN KEY (`model_version_id`) REFERENCES `model_versions` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_job_status` (`status`),
  INDEX `idx_job_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table: analysis_history
-- Records every analyzed payment screenshot, extracted OCR, visual heuristics,
-- CNN model inference output, and transparent assessment decisions.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `analysis_history` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `analysis_id` VARCHAR(64) NOT NULL UNIQUE COMMENT 'Public UUID for the analysis run',
  `original_filename` VARCHAR(255) NOT NULL,
  `file_hash` CHAR(64) NOT NULL COMMENT 'SHA-256 hash of uploaded image',
  `file_size_bytes` INT UNSIGNED NOT NULL,
  `image_dimensions` VARCHAR(32) NOT NULL COMMENT 'e.g. 1080x2400',
  `ocr_status` ENUM('SUCCESS', 'PARTIAL', 'FAILED', 'NOT_INSTALLED') NOT NULL DEFAULT 'SUCCESS',
  `extracted_amount` VARCHAR(64) NULL COMMENT 'Normalized amount, e.g. 500.00',
  `extracted_upi_id` VARCHAR(128) NULL COMMENT 'Target UPI ID / VPA',
  `extracted_utr` VARCHAR(64) NULL COMMENT '12-digit UTR or transaction reference',
  `extracted_timestamp` VARCHAR(128) NULL COMMENT 'Extracted payment date/time',
  `extracted_recipient` VARCHAR(128) NULL COMMENT 'Beneficiary or payee name',
  `extracted_status_text` VARCHAR(64) NULL COMMENT 'e.g. Successful, Completed, Pending, Failed',
  `raw_ocr_text` MEDIUMTEXT NULL COMMENT 'Complete extracted raw text from Tesseract',
  `cnn_status` ENUM('MODEL_NOT_TRAINED', 'INFERENCE_SUCCESS', 'INFERENCE_FAILED', 'DISABLED') NOT NULL DEFAULT 'MODEL_NOT_TRAINED',
  `model_version_id` INT UNSIGNED NULL COMMENT 'Reference to model_versions table',
  `cnn_prediction` VARCHAR(32) NULL COMMENT 'genuine or suspicious',
  `cnn_confidence` DECIMAL(5, 4) NULL COMMENT '0.0000 to 1.0000',
  `assessment` ENUM('SUSPICIOUS', 'NO_OBVIOUS_ISSUES', 'INCONCLUSIVE', 'ANALYSIS_INCOMPLETE') NOT NULL DEFAULT 'INCONCLUSIVE',
  `reasons` JSON NOT NULL COMMENT 'List of transparent findings and warning codes',
  `heuristic_flags` JSON NOT NULL COMMENT 'Key-value flags for missing fields, font inconsistency, etc.',
  `processing_duration_ms` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_analysis_model_version`
    FOREIGN KEY (`model_version_id`) REFERENCES `model_versions` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_analysis_created` (`created_at`),
  INDEX `idx_analysis_assessment` (`assessment`),
  INDEX `idx_analysis_hash` (`file_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Sample seed record for testing connectivity
-- ------------------------------------------------------------------------------
INSERT INTO `model_versions` (
  `version_name`,
  `file_path`,
  `architecture`,
  `input_shape`,
  `dataset_metadata`,
  `class_mapping`,
  `is_active`,
  `notes`
) VALUES (
  'fake_upi_cnn_baseline_v1',
  'backend/app/ml/weights/fake_upi_baseline.keras',
  'Conv2D_BN_Dense_Binary',
  '(224, 224, 3)',
  JSON_OBJECT('genuine_samples', 0, 'suspicious_samples', 0, 'status', 'uninitialised_baseline'),
  JSON_OBJECT('0', 'genuine', '1', 'suspicious'),
  FALSE,
  'Template baseline record. Model training must be executed with legitimate user-provided dataset.'
) ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;
