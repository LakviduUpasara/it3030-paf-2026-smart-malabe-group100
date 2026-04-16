-- Test Data for Smart Campus Booking System

-- Insert sample bookings
-- Booking 1: APPROVED booking for resource 1, user 1
INSERT INTO bookings (resource_id, user_id, start_time, end_time, purpose, status, created_at)
VALUES (1, 101, '2026-04-17 10:00:00', '2026-04-17 11:00:00', 'Team Meeting', 'APPROVED', CURRENT_TIMESTAMP);

-- Booking 2: PENDING booking for resource 2, user 2
INSERT INTO bookings (resource_id, user_id, start_time, end_time, purpose, status, created_at)
VALUES (2, 102, '2026-04-18 14:00:00', '2026-04-18 15:30:00', 'Project Discussion', 'PENDING', CURRENT_TIMESTAMP);

-- Booking 3: APPROVED booking for different time slot on resource 1
INSERT INTO bookings (resource_id, user_id, start_time, end_time, purpose, status, created_at)
VALUES (1, 101, '2026-04-17 14:00:00', '2026-04-17 15:00:00', 'One-on-One Meeting', 'APPROVED', CURRENT_TIMESTAMP);

-- Insert sample campus messages
INSERT INTO campus_messages (title, content, created_at)
VALUES ('Welcome to Smart Campus', 'Welcome to the Smart Campus Operations Hub. Use this system to manage your bookings effectively.', CURRENT_TIMESTAMP);

INSERT INTO campus_messages (title, content, created_at)
VALUES ('Maintenance Notice', 'The system will undergo maintenance on 2026-04-25 from 22:00 to 23:00.', CURRENT_TIMESTAMP);
