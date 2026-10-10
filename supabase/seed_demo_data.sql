-- =============================================================================
-- SMARTCOURIER DEMO DATA SEED SCRIPT (OPTIONAL SEED FOR DEMONSTRATION)
-- Execute in Supabase SQL Editor after running the schema migration.
-- =============================================================================

BEGIN;

-- 1. Insert Initial Demo Drivers
INSERT INTO public.drivers (
  driver_code, name, email, phone, license_number, vehicle_number, vehicle_type, status, zone, assigned_deliveries_count, completed_deliveries_count
) VALUES
  ('DR-001', 'Amit Patil', 'amit.patil@smartcourier.com', '+91 98765 43210', 'MH12 20201234567', 'MH12AB1234', 'Bike', 'Available', 'Pune Central / Camp', 5, 42),
  ('DR-002', 'Rohit Jadhav', 'rohit.jadhav@smartcourier.com', '+91 98234 56781', 'MH12 20199876543', 'MH12CD5678', 'Van', 'On Delivery', 'Alandi / North Pune', 3, 58),
  ('DR-003', 'Sahil More', 'sahil.more@smartcourier.com', '+91 97654 32102', 'MH14 20215544332', 'MH14EF9012', 'Bike', 'Available', 'Wakad / Hinjawadi', 4, 36),
  ('DR-004', 'Aman Shinde', 'aman.shinde@smartcourier.com', '+91 91234 56783', 'MH12 20181122334', 'MH12GH3456', 'Tempo', 'On Delivery', 'Kharadi / Hadapsar', 6, 72),
  ('DR-005', 'Karan Verma', 'karan.verma@smartcourier.com', '+91 99887 76654', 'MH14 20227788990', 'MH14IJ7890', 'Truck', 'Offline', 'Hinjawadi Phase 2', 0, 29),
  ('DR-006', 'Deepak Pawar', 'deepak.pawar@smartcourier.com', '+91 98221 12233', 'MH12 20176655443', 'MH12KL1234', 'Van', 'Available', 'Kothrud / Karve Nagar', 2, 51),
  ('DR-007', 'Nitin Kadam', 'nitin.kadam@smartcourier.com', '+91 97300 44556', 'MH14 20203344556', 'MH14MN5678', 'Bike', 'On Delivery', 'Baner / Balewadi', 4, 63),
  ('DR-008', 'Sanjay Deshmukh', 'sanjay.d@smartcourier.com', '+91 98901 23456', 'MH12 20165566778', 'MH12OP9012', 'Tempo', 'Available', 'Pimpri / Chinchwad', 3, 84)
ON CONFLICT (driver_code) DO NOTHING;

-- 2. Insert Initial Demo Deliveries (linked to drivers by driver_code)
INSERT INTO public.deliveries (
  tracking_number, customer_name, customer_phone, customer_email, delivery_address, city, postal_code, latitude, longitude, package_description, weight_kg, priority, status, driver_id, delivery_date, notes
) VALUES
  ('SC-1001', 'Rahul Sharma', '+91 98765 43210', 'rahul.sharma@example.com', 'Flat 402, MG Road, Camp', 'Pune', '411001', 18.5204, 73.8567, 'Electronics (ThinkPad Laptop)', 2.4, 'High', 'In Transit', (SELECT id FROM public.drivers WHERE driver_code = 'DR-001'), CURRENT_DATE, 'Fragile electronic parcel. Security verification code required at doorstep.'),
  ('SC-1002', 'Priya Deshmukh', '+91 98234 56789', 'priya.d@example.com', 'Bungalow 12, Riverview Park, Alandi', 'Pune', '412105', 18.6754, 73.8992, 'Medical Supplies (Insulin Kit)', 0.8, 'Normal', 'Pending', (SELECT id FROM public.drivers WHERE driver_code = 'DR-002'), CURRENT_DATE, 'Cold-pack parcel. Deliver before 3:00 PM.'),
  ('SC-1003', 'Aditya Kulkarni', '+91 97654 32109', 'aditya.k@example.com', 'Tower B, Pristine Palms, Wakad', 'Pune', '411057', 18.5987, 73.7654, 'Apparel & Shoes', 1.5, 'High', 'Delivered', (SELECT id FROM public.drivers WHERE driver_code = 'DR-003'), CURRENT_DATE, 'Left with recipient in person. Signed on delivery app.'),
  ('SC-1004', 'Sneha Joshi', '+91 91234 56780', 'sneha.joshi@example.com', 'Suite 301, EON IT Park, Kharadi', 'Pune', '411014', 18.5529, 73.9515, 'Legal Documents (Contract Portfolio)', 0.4, 'Normal', 'Assigned', (SELECT id FROM public.drivers WHERE driver_code = 'DR-004'), CURRENT_DATE, 'Hand over directly to reception front desk.'),
  ('SC-1005', 'Vikram Patil', '+91 99887 76655', 'vikram.patil@example.com', 'Phase 2, Blue Ridge, Hinjawadi', 'Pune', '411057', 18.5913, 73.7389, 'Automobile Spare Parts', 4.8, 'High', 'In Transit', (SELECT id FROM public.drivers WHERE driver_code = 'DR-005'), CURRENT_DATE, 'Heavy machinery crate. Handle with mechanical trolley.'),
  ('SC-1006', 'Ananya Iyer', '+91 98112 23344', 'ananya.iyer@example.com', 'Row House 7, Amanora Park Town, Hadapsar', 'Pune', '411028', 18.5089, 73.9341, 'Luxury Cosmetics & Perfume', 0.9, 'High', 'In Transit', (SELECT id FROM public.drivers WHERE driver_code = 'DR-006'), CURRENT_DATE, 'Deliver after 5:30 PM per customer schedule.'),
  ('SC-1007', 'Tanmay Bhatnagar', '+91 98450 11223', 'tanmay.b@example.com', 'Apex Heights, FC Road, Shivaji Nagar', 'Pune', '411005', 18.5314, 73.8446, 'Architectural Blueprints & Models', 1.1, 'Normal', 'Assigned', (SELECT id FROM public.drivers WHERE driver_code = 'DR-007'), CURRENT_DATE, 'Keep flat and moisture-free during transport.'),
  ('SC-1008', 'Meera Nair', '+91 98670 99887', 'meera.nair@example.com', 'Greenwood Society, Baner Road', 'Pune', '411045', 18.5590, 73.7868, 'Organic Grocery Care Package', 3.2, 'Low', 'Pending', (SELECT id FROM public.drivers WHERE driver_code = 'DR-008'), CURRENT_DATE, 'Standard ground courier shipment.')
ON CONFLICT (tracking_number) DO NOTHING;

-- 3. Insert Initial Demo Routes
INSERT INTO public.routes (
  route_code, driver_id, route_date, status, total_stops, total_distance_km, estimated_duration_minutes
) VALUES
  ('RT-801', (SELECT id FROM public.drivers WHERE driver_code = 'DR-001'), CURRENT_DATE, 'Optimized', 6, 18.4, 48),
  ('RT-802', (SELECT id FROM public.drivers WHERE driver_code = 'DR-002'), CURRENT_DATE, 'Dispatched', 4, 14.2, 35),
  ('RT-803', (SELECT id FROM public.drivers WHERE driver_code = 'DR-003'), CURRENT_DATE, 'Completed', 5, 22.8, 55),
  ('RT-804', (SELECT id FROM public.drivers WHERE driver_code = 'DR-004'), CURRENT_DATE, 'Completed', 7, 26.5, 70),
  ('RT-805', (SELECT id FROM public.drivers WHERE driver_code = 'DR-006'), CURRENT_DATE, 'Completed', 5, 16.9, 42)
ON CONFLICT (route_code) DO NOTHING;

COMMIT;
