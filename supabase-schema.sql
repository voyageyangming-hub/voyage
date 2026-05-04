-- 預約記錄表
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  line_id VARCHAR(100),
  num_people INTEGER NOT NULL CHECK (num_people >= 1 AND num_people <= 20),
  booking_date DATE NOT NULL,
  time_slot VARCHAR(10) NOT NULL, -- e.g. "09:00"
  total_price INTEGER NOT NULL,   -- 票價總計
  deposit INTEGER NOT NULL,       -- 訂金
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_confirmed BOOLEAN DEFAULT FALSE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  calendar_event_id VARCHAR(255)
);

-- 查詢時段剩餘容量用
CREATE INDEX idx_bookings_date_slot ON bookings (booking_date, time_slot);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_reminder ON bookings (booking_date, reminder_sent, payment_confirmed);
