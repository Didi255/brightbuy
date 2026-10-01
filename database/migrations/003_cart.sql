-- =========================================================================
-- 003 — Cart                                               OWNER: M3
--
-- TODO(M3). Create:
--   cart        cart_id PK, customer_id FK NULL, session_token VARCHAR(64) NULL,
--               created_at, cart_status ENUM('active','converted','abandoned')
--               customer_id is NULL for guest carts (REQ-3.5) — confirm this
--               decision was taken at kickoff before you build it
--   cart_item   item_id PK, cart_id FK, variant_id FK, quantity INT
--               UNIQUE (cart_id, variant_id)                  <- REQ-3.4 merge
--               CHECK (quantity > 0)                          <- REQ-2.6
--
-- Depends on 002 (variant). Coordinate with M2 before you run this.
-- =========================================================================
create table cart (
    cart_id int auto_increment primary key,
    customer_id int null,
    -- session token is used to track guest carts for users who are shopping but haven't logged into an account yet
    session_token varchar(64) null, 
    created_at timestamp not null default current_timestamp,
    cart_status enum('active', 'converted', 'abandoned') not null default 'active',
    -- if a user deletes their BrightBuy account MySQL will automatically delete their cart so you don't have orphaned data floating around.
    constraint fk_cart_customer foreign key (customer_id) references customer (user_id) on delete cascade
) engine = InnoDB;

create table cart_item (
    item_id int auto_increment primary key,
    cart_id int not null,
    variant_id int not null,
    quantity int not null,
    constraint fk_cart_item_cart foreign key (cart_id) references cart (cart_id) on delete cascade,
    constraint fk_cart_item_variant foreign key (variant_id) references variant (variant_id) on delete cascade,
    -- It physically prevents the database from storing two separate rows for the exact same product in the exact same cart.
    constraint uq_cart_item_variant unique (cart_id, variant_id),
    -- prevents negative or zero values from being inserted into the quantity column.
    constraint chk_cart_item_quantity check (quantity > 0)
) engine = InnoDB;
