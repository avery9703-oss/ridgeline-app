insert into cars (id, name, tag, year, price_per_day, seats, mileage_per_day, plate, description, active)
values
  ('11111111-1111-1111-1111-111111111111', 'Mustang GT Convertible', 'Sport', 2023, 129, 4, 150, '8LRX204', 'Red convertible, automatic. Weekend favorite for the coast highway.', true),
  ('22222222-2222-2222-2222-222222222222', 'Range Rover Sport', 'SUV', 2022, 159, 5, 150, '7KTM819', 'Black, all-wheel drive, tow package. Good for groups and gear.', true),
  ('33333333-3333-3333-3333-333333333333', 'Tesla Model 3', 'Electric', 2024, 99, 5, 150, '9DGN552', 'White, long range. Supercharger network included, autopilot enabled.', true)
on conflict (id) do nothing;
