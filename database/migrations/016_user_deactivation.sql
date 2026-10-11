-- Migration 016: Add soft-deactivation support to user accounts

ALTER TABLE user
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;