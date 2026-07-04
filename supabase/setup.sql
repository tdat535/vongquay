-- ============================================
-- Vòng Quay May Mắn - Cao Đẳng Viễn Đông
-- Chạy SQL này trong Supabase SQL Editor
-- ============================================

-- 1. Bảng sinh viên (mỗi dòng Google Form = 1 bản ghi, ko gộp theo MSSV)
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  mssv TEXT NOT NULL DEFAULT '',
  full_name TEXT NOT NULL,
  ngay_sinh TEXT,
  hoc_sinh_tot_nghiep TEXT,
  nganh TEXT,
  sdt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng lịch sử quay (tham chiếu student id)
CREATE TABLE IF NOT EXISTS spins (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  prize TEXT NOT NULL,
  prize_type TEXT NOT NULL,
  spun_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spins_student ON spins(student_id);

-- 3. Bảng kho giải thưởng
CREATE TABLE IF NOT EXISTS prizes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  total INTEGER NOT NULL,
  remaining INTEGER NOT NULL,
  color TEXT NOT NULL
);

-- Insert prizes (chạy 1 lần)
INSERT INTO prizes (name, display_name, total, remaining, color) VALUES
  ('special', 'Giải Đặc Biệt: 1,000,000đ + Voucher 10%', 1, 1, '#FFD700'),
  ('voucher10', 'Voucher 10% + Áo đồng phục + Balo', 10, 10, '#2ECC71'),
  ('voucher5', 'Voucher giảm học phí 5%', 5, 5, '#3498DB')
ON CONFLICT (name) DO UPDATE SET total = EXCLUDED.total, remaining = EXCLUDED.remaining;

-- ============================================
-- 4. Hàm RPC: import danh sách SV
-- ============================================
CREATE OR REPLACE FUNCTION import_students(p_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_count INTEGER := 0;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    INSERT INTO students (mssv, full_name, ngay_sinh, hoc_sinh_tot_nghiep, nganh, sdt)
    VALUES (
      v_item->>'mssv',
      v_item->>'full_name',
      v_item->>'ngay_sinh',
      v_item->>'hoc_sinh_tot_nghiep',
      v_item->>'nganh',
      v_item->>'sdt'
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'imported', v_count);
END;
$$;

-- ============================================
-- 5. Hàm RPC: xử lý quay (atomic)
-- ============================================
CREATE OR REPLACE FUNCTION perform_spin(p_student_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_existing RECORD;
  v_available JSONB[];
  v_total_weight INTEGER;
  v_rand NUMERIC;
  v_cum INTEGER;
  v_selected TEXT;
  v_prize_name TEXT;
  v_prize_names CONSTANT JSONB := '{
    "special": "Giải Đặc Biệt: 1,000,000đ + Voucher giảm học phí 10%",
    "voucher10": "Voucher giảm học phí 10% + Áo đồng phục + Balo",
    "voucher5": "Voucher giảm học phí 5%"
  }';
BEGIN
  -- Kiểm tra student tồn tại
  SELECT id, full_name INTO v_student FROM students WHERE id = p_student_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Sinh viên không tồn tại');
  END IF;

  -- Kiểm tra đã quay chưa
  SELECT id INTO v_existing FROM spins WHERE student_id = p_student_id;
  IF FOUND THEN
    RETURN jsonb_build_object('error', 'Sinh viên này đã quay rồi');
  END IF;

  -- Lọc giải còn hàng + gán trọng số
  v_available := ARRAY(
    SELECT jsonb_build_object('name', name, 'weight',
      CASE name
        WHEN 'special' THEN remaining * 5
        WHEN 'voucher10' THEN remaining * 2
        WHEN 'voucher5' THEN remaining * 2
        ELSE remaining
      END
    )
    FROM prizes
    WHERE remaining > 0
  );

  -- Nếu hết giải
  IF array_length(v_available, 1) IS NULL OR array_length(v_available, 1) = 0 THEN
    RETURN jsonb_build_object('error', 'Đã hết giải thưởng!');
  END IF;

  -- Tính tổng trọng số
  v_total_weight := 0;
  FOR i IN 1 .. array_length(v_available, 1) LOOP
    v_total_weight := v_total_weight + (v_available[i]->>'weight')::INTEGER;
  END LOOP;

  -- Random chọn giải
  v_rand := random() * v_total_weight;
  v_cum := 0;
  v_selected := v_available[1]->>'name';

  FOR i IN 1 .. array_length(v_available, 1) LOOP
    v_cum := v_cum + (v_available[i]->>'weight')::INTEGER;
    IF v_rand < v_cum THEN
      v_selected := v_available[i]->>'name';
      EXIT;
    END IF;
  END LOOP;

  -- Trừ kho (atomic)
  UPDATE prizes
  SET remaining = remaining - 1
  WHERE name = v_selected AND remaining > 0;

  -- Lưu spin record
  INSERT INTO spins (student_id, prize, prize_type)
  VALUES (p_student_id, v_prize_names->>v_selected, v_selected);

  RETURN jsonb_build_object(
    'prize', v_prize_names->>v_selected,
    'prizeType', v_selected
  );
END;
$$;

-- ============================================
-- 6. RLS + permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT EXECUTE ON FUNCTION perform_spin(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION import_students(JSONB) TO anon;

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select" ON students;
DROP POLICY IF EXISTS "anon_select" ON prizes;
DROP POLICY IF EXISTS "anon_select" ON spins;

CREATE POLICY "anon_select" ON students FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select" ON prizes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select" ON spins FOR SELECT TO anon USING (true);
