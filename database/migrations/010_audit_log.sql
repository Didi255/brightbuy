CREATE TABLE admin_audit_log (
  audit_id INT AUTO_INCREMENT PRIMARY KEY,

  actor_user_id INT NOT NULL,

  action ENUM(
    'create',
    'update',
    'delete',
    'status_change'
  ) NOT NULL,

  entity_type VARCHAR(50) NOT NULL,

  entity_id INT NOT NULL,

  before_value JSON NULL,

  after_value JSON NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_audit_actor
    FOREIGN KEY (actor_user_id)
    REFERENCES user (user_id)
    ON DELETE RESTRICT,

  INDEX idx_audit_actor (actor_user_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;