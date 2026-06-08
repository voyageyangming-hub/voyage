-- POS 菜單品項
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT '餐點',
  price INTEGER NOT NULL,
  stock_qty INTEGER DEFAULT -1,        -- -1 = 無限庫存
  low_stock_alert INTEGER DEFAULT 5,   -- 低於此數顯示警示
  is_available BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POS 訂單
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note VARCHAR(200),                   -- 桌號 / 備註
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'linepay', 'jkopay')),
  total_price INTEGER NOT NULL,
  amount_paid INTEGER,                 -- 客人付款金額（現金用）
  change_amount INTEGER,               -- 找零金額
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POS 訂單明細
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  item_name VARCHAR(100) NOT NULL,     -- 快照品項名，防止日後改名影響記錄
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price INTEGER NOT NULL,
  subtotal INTEGER NOT NULL
);

CREATE INDEX idx_orders_created ON orders (created_at DESC);
CREATE INDEX idx_order_items_order ON order_items (order_id);
