drop table if exists order_items;
drop table if exists orders;
drop table if exists products;
drop table if exists categories;
drop table if exists customers;

create table categories (
  id serial primary key,
  name text not null unique
);

create table products (
  id serial primary key,
  name text not null,
  sku text not null unique,
  category_id integer references categories(id),
  unit_price numeric(10,2) not null,
  active boolean default true
);

create table customers (
  id serial primary key,
  full_name text not null,
  email text not null unique,
  country text not null
);

create table orders (
  id serial primary key,
  customer_id integer references customers(id),
  created_at timestamp not null,
  status text not null check (
    status in ('pending', 'paid', 'completed', 'shipped', 'cancelled', 'refunded')
  )
);

create table order_items (
  id serial primary key,
  order_id integer references orders(id) on delete cascade,
  product_id integer references products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null
);

insert into categories (name) values
('Dog Toys'),
('Dog Food'),
('Accessories'),
('Training'),
('Health');

insert into products (name, sku, category_id, unit_price) values
('Organic Dog Toy', 'DOG-TOY-001', 1, 14.90),
('Chew Rope XL', 'DOG-TOY-002', 1, 9.90),
('Squeaky Bone', 'DOG-TOY-003', 1, 7.50),
('Premium Kibble 5kg', 'DOG-FOOD-001', 2, 39.90),
('Puppy Starter Kit', 'DOG-ACC-001', 3, 49.90),
('Leather Collar', 'DOG-ACC-002', 3, 24.90),
('Training Clicker', 'DOG-TRAIN-001', 4, 6.90),
('Agility Tunnel', 'DOG-TRAIN-002', 4, 89.90),
('Dental Care Sticks', 'DOG-HEALTH-001', 5, 12.90),
('Anti-Tick Shampoo', 'DOG-HEALTH-002', 5, 16.90);

insert into customers (full_name, email, country) values
('Alice Martin', 'alice@example.com', 'France'),
('Bruno Leroy', 'bruno@example.com', 'France'),
('Claire Dupont', 'claire@example.com', 'Belgium'),
('David Schmidt', 'david@example.com', 'Germany'),
('Emma Rossi', 'emma@example.com', 'Italy'),
('Farid Benali', 'farid@example.com', 'France'),
('Julie Moreau', 'julie@example.com', 'France'),
('Lucas Bernard', 'lucas@example.com', 'Switzerland');

insert into orders (customer_id, created_at, status) values
(1, date_trunc('month', current_date) - interval '1 month' + interval '2 days', 'completed'),
(2, date_trunc('month', current_date) - interval '1 month' + interval '3 days', 'paid'),
(3, date_trunc('month', current_date) - interval '1 month' + interval '5 days', 'shipped'),
(4, date_trunc('month', current_date) - interval '1 month' + interval '8 days', 'completed'),
(5, date_trunc('month', current_date) - interval '1 month' + interval '10 days', 'completed'),
(6, date_trunc('month', current_date) - interval '1 month' + interval '12 days', 'cancelled'),
(7, date_trunc('month', current_date) - interval '1 month' + interval '14 days', 'paid'),
(8, date_trunc('month', current_date) - interval '1 month' + interval '20 days', 'completed'),

(1, date_trunc('month', current_date) - interval '2 months' + interval '4 days', 'completed'),
(2, date_trunc('month', current_date) - interval '2 months' + interval '15 days', 'completed'),

(3, date_trunc('month', current_date) + interval '2 days', 'completed'),
(4, date_trunc('month', current_date) + interval '5 days', 'paid');

insert into order_items (order_id, product_id, quantity, unit_price) values
-- last month
(1, 1, 12, 14.90),
(1, 2, 8, 9.90),
(1, 4, 2, 39.90),

(2, 1, 20, 14.90),
(2, 3, 15, 7.50),
(2, 9, 10, 12.90),

(3, 2, 30, 9.90),
(3, 5, 4, 49.90),

(4, 1, 18, 14.90),
(4, 4, 6, 39.90),
(4, 6, 7, 24.90),

(5, 5, 10, 49.90),
(5, 7, 25, 6.90),

-- cancelled order, should usually be excluded
(6, 8, 50, 89.90),

(7, 1, 16, 14.90),
(7, 2, 12, 9.90),
(7, 10, 9, 16.90),

(8, 9, 22, 12.90),
(8, 3, 11, 7.50),

-- two months ago
(9, 4, 15, 39.90),
(9, 1, 5, 14.90),
(10, 6, 8, 24.90),

-- current month
(11, 1, 7, 14.90),
(11, 5, 3, 49.90),
(12, 2, 6, 9.90);