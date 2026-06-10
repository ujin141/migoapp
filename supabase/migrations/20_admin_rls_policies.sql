-- Migration: Add missing RLS policies for admin role to view/manage subscriptions, purchases, messages, and chat rooms.

BEGIN;

-- 1. purchases
DROP POLICY IF EXISTS "purchase_admin_all" ON public.purchases;
CREATE POLICY "purchase_admin_all" ON public.purchases
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- 2. subscriptions
DROP POLICY IF EXISTS "sub_admin_all" ON public.subscriptions;
CREATE POLICY "sub_admin_all" ON public.subscriptions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- 3. messages
DROP POLICY IF EXISTS "messages_admin_all" ON public.messages;
CREATE POLICY "messages_admin_all" ON public.messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- 4. chat_messages
DROP POLICY IF EXISTS "chat_messages_admin_all" ON public.chat_messages;
CREATE POLICY "chat_messages_admin_all" ON public.chat_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- 5. chat_members
DROP POLICY IF EXISTS "chat_members_admin_all" ON public.chat_members;
CREATE POLICY "chat_members_admin_all" ON public.chat_members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- 6. chat_threads
DROP POLICY IF EXISTS "chat_threads_admin_all" ON public.chat_threads;
CREATE POLICY "chat_threads_admin_all" ON public.chat_threads
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- 7. user_items
DROP POLICY IF EXISTS "user_items_admin_all" ON public.user_items;
CREATE POLICY "user_items_admin_all" ON public.user_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

COMMIT;
