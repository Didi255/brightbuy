-- =========================================================================
-- 011 — Variant Attributes
-- =========================================================================

CREATE TABLE variant_attribute (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

CREATE TABLE attribute_value (
    value_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_id INT NOT NULL,
    variant_id INT NOT NULL,
    value VARCHAR(255) NOT NULL,
    
    UNIQUE (variant_id, attribute_id),
    FOREIGN KEY (attribute_id) REFERENCES variant_attribute(attribute_id),
    FOREIGN KEY (variant_id) REFERENCES variant(variant_id)
) ENGINE=InnoDB;