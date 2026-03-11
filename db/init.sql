--
-- PostgreSQL database dump
--

\restrict AOhIzWWJdUuIxhkfmK9c5ZSbTeqPt4hyACaO8RAn8wptEjheJnyajvgJvc8Pyev

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY pgboss.subscription DROP CONSTRAINT IF EXISTS subscription_name_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.schedule DROP CONSTRAINT IF EXISTS schedule_name_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.queue DROP CONSTRAINT IF EXISTS queue_dead_letter_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 DROP CONSTRAINT IF EXISTS q_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 DROP CONSTRAINT IF EXISTS q_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 DROP CONSTRAINT IF EXISTS q_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 DROP CONSTRAINT IF EXISTS q_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 DROP CONSTRAINT IF EXISTS q_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 DROP CONSTRAINT IF EXISTS q_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 DROP CONSTRAINT IF EXISTS dlq_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 DROP CONSTRAINT IF EXISTS dlq_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 DROP CONSTRAINT IF EXISTS dlq_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 DROP CONSTRAINT IF EXISTS dlq_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 DROP CONSTRAINT IF EXISTS dlq_fkey;
ALTER TABLE IF EXISTS ONLY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 DROP CONSTRAINT IF EXISTS dlq_fkey;
DROP INDEX IF EXISTS public.idx_white_label_settings_tenant_id;
DROP INDEX IF EXISTS public.idx_white_label_settings_owner_id;
DROP INDEX IF EXISTS public.idx_users_tenant_id;
DROP INDEX IF EXISTS public.idx_users_property_id;
DROP INDEX IF EXISTS public.idx_users_owner_id;
DROP INDEX IF EXISTS public.idx_users_hotel_id;
DROP INDEX IF EXISTS public.idx_usage_meters_tenant_id;
DROP INDEX IF EXISTS public.idx_usage_meters_owner_id;
DROP INDEX IF EXISTS public.idx_units_tenant_id;
DROP INDEX IF EXISTS public.idx_units_property_id;
DROP INDEX IF EXISTS public.idx_units_owner_id;
DROP INDEX IF EXISTS public.idx_subscriptions_tenant_id;
DROP INDEX IF EXISTS public.idx_subscriptions_status;
DROP INDEX IF EXISTS public.idx_subscriptions_period_end;
DROP INDEX IF EXISTS public.idx_subscriptions_owner_id;
DROP INDEX IF EXISTS public.idx_staff_performance_staff_id;
DROP INDEX IF EXISTS public.idx_staff_performance_hotel_id;
DROP INDEX IF EXISTS public.idx_staff_messages_tenant_id;
DROP INDEX IF EXISTS public.idx_staff_messages_hotel_id;
DROP INDEX IF EXISTS public.idx_staff_message_status_staff_id;
DROP INDEX IF EXISTS public.idx_staff_message_status_message_id;
DROP INDEX IF EXISTS public.idx_staff_invitations_tenant_id;
DROP INDEX IF EXISTS public.idx_staff_invitations_property_id;
DROP INDEX IF EXISTS public.idx_staff_invitations_owner_id;
DROP INDEX IF EXISTS public.idx_staff_feedback_staff_id;
DROP INDEX IF EXISTS public.idx_staff_feedback_hotel_id;
DROP INDEX IF EXISTS public.idx_service_requests_tenant_id;
DROP INDEX IF EXISTS public.idx_service_requests_property_id;
DROP INDEX IF EXISTS public.idx_service_requests_owner_id;
DROP INDEX IF EXISTS public.idx_service_requests_booking_id;
DROP INDEX IF EXISTS public.idx_room_settings_tenant_id;
DROP INDEX IF EXISTS public.idx_room_preparation_orders_tenant_id;
DROP INDEX IF EXISTS public.idx_room_preparation_orders_property_id;
DROP INDEX IF EXISTS public.idx_room_preparation_orders_owner_id;
DROP INDEX IF EXISTS public.idx_room_preparation_orders_hotel_id;
DROP INDEX IF EXISTS public.idx_room_nights_unit_date;
DROP INDEX IF EXISTS public.idx_room_nights_tenant_id;
DROP INDEX IF EXISTS public.idx_room_nights_property_date;
DROP INDEX IF EXISTS public.idx_room_nights_booking_id;
DROP INDEX IF EXISTS public.idx_revenues_tenant_id;
DROP INDEX IF EXISTS public.idx_revenues_property_id;
DROP INDEX IF EXISTS public.idx_revenues_owner_id;
DROP INDEX IF EXISTS public.idx_revenues_hotel_id;
DROP INDEX IF EXISTS public.idx_refund_status;
DROP INDEX IF EXISTS public.idx_refund_owner;
DROP INDEX IF EXISTS public.idx_refund_invoice;
DROP INDEX IF EXISTS public.idx_recurring_expenses_tenant_id;
DROP INDEX IF EXISTS public.idx_recurring_expenses_property_id;
DROP INDEX IF EXISTS public.idx_recurring_expenses_owner_id;
DROP INDEX IF EXISTS public.idx_recurring_expenses_hotel_id;
DROP INDEX IF EXISTS public.idx_rate_plans_tenant_id;
DROP INDEX IF EXISTS public.idx_rate_plans_property_id;
DROP INDEX IF EXISTS public.idx_properties_tenant_id;
DROP INDEX IF EXISTS public.idx_properties_owner_id;
DROP INDEX IF EXISTS public.idx_pricing_rules_tenant_id;
DROP INDEX IF EXISTS public.idx_pricing_rules_property_id;
DROP INDEX IF EXISTS public.idx_payroll_entries_tenant_id;
DROP INDEX IF EXISTS public.idx_payroll_entries_property_id;
DROP INDEX IF EXISTS public.idx_payroll_entries_owner_id;
DROP INDEX IF EXISTS public.idx_payroll_entries_hotel_id;
DROP INDEX IF EXISTS public.idx_payroll_configs_tenant_id;
DROP INDEX IF EXISTS public.idx_payroll_configs_property_id;
DROP INDEX IF EXISTS public.idx_payroll_configs_owner_id;
DROP INDEX IF EXISTS public.idx_payroll_configs_hotel_id;
DROP INDEX IF EXISTS public.idx_payment_orders_tenant_id;
DROP INDEX IF EXISTS public.idx_payment_orders_status;
DROP INDEX IF EXISTS public.idx_payment_orders_owner_id;
DROP INDEX IF EXISTS public.idx_ota_sync_logs_tenant_id;
DROP INDEX IF EXISTS public.idx_ota_sync_logs_provider;
DROP INDEX IF EXISTS public.idx_ota_sync_logs_property_id;
DROP INDEX IF EXISTS public.idx_ota_sync_logs_created_at;
DROP INDEX IF EXISTS public.idx_ota_integrations_tenant_id;
DROP INDEX IF EXISTS public.idx_ota_integrations_property_provider;
DROP INDEX IF EXISTS public.idx_ota_integrations_property_id;
DROP INDEX IF EXISTS public.idx_ota_conflicts_tenant_id;
DROP INDEX IF EXISTS public.idx_ota_conflicts_property_id;
DROP INDEX IF EXISTS public.idx_onboarding_progress_tenant_id;
DROP INDEX IF EXISTS public.idx_onboarding_progress_owner_id;
DROP INDEX IF EXISTS public.idx_notifications_user_id;
DROP INDEX IF EXISTS public.idx_notifications_tenant_id;
DROP INDEX IF EXISTS public.idx_notifications_read;
DROP INDEX IF EXISTS public.idx_no_show_records_tenant_id;
DROP INDEX IF EXISTS public.idx_no_show_records_hotel_id;
DROP INDEX IF EXISTS public.idx_invoices_tenant_id;
DROP INDEX IF EXISTS public.idx_invoices_owner_id;
DROP INDEX IF EXISTS public.idx_housekeeping_tasks_unit_id;
DROP INDEX IF EXISTS public.idx_housekeeping_tasks_tenant_id;
DROP INDEX IF EXISTS public.idx_housekeeping_tasks_status;
DROP INDEX IF EXISTS public.idx_housekeeping_tasks_property_id;
DROP INDEX IF EXISTS public.idx_housekeeping_tasks_booking_id;
DROP INDEX IF EXISTS public.idx_housekeeping_tasks_assigned_to;
DROP INDEX IF EXISTS public.idx_hotels_tenant_id;
DROP INDEX IF EXISTS public.idx_hotels_property_id;
DROP INDEX IF EXISTS public.idx_hotels_owner_id;
DROP INDEX IF EXISTS public.idx_financial_transactions_tenant_id;
DROP INDEX IF EXISTS public.idx_financial_transactions_property_id;
DROP INDEX IF EXISTS public.idx_financial_transactions_owner_id;
DROP INDEX IF EXISTS public.idx_financial_transactions_hotel_id;
DROP INDEX IF EXISTS public.idx_financial_audit_logs_tenant_id;
DROP INDEX IF EXISTS public.idx_financial_audit_logs_hotel_id;
DROP INDEX IF EXISTS public.idx_feature_flag_overrides_tenant_id;
DROP INDEX IF EXISTS public.idx_feature_flag_overrides_owner_id;
DROP INDEX IF EXISTS public.idx_external_bookings_tenant_id;
DROP INDEX IF EXISTS public.idx_external_bookings_hotel_id;
DROP INDEX IF EXISTS public.idx_external_bookings_external_id_hotel_id;
DROP INDEX IF EXISTS public.idx_expenses_tenant_id;
DROP INDEX IF EXISTS public.idx_expenses_property_id;
DROP INDEX IF EXISTS public.idx_expenses_owner_id;
DROP INDEX IF EXISTS public.idx_expenses_hotel_id;
DROP INDEX IF EXISTS public.idx_escalation_replies_tenant_id;
DROP INDEX IF EXISTS public.idx_door_action_logs_tenant_id;
DROP INDEX IF EXISTS public.idx_devices_tenant_id;
DROP INDEX IF EXISTS public.idx_devices_property_id;
DROP INDEX IF EXISTS public.idx_devices_owner_id;
DROP INDEX IF EXISTS public.idx_device_telemetry_tenant_id;
DROP INDEX IF EXISTS public.idx_credential_logs_tenant_id;
DROP INDEX IF EXISTS public.idx_contract_acceptances_tenant_id;
DROP INDEX IF EXISTS public.idx_contract_acceptances_owner_id;
DROP INDEX IF EXISTS public.idx_chat_messages_tenant_id;
DROP INDEX IF EXISTS public.idx_chat_messages_property_id;
DROP INDEX IF EXISTS public.idx_chat_messages_hotel_id;
DROP INDEX IF EXISTS public.idx_chat_messages_guest_id;
DROP INDEX IF EXISTS public.idx_cash_accounts_tenant_id;
DROP INDEX IF EXISTS public.idx_cash_accounts_property_id;
DROP INDEX IF EXISTS public.idx_cash_accounts_owner_id;
DROP INDEX IF EXISTS public.idx_cash_accounts_hotel_id;
DROP INDEX IF EXISTS public.idx_bookings_tenant_id;
DROP INDEX IF EXISTS public.idx_bookings_property_id;
DROP INDEX IF EXISTS public.idx_bookings_owner_id;
DROP INDEX IF EXISTS public.idx_bookings_guest_id;
DROP INDEX IF EXISTS public.idx_billing_info_tenant_id;
DROP INDEX IF EXISTS public.idx_billing_info_owner_id;
DROP INDEX IF EXISTS public.idx_audit_logs_tenant_id;
DROP INDEX IF EXISTS public.idx_audit_logs_property_id;
DROP INDEX IF EXISTS public.idx_audit_logs_owner_id;
DROP INDEX IF EXISTS public.idx_audit_entity;
DROP INDEX IF EXISTS public.idx_audit_created;
DROP INDEX IF EXISTS public.idx_audit_action;
DROP INDEX IF EXISTS public.idx_api_usage_tenant;
DROP INDEX IF EXISTS public.idx_api_usage_created_at;
DROP INDEX IF EXISTS public.idx_analytics_snapshots_tenant_id;
DROP INDEX IF EXISTS public.idx_analytics_snapshots_property_id;
DROP INDEX IF EXISTS public.idx_analytics_snapshots_owner_id;
DROP INDEX IF EXISTS public."IDX_session_expire";
DROP INDEX IF EXISTS pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i5;
DROP INDEX IF EXISTS pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i4;
DROP INDEX IF EXISTS pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i3;
DROP INDEX IF EXISTS pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i2;
DROP INDEX IF EXISTS pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i1;
DROP INDEX IF EXISTS pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i5;
DROP INDEX IF EXISTS pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i4;
DROP INDEX IF EXISTS pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i3;
DROP INDEX IF EXISTS pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i2;
DROP INDEX IF EXISTS pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i1;
DROP INDEX IF EXISTS pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i5;
DROP INDEX IF EXISTS pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i4;
DROP INDEX IF EXISTS pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i3;
DROP INDEX IF EXISTS pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i2;
DROP INDEX IF EXISTS pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i1;
DROP INDEX IF EXISTS pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i5;
DROP INDEX IF EXISTS pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i4;
DROP INDEX IF EXISTS pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i3;
DROP INDEX IF EXISTS pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i2;
DROP INDEX IF EXISTS pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i1;
DROP INDEX IF EXISTS pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i5;
DROP INDEX IF EXISTS pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i4;
DROP INDEX IF EXISTS pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i3;
DROP INDEX IF EXISTS pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i2;
DROP INDEX IF EXISTS pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i1;
DROP INDEX IF EXISTS pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i5;
DROP INDEX IF EXISTS pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i4;
DROP INDEX IF EXISTS pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i3;
DROP INDEX IF EXISTS pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i2;
DROP INDEX IF EXISTS pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i1;
DROP INDEX IF EXISTS pgboss.archive_i1;
ALTER TABLE IF EXISTS ONLY public.white_label_settings DROP CONSTRAINT IF EXISTS white_label_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.usage_meters DROP CONSTRAINT IF EXISTS usage_meters_pkey;
ALTER TABLE IF EXISTS ONLY public.units DROP CONSTRAINT IF EXISTS units_pkey;
ALTER TABLE IF EXISTS ONLY public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.staff_performance_scores DROP CONSTRAINT IF EXISTS staff_performance_scores_pkey;
ALTER TABLE IF EXISTS ONLY public.staff_messages DROP CONSTRAINT IF EXISTS staff_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.staff_message_status DROP CONSTRAINT IF EXISTS staff_message_status_pkey;
ALTER TABLE IF EXISTS ONLY public.staff_invitations DROP CONSTRAINT IF EXISTS staff_invitations_pkey;
ALTER TABLE IF EXISTS ONLY public.staff_feedback DROP CONSTRAINT IF EXISTS staff_feedback_pkey;
ALTER TABLE IF EXISTS ONLY public.session DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE IF EXISTS ONLY public.service_requests DROP CONSTRAINT IF EXISTS service_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.room_settings DROP CONSTRAINT IF EXISTS room_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.room_preparation_orders DROP CONSTRAINT IF EXISTS room_preparation_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.room_nights DROP CONSTRAINT IF EXISTS room_nights_pkey;
ALTER TABLE IF EXISTS ONLY public.revenues DROP CONSTRAINT IF EXISTS revenues_pkey;
ALTER TABLE IF EXISTS ONLY public.refund_requests DROP CONSTRAINT IF EXISTS refund_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.recurring_expenses DROP CONSTRAINT IF EXISTS recurring_expenses_pkey;
ALTER TABLE IF EXISTS ONLY public.rate_plans DROP CONSTRAINT IF EXISTS rate_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.quote_requests DROP CONSTRAINT IF EXISTS quote_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.quote_notes DROP CONSTRAINT IF EXISTS quote_notes_pkey;
ALTER TABLE IF EXISTS ONLY public.properties DROP CONSTRAINT IF EXISTS properties_pkey;
ALTER TABLE IF EXISTS ONLY public.pricing_rules DROP CONSTRAINT IF EXISTS pricing_rules_pkey;
ALTER TABLE IF EXISTS ONLY public.payroll_entries DROP CONSTRAINT IF EXISTS payroll_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.payroll_configs DROP CONSTRAINT IF EXISTS payroll_configs_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_orders DROP CONSTRAINT IF EXISTS payment_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_methods DROP CONSTRAINT IF EXISTS payment_methods_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_token_unique;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.owners DROP CONSTRAINT IF EXISTS owners_pkey;
ALTER TABLE IF EXISTS ONLY public.ota_sync_logs DROP CONSTRAINT IF EXISTS ota_sync_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.ota_integrations DROP CONSTRAINT IF EXISTS ota_integrations_pkey;
ALTER TABLE IF EXISTS ONLY public.ota_conflicts DROP CONSTRAINT IF EXISTS ota_conflicts_pkey;
ALTER TABLE IF EXISTS ONLY public.onboarding_progress DROP CONSTRAINT IF EXISTS onboarding_progress_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.no_show_records DROP CONSTRAINT IF EXISTS no_show_records_pkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.housekeeping_tasks DROP CONSTRAINT IF EXISTS housekeeping_tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.hotels DROP CONSTRAINT IF EXISTS hotels_pkey;
ALTER TABLE IF EXISTS ONLY public.financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.financial_audit_logs DROP CONSTRAINT IF EXISTS financial_audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.feature_flag_overrides DROP CONSTRAINT IF EXISTS feature_flag_overrides_pkey;
ALTER TABLE IF EXISTS ONLY public.external_bookings DROP CONSTRAINT IF EXISTS external_bookings_pkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_pkey;
ALTER TABLE IF EXISTS ONLY public.escalation_replies DROP CONSTRAINT IF EXISTS escalation_replies_pkey;
ALTER TABLE IF EXISTS ONLY public.door_action_logs DROP CONSTRAINT IF EXISTS door_action_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.devices DROP CONSTRAINT IF EXISTS devices_pkey;
ALTER TABLE IF EXISTS ONLY public.device_telemetry DROP CONSTRAINT IF EXISTS device_telemetry_pkey;
ALTER TABLE IF EXISTS ONLY public.credential_logs DROP CONSTRAINT IF EXISTS credential_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.contracts DROP CONSTRAINT IF EXISTS contracts_pkey;
ALTER TABLE IF EXISTS ONLY public.contract_acceptances DROP CONSTRAINT IF EXISTS contract_acceptances_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.cash_accounts DROP CONSTRAINT IF EXISTS cash_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_pkey;
ALTER TABLE IF EXISTS ONLY public.board_reports DROP CONSTRAINT IF EXISTS board_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.billing_info DROP CONSTRAINT IF EXISTS billing_info_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.api_usage_logs DROP CONSTRAINT IF EXISTS api_usage_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.analytics_snapshots DROP CONSTRAINT IF EXISTS analytics_snapshots_pkey;
ALTER TABLE IF EXISTS ONLY pgboss.version DROP CONSTRAINT IF EXISTS version_pkey;
ALTER TABLE IF EXISTS ONLY pgboss.subscription DROP CONSTRAINT IF EXISTS subscription_pkey;
ALTER TABLE IF EXISTS ONLY pgboss.schedule DROP CONSTRAINT IF EXISTS schedule_pkey;
ALTER TABLE IF EXISTS ONLY pgboss.queue DROP CONSTRAINT IF EXISTS queue_pkey;
ALTER TABLE IF EXISTS ONLY pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 DROP CONSTRAINT IF EXISTS jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_pkey;
ALTER TABLE IF EXISTS ONLY pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 DROP CONSTRAINT IF EXISTS jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_pkey;
ALTER TABLE IF EXISTS ONLY pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 DROP CONSTRAINT IF EXISTS j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_pkey;
ALTER TABLE IF EXISTS ONLY pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 DROP CONSTRAINT IF EXISTS j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_pkey;
ALTER TABLE IF EXISTS ONLY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 DROP CONSTRAINT IF EXISTS j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey;
ALTER TABLE IF EXISTS ONLY pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 DROP CONSTRAINT IF EXISTS j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_pkey;
ALTER TABLE IF EXISTS ONLY pgboss.job DROP CONSTRAINT IF EXISTS job_pkey;
ALTER TABLE IF EXISTS ONLY pgboss.archive DROP CONSTRAINT IF EXISTS archive_pkey;
ALTER TABLE IF EXISTS ONLY drizzle.__drizzle_migrations DROP CONSTRAINT IF EXISTS __drizzle_migrations_pkey;
ALTER TABLE IF EXISTS drizzle.__drizzle_migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.white_label_settings;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.usage_meters;
DROP TABLE IF EXISTS public.units;
DROP TABLE IF EXISTS public.subscriptions;
DROP TABLE IF EXISTS public.staff_performance_scores;
DROP TABLE IF EXISTS public.staff_messages;
DROP TABLE IF EXISTS public.staff_message_status;
DROP TABLE IF EXISTS public.staff_invitations;
DROP TABLE IF EXISTS public.staff_feedback;
DROP TABLE IF EXISTS public.session;
DROP TABLE IF EXISTS public.service_requests;
DROP TABLE IF EXISTS public.room_settings;
DROP TABLE IF EXISTS public.room_preparation_orders;
DROP TABLE IF EXISTS public.room_nights;
DROP TABLE IF EXISTS public.revenues;
DROP TABLE IF EXISTS public.refund_requests;
DROP TABLE IF EXISTS public.recurring_expenses;
DROP TABLE IF EXISTS public.rate_plans;
DROP TABLE IF EXISTS public.quote_requests;
DROP TABLE IF EXISTS public.quote_notes;
DROP TABLE IF EXISTS public.properties;
DROP TABLE IF EXISTS public.pricing_rules;
DROP TABLE IF EXISTS public.payroll_entries;
DROP TABLE IF EXISTS public.payroll_configs;
DROP TABLE IF EXISTS public.payment_orders;
DROP TABLE IF EXISTS public.payment_methods;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP TABLE IF EXISTS public.owners;
DROP TABLE IF EXISTS public.ota_sync_logs;
DROP TABLE IF EXISTS public.ota_integrations;
DROP TABLE IF EXISTS public.ota_conflicts;
DROP TABLE IF EXISTS public.onboarding_progress;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.no_show_records;
DROP TABLE IF EXISTS public.invoices;
DROP TABLE IF EXISTS public.housekeeping_tasks;
DROP TABLE IF EXISTS public.hotels;
DROP TABLE IF EXISTS public.financial_transactions;
DROP TABLE IF EXISTS public.financial_audit_logs;
DROP TABLE IF EXISTS public.feature_flag_overrides;
DROP TABLE IF EXISTS public.external_bookings;
DROP TABLE IF EXISTS public.expenses;
DROP TABLE IF EXISTS public.escalation_replies;
DROP TABLE IF EXISTS public.door_action_logs;
DROP TABLE IF EXISTS public.devices;
DROP TABLE IF EXISTS public.device_telemetry;
DROP TABLE IF EXISTS public.credential_logs;
DROP TABLE IF EXISTS public.contracts;
DROP TABLE IF EXISTS public.contract_acceptances;
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.cash_accounts;
DROP TABLE IF EXISTS public.bookings;
DROP TABLE IF EXISTS public.board_reports;
DROP TABLE IF EXISTS public.billing_info;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.api_usage_logs;
DROP TABLE IF EXISTS public.analytics_snapshots;
DROP TABLE IF EXISTS pgboss.version;
DROP TABLE IF EXISTS pgboss.subscription;
DROP TABLE IF EXISTS pgboss.schedule;
DROP TABLE IF EXISTS pgboss.queue;
DROP TABLE IF EXISTS pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260;
DROP TABLE IF EXISTS pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989;
DROP TABLE IF EXISTS pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571;
DROP TABLE IF EXISTS pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94;
DROP TABLE IF EXISTS pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3;
DROP TABLE IF EXISTS pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21;
DROP TABLE IF EXISTS pgboss.job;
DROP TABLE IF EXISTS pgboss.archive;
DROP SEQUENCE IF EXISTS drizzle.__drizzle_migrations_id_seq;
DROP TABLE IF EXISTS drizzle.__drizzle_migrations;
DROP FUNCTION IF EXISTS pgboss.delete_queue(queue_name text);
DROP FUNCTION IF EXISTS pgboss.create_queue(queue_name text, options json);
DROP TYPE IF EXISTS pgboss.job_state;
DROP SCHEMA IF EXISTS pgboss;
DROP SCHEMA IF EXISTS drizzle;
--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


--
-- Name: pgboss; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgboss;


--
-- Name: job_state; Type: TYPE; Schema: pgboss; Owner: -
--

CREATE TYPE pgboss.job_state AS ENUM (
    'created',
    'retry',
    'active',
    'completed',
    'cancelled',
    'failed'
);


--
-- Name: create_queue(text, json); Type: FUNCTION; Schema: pgboss; Owner: -
--

CREATE FUNCTION pgboss.create_queue(queue_name text, options json) RETURNS void
    LANGUAGE plpgsql
    AS $_$
    DECLARE
      table_name varchar := 'j' || encode(sha224(queue_name::bytea), 'hex');
      queue_created_on timestamptz;
    BEGIN

      WITH q as (
      INSERT INTO pgboss.queue (
        name,
        policy,
        retry_limit,
        retry_delay,
        retry_backoff,
        expire_seconds,
        retention_minutes,
        dead_letter,
        partition_name
      )
      VALUES (
        queue_name,
        options->>'policy',
        (options->>'retryLimit')::int,
        (options->>'retryDelay')::int,
        (options->>'retryBackoff')::bool,
        (options->>'expireInSeconds')::int,
        (options->>'retentionMinutes')::int,
        options->>'deadLetter',
        table_name
      )
      ON CONFLICT DO NOTHING
      RETURNING created_on
      )
      SELECT created_on into queue_created_on from q;

      IF queue_created_on IS NULL THEN
        RETURN;
      END IF;

      EXECUTE format('CREATE TABLE pgboss.%I (LIKE pgboss.job INCLUDING DEFAULTS)', table_name);

      EXECUTE format('ALTER TABLE pgboss.%1$I ADD PRIMARY KEY (name, id)', table_name);
      EXECUTE format('ALTER TABLE pgboss.%1$I ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
      EXECUTE format('ALTER TABLE pgboss.%1$I ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i1 ON pgboss.%1$I (name, COALESCE(singleton_key, '''')) WHERE state = ''created'' AND policy = ''short''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i2 ON pgboss.%1$I (name, COALESCE(singleton_key, '''')) WHERE state = ''active'' AND policy = ''singleton''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i3 ON pgboss.%1$I (name, state, COALESCE(singleton_key, '''')) WHERE state <= ''active'' AND policy = ''stately''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i4 ON pgboss.%1$I (name, singleton_on, COALESCE(singleton_key, '''')) WHERE state <> ''cancelled'' AND singleton_on IS NOT NULL', table_name);
      EXECUTE format('CREATE INDEX %1$s_i5 ON pgboss.%1$I (name, start_after) INCLUDE (priority, created_on, id) WHERE state < ''active''', table_name);

      EXECUTE format('ALTER TABLE pgboss.%I ADD CONSTRAINT cjc CHECK (name=%L)', table_name, queue_name);
      EXECUTE format('ALTER TABLE pgboss.job ATTACH PARTITION pgboss.%I FOR VALUES IN (%L)', table_name, queue_name);
    END;
    $_$;


--
-- Name: delete_queue(text); Type: FUNCTION; Schema: pgboss; Owner: -
--

CREATE FUNCTION pgboss.delete_queue(queue_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
      table_name varchar;
    BEGIN
      WITH deleted as (
        DELETE FROM pgboss.queue
        WHERE name = queue_name
        RETURNING partition_name
      )
      SELECT partition_name from deleted INTO table_name;

      EXECUTE format('DROP TABLE IF EXISTS pgboss.%I', table_name);
    END;
    $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: archive; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.archive (
    id uuid NOT NULL,
    name text NOT NULL,
    priority integer NOT NULL,
    data jsonb,
    state pgboss.job_state NOT NULL,
    retry_limit integer NOT NULL,
    retry_count integer NOT NULL,
    retry_delay integer NOT NULL,
    retry_backoff boolean NOT NULL,
    start_after timestamp with time zone NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval NOT NULL,
    created_on timestamp with time zone NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    archived_on timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: job; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.job (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text
)
PARTITION BY LIST (name);


--
-- Name: j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'subscription-renewal-check'::text))
);


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = '__pgboss__send-it'::text))
);


--
-- Name: j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'payment-retry'::text))
);


--
-- Name: j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'database-backup'::text))
);


--
-- Name: jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'subscription-renewal'::text))
);


--
-- Name: jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'database-backup-schedule'::text))
);


--
-- Name: queue; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.queue (
    name text NOT NULL,
    policy text,
    retry_limit integer,
    retry_delay integer,
    retry_backoff boolean,
    expire_seconds integer,
    retention_minutes integer,
    dead_letter text,
    partition_name text,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    updated_on timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schedule; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.schedule (
    name text NOT NULL,
    cron text NOT NULL,
    timezone text,
    data jsonb,
    options jsonb,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    updated_on timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subscription; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.subscription (
    event text NOT NULL,
    name text NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    updated_on timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: version; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.version (
    version integer NOT NULL,
    maintained_on timestamp with time zone,
    cron_on timestamp with time zone,
    monitored_on timestamp with time zone
);


--
-- Name: analytics_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_snapshots (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying NOT NULL,
    property_id character varying,
    snapshot_type text NOT NULL,
    period text NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: api_usage_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_usage_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    endpoint text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying,
    property_id character varying,
    user_id character varying,
    user_role text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id character varying,
    description text,
    previous_values jsonb,
    new_values jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: billing_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_info (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    payment_method_last4 text,
    payment_method_brand text,
    billing_email text,
    billing_name text,
    billing_address jsonb,
    current_period_start timestamp without time zone,
    current_period_end timestamp without time zone,
    cancel_at_period_end boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: board_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_reports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reporter_name text NOT NULL,
    region text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    contract_ids text[],
    period_start timestamp without time zone,
    period_end timestamp without time zone,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    guest_id character varying NOT NULL,
    room_number text NOT NULL,
    room_type text NOT NULL,
    check_in_date timestamp without time zone NOT NULL,
    check_out_date timestamp without time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    pre_checked_in boolean DEFAULT false,
    special_requests text,
    created_at timestamp without time zone DEFAULT now(),
    booking_number text,
    booking_source text,
    number_of_guests integer,
    nationality text,
    passport_number text,
    special_notes text,
    owner_id character varying,
    property_id character varying,
    unit_id character varying,
    nightly_rate integer,
    total_price integer,
    currency text DEFAULT 'USD'::text,
    discount integer,
    tenant_id character varying,
    travel_agency_name text,
    date_of_birth text,
    guest_address text,
    arrival_time text,
    pre_check_notes text,
    rejection_reason text,
    payment_status text DEFAULT 'unpaid'::text,
    guest_signature_base64 text,
    id_document_base64 text,
    rate_plan_id character varying
);


--
-- Name: cash_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cash_accounts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hotel_id character varying NOT NULL,
    property_id character varying,
    owner_id character varying,
    account_type text DEFAULT 'cash'::text NOT NULL,
    account_name text NOT NULL,
    balance integer DEFAULT 0 NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    last_updated timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hotel_id character varying NOT NULL,
    guest_id character varying NOT NULL,
    sender_id character varying NOT NULL,
    sender_role text NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    property_id character varying,
    thread_type text DEFAULT 'guest_service'::text NOT NULL,
    escalated_by character varying,
    escalation_note text,
    tenant_id character varying
);


--
-- Name: contract_acceptances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_acceptances (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying NOT NULL,
    tenant_id character varying,
    user_id character varying NOT NULL,
    plan_code text NOT NULL,
    plan_type text NOT NULL,
    smart_plan_type text,
    contract_version text NOT NULL,
    property_name text,
    monthly_price integer NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    accepted_at timestamp without time zone NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT now(),
    contract_language text DEFAULT 'EN'::text NOT NULL
);


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    region text NOT NULL,
    country text NOT NULL,
    client_name text NOT NULL,
    contract_value integer NOT NULL,
    currency text DEFAULT 'AZN'::text NOT NULL,
    partner_company text,
    partner_commission_percent integer DEFAULT 20 NOT NULL,
    tax_percent integer DEFAULT 18 NOT NULL,
    state_fee_percent integer DEFAULT 10 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    notes text,
    signed_date timestamp without time zone,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: credential_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credential_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    guest_id character varying NOT NULL,
    action text NOT NULL,
    performed_by character varying NOT NULL,
    performed_by_name text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: device_telemetry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_telemetry (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    device_id character varying NOT NULL,
    metric_name text NOT NULL,
    metric_value real,
    string_value text,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    unit_id character varying,
    property_id character varying NOT NULL,
    owner_id character varying NOT NULL,
    device_type text NOT NULL,
    name text NOT NULL,
    manufacturer text,
    model text,
    serial_number text,
    status text DEFAULT 'offline'::text NOT NULL,
    last_ping timestamp without time zone,
    metadata jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    ip_address text,
    mac_address text,
    firmware_version text,
    hardware_version text,
    last_online timestamp without time zone,
    battery_level integer,
    signal_strength integer,
    capabilities text[],
    configuration jsonb,
    installed_at timestamp without time zone,
    tenant_id character varying
);


--
-- Name: door_action_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.door_action_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    booking_id character varying NOT NULL,
    guest_id character varying NOT NULL,
    room_number text NOT NULL,
    action text NOT NULL,
    performed_by text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: escalation_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.escalation_replies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    escalation_id character varying NOT NULL,
    user_id character varying NOT NULL,
    message text NOT NULL,
    tenant_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hotel_id character varying NOT NULL,
    property_id character varying,
    owner_id character varying,
    recurring_expense_id character varying,
    category text NOT NULL,
    description text NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    vendor text,
    receipt_url text,
    source_type text DEFAULT 'staff_input'::text NOT NULL,
    period_month integer,
    period_year integer,
    created_by character varying,
    created_by_name text,
    approved_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: external_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_bookings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hotel_id character varying,
    tenant_id character varying,
    source text,
    external_id text,
    guest_name text,
    checkin_date text,
    checkout_date text,
    room_name text,
    price real,
    status text DEFAULT 'confirmed'::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: feature_flag_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flag_overrides (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying NOT NULL,
    feature_name text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    reason text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: financial_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_audit_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hotel_id character varying NOT NULL,
    transaction_id character varying NOT NULL,
    action text NOT NULL,
    performed_by character varying NOT NULL,
    performed_by_name text NOT NULL,
    previous_values jsonb,
    new_values jsonb,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: financial_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hotel_id character varying NOT NULL,
    guest_id character varying,
    booking_id character varying,
    room_number text,
    category text NOT NULL,
    description text NOT NULL,
    amount integer NOT NULL,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    payment_method text,
    notes text,
    created_by character varying NOT NULL,
    created_by_name text NOT NULL,
    voided_at timestamp without time zone,
    voided_by character varying,
    void_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    owner_id character varying,
    property_id character varying,
    transaction_reference text,
    tenant_id character varying
);


--
-- Name: hotels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hotels (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    email text,
    logo_url text,
    created_at timestamp without time zone DEFAULT now(),
    country text,
    city text,
    postal_code text,
    website text,
    star_rating text,
    total_rooms integer,
    number_of_floors integer,
    building_type text,
    primary_guest_type text,
    has_smart_devices boolean DEFAULT false,
    smart_door_locks boolean DEFAULT false,
    smart_hvac boolean DEFAULT false,
    smart_lighting boolean DEFAULT false,
    pms_system boolean DEFAULT false,
    bms_system boolean DEFAULT false,
    iot_sensors boolean DEFAULT false,
    pms_software text,
    pms_other text,
    expected_smart_room_count integer,
    billing_currency text,
    billing_contact_email text,
    owner_id character varying,
    property_id character varying,
    tenant_id character varying
);


--
-- Name: housekeeping_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.housekeeping_tasks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    property_id character varying NOT NULL,
    unit_id character varying NOT NULL,
    room_number text NOT NULL,
    task_type text NOT NULL,
    cleaning_type text,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'normal'::text,
    assigned_to character varying,
    trigger_source text NOT NULL,
    notes text,
    due_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    booking_id character varying
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying NOT NULL,
    stripe_invoice_id text,
    amount integer NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    description text,
    invoice_url text,
    pdf_url text,
    period_start timestamp without time zone,
    period_end timestamp without time zone,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying,
    invoice_number text,
    pdf_path text
);


--
-- Name: no_show_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.no_show_records (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hotel_id character varying NOT NULL,
    booking_id character varying NOT NULL,
    guest_id character varying NOT NULL,
    room_number text NOT NULL,
    expected_check_in timestamp without time zone NOT NULL,
    estimated_revenue_loss integer,
    recorded_by character varying NOT NULL,
    recorded_by_name text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    read boolean DEFAULT false,
    action_url text,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: onboarding_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_progress (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying NOT NULL,
    current_step integer DEFAULT 1 NOT NULL,
    completed_steps integer[] DEFAULT '{}'::integer[],
    account_completed boolean DEFAULT false,
    property_completed boolean DEFAULT false,
    units_completed boolean DEFAULT false,
    subscription_completed boolean DEFAULT false,
    devices_completed boolean DEFAULT false,
    is_complete boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id character varying,
    smart_system_completed boolean DEFAULT false,
    staff_completed boolean DEFAULT false
);


--
-- Name: ota_conflicts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ota_conflicts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    external_id text NOT NULL,
    property_id character varying NOT NULL,
    tenant_id character varying,
    unit_id character varying,
    check_in text,
    check_out text,
    guest_name text,
    reason text NOT NULL,
    resolved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ota_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ota_integrations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    property_id character varying NOT NULL,
    tenant_id character varying,
    provider text NOT NULL,
    api_key text,
    api_secret text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ota_sync_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ota_sync_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    property_id character varying NOT NULL,
    tenant_id character varying,
    action text NOT NULL,
    status text NOT NULL,
    response text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: owners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owners (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    company_name text,
    country text,
    city text,
    address text,
    logo_url text,
    created_at timestamp without time zone DEFAULT now(),
    status text DEFAULT 'active'::text NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_methods (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    label text NOT NULL,
    type text DEFAULT 'bank_transfer'::text NOT NULL,
    currency text DEFAULT 'AZN'::text NOT NULL,
    details jsonb NOT NULL,
    instructions text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: payment_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying NOT NULL,
    tenant_id character varying,
    plan_type text NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'AZN'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method_id character varying,
    customer_note text,
    admin_note text,
    transfer_reference text,
    reviewed_by character varying,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    order_type text DEFAULT 'subscription'::text,
    reference_id character varying
);


--
-- Name: payroll_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_configs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hotel_id character varying NOT NULL,
    property_id character varying,
    owner_id character varying,
    staff_id character varying NOT NULL,
    staff_name text NOT NULL,
    staff_role text NOT NULL,
    base_salary integer NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    frequency text DEFAULT 'monthly'::text NOT NULL,
    bonus_rules text,
    deduction_rules text,
    bank_details text,
    is_active boolean DEFAULT true NOT NULL,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: payroll_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_entries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hotel_id character varying NOT NULL,
    property_id character varying,
    owner_id character varying,
    payroll_config_id character varying NOT NULL,
    staff_id character varying NOT NULL,
    staff_name text NOT NULL,
    amount integer NOT NULL,
    bonus_amount integer DEFAULT 0,
    deduction_amount integer DEFAULT 0,
    net_amount integer NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    period_month integer NOT NULL,
    period_year integer NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    paid_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: pricing_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pricing_rules (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    property_id character varying NOT NULL,
    tenant_id character varying,
    name text NOT NULL,
    rule_type text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    conditions jsonb NOT NULL,
    adjustment jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.properties (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'hotel'::text NOT NULL,
    address text,
    phone text,
    email text,
    logo_url text,
    country text,
    city text,
    postal_code text,
    website text,
    star_rating text,
    total_units integer,
    number_of_floors integer,
    building_type text,
    primary_guest_type text,
    has_smart_devices boolean DEFAULT false,
    smart_door_locks boolean DEFAULT false,
    smart_hvac boolean DEFAULT false,
    smart_lighting boolean DEFAULT false,
    pms_system boolean DEFAULT false,
    bms_system boolean DEFAULT false,
    iot_sensors boolean DEFAULT false,
    pms_software text,
    pms_other text,
    expected_smart_room_count integer,
    billing_currency text,
    billing_contact_email text,
    timezone text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying,
    image_url text
);


--
-- Name: quote_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quote_notes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    quote_request_id character varying NOT NULL,
    author_user_id character varying NOT NULL,
    note_text text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: quote_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quote_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hotel_name text NOT NULL,
    contact_name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    country text NOT NULL,
    city text NOT NULL,
    preferred_contact_hours text,
    timezone text,
    preferred_contact_method text,
    total_rooms integer,
    expected_smart_rooms integer,
    interested_features text[],
    message text,
    source_page text NOT NULL,
    language text DEFAULT 'en'::text,
    status text DEFAULT 'NEW'::text NOT NULL,
    internal_notes text,
    email_sent boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    assigned_to_user_id character varying,
    contacted_at timestamp without time zone
);


--
-- Name: rate_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_plans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    property_id character varying NOT NULL,
    tenant_id character varying,
    name text NOT NULL,
    refund_policy text DEFAULT 'flexible'::text NOT NULL,
    meal_plan text DEFAULT 'none'::text NOT NULL,
    price_modifier real DEFAULT 0 NOT NULL,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: recurring_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_expenses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hotel_id character varying NOT NULL,
    property_id character varying,
    owner_id character varying,
    category text NOT NULL,
    description text NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    frequency text DEFAULT 'monthly'::text NOT NULL,
    vendor text,
    is_active boolean DEFAULT true NOT NULL,
    next_run_at timestamp without time zone,
    last_run_at timestamp without time zone,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: refund_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refund_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    invoice_id character varying NOT NULL,
    transaction_id character varying,
    owner_id character varying NOT NULL,
    tenant_id character varying,
    amount integer NOT NULL,
    currency text DEFAULT 'AZN'::text NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    requested_by character varying NOT NULL,
    approved_by character varying,
    rejected_by character varying,
    rejection_reason text,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: revenues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revenues (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hotel_id character varying NOT NULL,
    property_id character varying,
    owner_id character varying,
    booking_id character varying,
    guest_id character varying,
    transaction_id character varying,
    room_number text,
    category text DEFAULT 'room_booking'::text NOT NULL,
    description text NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    payment_method text,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    source_type text DEFAULT 'auto'::text NOT NULL,
    created_by character varying,
    created_by_name text,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: room_nights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_nights (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    unit_id character varying NOT NULL,
    date date NOT NULL,
    booking_id character varying NOT NULL,
    tenant_id character varying,
    property_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: room_preparation_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_preparation_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    guest_id character varying NOT NULL,
    hotel_id character varying NOT NULL,
    room_number text NOT NULL,
    occasion_type text NOT NULL,
    decoration_style text,
    add_ons text[],
    notes text,
    budget_range text DEFAULT 'medium'::text NOT NULL,
    custom_budget integer,
    preferred_datetime timestamp without time zone,
    reference_image_url text,
    price integer,
    status text DEFAULT 'pending'::text NOT NULL,
    staff_assigned character varying,
    admin_notes text,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    owner_id character varying,
    property_id character varying,
    tenant_id character varying
);


--
-- Name: room_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    booking_id character varying NOT NULL,
    temperature integer DEFAULT 22,
    lights_on boolean DEFAULT false,
    lights_brightness integer DEFAULT 50,
    curtains_open boolean DEFAULT false,
    jacuzzi_on boolean DEFAULT false,
    jacuzzi_temperature integer DEFAULT 38,
    welcome_mode boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now(),
    door_locked boolean DEFAULT true,
    curtains_position integer DEFAULT 0,
    bathroom_lights_on boolean DEFAULT false,
    bathroom_lights_brightness integer DEFAULT 50,
    hall_lights_on boolean DEFAULT false,
    hall_lights_brightness integer DEFAULT 50,
    non_dimmable_lights_on boolean DEFAULT false,
    tenant_id character varying
);


--
-- Name: service_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    guest_id character varying NOT NULL,
    booking_id character varying NOT NULL,
    room_number text NOT NULL,
    request_type text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'normal'::text,
    assigned_to character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    owner_id character varying,
    property_id character varying,
    tenant_id character varying
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: staff_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_feedback (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying NOT NULL,
    staff_id character varying NOT NULL,
    hotel_id character varying NOT NULL,
    tenant_id character varying,
    type text NOT NULL,
    reason text,
    score_impact real NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: staff_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_invitations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    property_id character varying NOT NULL,
    owner_id character varying NOT NULL,
    email text NOT NULL,
    staff_role text DEFAULT 'front_desk'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    invited_by character varying NOT NULL,
    accepted_by character varying,
    invite_token text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: staff_message_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_message_status (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    message_id character varying NOT NULL,
    staff_id character varying NOT NULL,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone
);


--
-- Name: staff_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hotel_id character varying NOT NULL,
    tenant_id character varying,
    sender_role text DEFAULT 'owner'::text NOT NULL,
    sender_id character varying NOT NULL,
    message_text text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: staff_performance_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_performance_scores (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    staff_id character varying NOT NULL,
    hotel_id character varying NOT NULL,
    tenant_id character varying,
    message_response_score real DEFAULT 0,
    task_completion_score real DEFAULT 0,
    service_quality_score real DEFAULT 0,
    activity_score real DEFAULT 0,
    manual_adjustment real DEFAULT 0,
    total_score real DEFAULT 0,
    period text NOT NULL,
    calculated_at timestamp without time zone DEFAULT now()
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying NOT NULL,
    plan_type text DEFAULT 'basic'::text NOT NULL,
    feature_flags jsonb DEFAULT '{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}'::jsonb,
    max_properties integer DEFAULT 1,
    max_units_per_property integer DEFAULT 50,
    start_date timestamp without time zone DEFAULT now(),
    end_date timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying,
    trial_ends_at timestamp without time zone,
    smart_plan_type text DEFAULT 'none'::text,
    max_staff integer DEFAULT 5,
    multi_property boolean DEFAULT false,
    performance_enabled boolean DEFAULT false,
    staff_performance_enabled boolean DEFAULT false,
    advanced_analytics boolean DEFAULT false,
    priority_support boolean DEFAULT false,
    custom_integrations boolean DEFAULT false,
    smart_rooms_enabled boolean DEFAULT false,
    guest_management boolean DEFAULT true,
    staff_management boolean DEFAULT false,
    plan_code text DEFAULT 'CORE_STARTER'::text,
    status text DEFAULT 'active'::text NOT NULL,
    current_period_start timestamp without time zone DEFAULT now(),
    current_period_end timestamp without time zone,
    auto_renew boolean DEFAULT true NOT NULL,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    failed_payment_attempts integer DEFAULT 0 NOT NULL,
    last_payment_order_id character varying,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    property_id character varying NOT NULL,
    owner_id character varying NOT NULL,
    unit_number text NOT NULL,
    unit_type text DEFAULT 'room'::text NOT NULL,
    name text,
    floor integer,
    capacity integer DEFAULT 2,
    description text,
    amenities text[],
    price_per_night integer,
    status text DEFAULT 'available'::text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    unit_category text DEFAULT 'accommodation'::text NOT NULL,
    tenant_id character varying
);


--
-- Name: usage_meters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_meters (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying NOT NULL,
    metric_type text NOT NULL,
    current_value integer DEFAULT 0 NOT NULL,
    max_allowed integer NOT NULL,
    last_updated timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'guest'::text NOT NULL,
    full_name text NOT NULL,
    email text,
    phone text,
    avatar_url text,
    created_at timestamp without time zone DEFAULT now(),
    hotel_id character varying,
    language text DEFAULT 'en'::text,
    phone_country_code text,
    owner_id character varying,
    property_id character varying,
    tenant_id character varying
);


--
-- Name: white_label_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.white_label_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying NOT NULL,
    logo_url text,
    favicon_url text,
    primary_color text,
    secondary_color text,
    accent_color text,
    custom_domain text,
    company_name text,
    hide_branding boolean DEFAULT false,
    custom_css text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


--
-- Name: j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21; Type: TABLE ATTACH; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 FOR VALUES IN ('subscription-renewal-check');


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3; Type: TABLE ATTACH; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 FOR VALUES IN ('__pgboss__send-it');


--
-- Name: j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94; Type: TABLE ATTACH; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 FOR VALUES IN ('payment-retry');


--
-- Name: j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571; Type: TABLE ATTACH; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 FOR VALUES IN ('database-backup');


--
-- Name: jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989; Type: TABLE ATTACH; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 FOR VALUES IN ('subscription-renewal');


--
-- Name: jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260; Type: TABLE ATTACH; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 FOR VALUES IN ('database-backup-schedule');


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: -
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	86843c8dee670d9f1201585a8aeb4a911f49be6ae6d6bd925e769bb3860aac3e	1772443702456
2	cf1672a51b37665303b5131b3421b8c6caee5bf8ec60cdafd2cc3b89ed46f192	1772443835335
3	4790a4124bb4a0b2bb6c6846701b396a5f13d23a89ecbce64ad69a5d3d32b5de	1772447166837
4	0be6af1d753eec0e3073d8ac0214e3d70bb986d4feeea847ae3afed3f0d74bfc	1772455000000
5	981c49b104a613801389ec3dec561c26f0b7fb910f0061f06e69d290dc3a97a5	1772627000000
6	c9bce104ff6c420a7ce3d2be69b013b394340943eac1491a7d324e8e1bcf7134	1772628000000
7	b177afe341c3b5063444833ebe8e81ffee1f4ed3a4d132a25bd1b42cbc93052b	1772632000000
8	715bcae96ad365c1d30db8df82802e0a4269acefb3a6c53b6dbdbaf888731db4	1772730000000
9	46c34b661eeff6cd874ab721e26ebbb580d6d2ee86c8d746341ea236e4e7123e	1772810000000
10	319e0607699cc9e4e94aa8cf105042d3457ebaca665e38e604b05d46ace9e3de	1772900000000
11	79810700cd19c79121dc1bba96fc13951010362e6abed4ba9062314f1b93a55b	1772986000000
12	4cb3c495fdd659a3d9aa9975e022e3554f37846d31884ca1759026ca7feb95e1	1773072000000
13	324f755fd11ff994f5845f27273725b51486253ac85c7edf46d5d7087f9e96b2	1773158000000
\.


--
-- Data for Name: archive; Type: TABLE DATA; Schema: pgboss; Owner: -
--

COPY pgboss.archive (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy, archived_on) FROM stdin;
416aede6-6256-4839-b5f7-1b40a7bc5796	__pgboss__send-it	0	{"tz": "Asia/Baku", "data": {}, "name": "database-backup"}	completed	3	0	30	f	2026-03-08 23:00:49.211628+00	2026-03-08 23:00:50.315275+00	database-backup	2026-03-08 23:00:00	00:05:00	2026-03-08 23:00:49.211628+00	2026-03-08 23:00:50.325702+00	2026-03-15 23:00:49.211628+00	\N	\N	standard	2026-03-10 08:14:32.946834+00
e772eee3-e7c0-457a-a46d-42b24d858a40	__pgboss__send-it	0	{"tz": "Asia/Baku", "data": {}, "name": "database-backup-schedule"}	completed	3	0	30	f	2026-03-08 23:00:49.211628+00	2026-03-08 23:00:50.315275+00	database-backup-schedule	2026-03-08 23:00:00	00:05:00	2026-03-08 23:00:49.211628+00	2026-03-08 23:00:50.325702+00	2026-03-15 23:00:49.211628+00	\N	\N	standard	2026-03-10 08:14:32.946834+00
c4ff18b9-01ac-4288-ba0e-42878d676521	database-backup	0	{}	completed	3	0	30	f	2026-03-08 23:00:50.319689+00	2026-03-08 23:00:51.514035+00	\N	\N	00:05:00	2026-03-08 23:00:50.319689+00	2026-03-08 23:00:52.090225+00	2026-03-15 23:00:50.319689+00	\N	\N	standard	2026-03-10 08:14:32.946834+00
\.


--
-- Data for Name: j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21; Type: TABLE DATA; Schema: pgboss; Owner: -
--

COPY pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
\.


--
-- Data for Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3; Type: TABLE DATA; Schema: pgboss; Owner: -
--

COPY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
\.


--
-- Data for Name: j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94; Type: TABLE DATA; Schema: pgboss; Owner: -
--

COPY pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
\.


--
-- Data for Name: j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571; Type: TABLE DATA; Schema: pgboss; Owner: -
--

COPY pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
\.


--
-- Data for Name: jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989; Type: TABLE DATA; Schema: pgboss; Owner: -
--

COPY pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
\.


--
-- Data for Name: jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260; Type: TABLE DATA; Schema: pgboss; Owner: -
--

COPY pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
d8ec6073-8526-4a05-9bb1-d425e23f46e5	database-backup-schedule	0	{}	created	3	0	30	f	2026-03-08 23:00:50.319689+00	\N	\N	\N	00:05:00	2026-03-08 23:00:50.319689+00	\N	2026-03-15 23:00:50.319689+00	\N	\N	standard
\.


--
-- Data for Name: queue; Type: TABLE DATA; Schema: pgboss; Owner: -
--

COPY pgboss.queue (name, policy, retry_limit, retry_delay, retry_backoff, expire_seconds, retention_minutes, dead_letter, partition_name, created_on, updated_on) FROM stdin;
__pgboss__send-it	standard	\N	\N	\N	\N	\N	\N	j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3	2026-03-02 09:38:06.124941+00	2026-03-02 09:38:06.124941+00
subscription-renewal	standard	\N	\N	\N	\N	\N	\N	jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989	2026-03-05 14:53:40.272792+00	2026-03-05 14:53:40.272792+00
subscription-renewal-check	standard	\N	\N	\N	\N	\N	\N	j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21	2026-03-05 14:53:40.444367+00	2026-03-05 14:53:40.444367+00
payment-retry	standard	\N	\N	\N	\N	\N	\N	j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94	2026-03-05 15:02:10.566115+00	2026-03-05 15:02:10.566115+00
database-backup	standard	\N	\N	\N	\N	\N	\N	j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571	2026-03-05 16:14:39.164244+00	2026-03-05 16:14:39.164244+00
database-backup-schedule	standard	\N	\N	\N	\N	\N	\N	jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260	2026-03-05 16:14:39.272611+00	2026-03-05 16:14:39.272611+00
\.


--
-- Data for Name: schedule; Type: TABLE DATA; Schema: pgboss; Owner: -
--

COPY pgboss.schedule (name, cron, timezone, data, options, created_on, updated_on) FROM stdin;
subscription-renewal-check	0 6 * * *	Asia/Baku	{}	{"tz": "Asia/Baku"}	2026-03-05 14:53:40.480428+00	2026-03-11 11:55:02.856337+00
database-backup	0 3 * * *	Asia/Baku	{}	{"tz": "Asia/Baku"}	2026-03-05 16:15:44.66649+00	2026-03-11 11:55:02.86875+00
database-backup-schedule	0 3 * * *	Asia/Baku	{}	{"tz": "Asia/Baku"}	2026-03-05 16:14:39.29528+00	2026-03-05 16:14:39.29528+00
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: pgboss; Owner: -
--

COPY pgboss.subscription (event, name, created_on, updated_on) FROM stdin;
\.


--
-- Data for Name: version; Type: TABLE DATA; Schema: pgboss; Owner: -
--

COPY pgboss.version (version, maintained_on, cron_on, monitored_on) FROM stdin;
24	2026-03-11 13:31:02.578342+00	2026-03-11 13:32:02.626494+00	\N
\.


--
-- Data for Name: analytics_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analytics_snapshots (id, owner_id, property_id, snapshot_type, period, data, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: api_usage_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_usage_logs (id, tenant_id, endpoint, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, owner_id, property_id, user_id, user_role, action, entity_type, entity_id, description, previous_values, new_values, ip_address, user_agent, created_at, tenant_id) FROM stdin;
a8cd7acc-f9f3-417f-bf2f-b6aea7321494	\N	\N	00d0a7ca-27e4-417a-9274-b16597f0cab0	\N	user_logout	user	00d0a7ca-27e4-417a-9274-b16597f0cab0	User logged out	\N	\N	\N	\N	2026-02-28 13:16:12.713062	\N
c1c34f8d-87a3-4a82-b057-db00a4174030	\N	\N	62797tA7	\N	user_logout	user	62797tA7	User logged out	\N	\N	\N	\N	2026-03-11 12:46:56.331621	\N
df4f100b-24fb-4f7f-9945-1bb679b4aa63	\N	\N	demo_staff_1	admin	user_login	user	demo_staff_1	User demo_staff logged in	\N	\N	127.0.0.1	curl/8.14.1	2026-02-13 14:52:08.561364	\N
3bfd83d8-8f58-4b5c-b8ea-eff6eb13342f	\N	\N	0803ee24-dc71-430a-9b76-4d4885a624be	guest	user_login	user	0803ee24-dc71-430a-9b76-4d4885a624be	User GUEST-474089Y1J logged in	\N	\N	127.0.0.1	curl/8.14.1	2026-02-13 17:21:53.54921	\N
f548b865-92cb-4acc-aeb8-737b5406a483	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	oss_super_admin	user_login	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User oss_admin logged in	\N	\N	10.81.0.79	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-27 11:27:56.030195	\N
057519a3-9dd7-4cf4-ad2b-8b1bf650332d	87772a76-ada5-4dc6-bacf-9e949d17ffc6	\N	1a992ff9-d50f-4ec3-9721-12560d2c0e62	owner_admin	user_login	user	1a992ff9-d50f-4ec3-9721-12560d2c0e62	User testadmin_lvPwUO logged in	\N	\N	10.81.8.109	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-14 14:41:58.480455	\N
7086d136-dd5a-43eb-abfc-18cf88301c7c	87772a76-ada5-4dc6-bacf-9e949d17ffc6	\N	1a992ff9-d50f-4ec3-9721-12560d2c0e62	owner_admin	staff_created	user	da401877-b991-474d-a193-acba0451280c	Created Reception Test OQi8 as front_desk for property Test Hotel	\N	\N	\N	\N	2026-02-14 14:43:20.888734	\N
dee4b618-7c23-48ec-99f4-85897904d400	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	oss_super_admin	user_login	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User oss_admin logged in	\N	\N	10.81.0.79	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-28 13:16:19.697658	\N
2e5b39c4-5abb-42cc-b807-4ed587e2652f	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	oss_super_admin	user_login	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User oss_admin logged in	\N	\N	10.81.0.129	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-19 07:00:20.033076	\N
42c8162b-19d9-4f4c-9bc6-608427644117	\N	\N	496c7a53-8626-4252-9c54-dd65e6b99f71	\N	user_logout	user	496c7a53-8626-4252-9c54-dd65e6b99f71	User logged out	\N	\N	\N	\N	2026-03-04 13:43:02.036839	\N
4cf338ef-306a-4bdc-a008-73b706d70173	afa0de93-1326-4fe4-a339-f65121ba4bcb	\N	8317f3c8-f1f9-4b9f-8570-25968af7ef28	owner_admin	user_login	user	8317f3c8-f1f9-4b9f-8570-25968af7ef28	User test7 logged in	\N	\N	10.81.1.43	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-19 16:41:34.049993	\N
fc5e258a-f42a-49eb-ad6d-b5374df16b26	afa0de93-1326-4fe4-a339-f65121ba4bcb	\N	8317f3c8-f1f9-4b9f-8570-25968af7ef28	owner_admin	staff_invited	staff_invitation	df71356f-946e-480c-b13d-c595500d2296	Invited ramin.v@orange-studio.az as front_desk to property tt	\N	\N	\N	\N	2026-02-19 16:42:15.151382	\N
39aae78f-28d3-412b-9a85-f87d21ad76b6	\N	\N	8317f3c8-f1f9-4b9f-8570-25968af7ef28	\N	user_logout	user	8317f3c8-f1f9-4b9f-8570-25968af7ef28	User logged out	\N	\N	\N	\N	2026-02-19 16:42:45.11221	\N
1c7ae114-cb9c-417a-8eb4-09d73d50d1f8	02d18ce6-ec09-48c3-948e-741eeceaee86	\N	cedfcf50-2d94-4699-9dd1-1a1b11c14824	owner_admin	user_login	user	cedfcf50-2d94-4699-9dd1-1a1b11c14824	User test8 logged in	\N	\N	10.81.8.75	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-19 16:43:43.937806	\N
2e197666-4fb2-44d0-b7a2-4627840be170	\N	\N	cedfcf50-2d94-4699-9dd1-1a1b11c14824	\N	user_logout	user	cedfcf50-2d94-4699-9dd1-1a1b11c14824	User logged out	\N	\N	\N	\N	2026-02-19 16:46:35.343076	\N
fce50c43-5921-431b-ad9c-e76559b1afb7	6dec171d-d048-47d4-a5d4-1476a7b5390a	\N	85d0d02e-5942-47c4-929a-62479c70a788	owner_admin	user_login	user	85d0d02e-5942-47c4-929a-62479c70a788	User test9 logged in	\N	\N	10.81.1.43	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-19 17:06:08.479383	\N
b17ff769-10bd-4a4e-9322-a8148735b3e3	\N	\N	85d0d02e-5942-47c4-929a-62479c70a788	\N	user_logout	user	85d0d02e-5942-47c4-929a-62479c70a788	User logged out	\N	\N	\N	\N	2026-02-19 17:07:33.665907	\N
96fcd0a4-5553-459f-8007-5487159cf759	495c33fe-a392-439a-aec7-39d639d8b45c	\N	e9dd6201-3d01-4316-9baf-f6ac3cfe0a35	owner_admin	user_login	user	e9dd6201-3d01-4316-9baf-f6ac3cfe0a35	User test11 logged in	\N	\N	10.81.10.159	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-19 17:39:01.070882	\N
fac30369-f82c-483a-b083-a536b04be0a2	\N	\N	e9dd6201-3d01-4316-9baf-f6ac3cfe0a35	\N	user_logout	user	e9dd6201-3d01-4316-9baf-f6ac3cfe0a35	User logged out	\N	\N	\N	\N	2026-02-19 17:41:33.842524	\N
4322e501-a36b-4a5b-bde9-8ca03e7c6fb6	a8d4b603-ad1a-4807-ad4d-d992076c5892	\N	da4e4e54-8610-4535-bbd9-de375e9f4337	owner_admin	user_login	user	da4e4e54-8610-4535-bbd9-de375e9f4337	User test12 logged in	\N	\N	10.81.1.43	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-19 18:40:23.266871	\N
9420c897-c6b1-4a4d-9dc4-00698d788f44	\N	\N	da4e4e54-8610-4535-bbd9-de375e9f4337	\N	user_logout	user	da4e4e54-8610-4535-bbd9-de375e9f4337	User logged out	\N	\N	\N	\N	2026-02-19 18:40:59.913177	\N
fc4977bd-3d5c-4973-b055-33269d1c96b6	ac506214-8952-45da-97f0-0e771f8543a2	\N	67909c91-a893-46f1-ba80-6d668fbe1d6d	owner_admin	user_login	user	67909c91-a893-46f1-ba80-6d668fbe1d6d	User test55 logged in	\N	\N	10.81.14.63	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 06:40:24.026141	\N
5f69447e-7385-46c0-9d1b-6f671f8d44a4	\N	\N	67909c91-a893-46f1-ba80-6d668fbe1d6d	\N	user_logout	user	67909c91-a893-46f1-ba80-6d668fbe1d6d	User logged out	\N	\N	\N	\N	2026-02-20 07:16:52.322693	\N
d945f508-16e9-4243-be8d-39ae9639db16	e333d1d7-db91-4f5a-a85b-f78b25df2b53	\N	a420736f-75ef-42f7-bd37-b97a743f56e7	owner_admin	user_login	user	a420736f-75ef-42f7-bd37-b97a743f56e7	User test66 logged in	\N	\N	10.81.6.182	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 07:49:52.400245	\N
6b8e19eb-4fcb-4602-90ad-3db578b5c723	\N	\N	a420736f-75ef-42f7-bd37-b97a743f56e7	\N	user_logout	user	a420736f-75ef-42f7-bd37-b97a743f56e7	User logged out	\N	\N	\N	\N	2026-02-20 08:17:08.898602	\N
f9a03ab2-9781-40c9-8358-c22caf9d93f6	bc78df31-2b2a-4daa-a3d8-51a0ca8baa10	\N	375adbfa-a298-4a4c-acf9-94809174ac14	owner_admin	user_login	user	375adbfa-a298-4a4c-acf9-94809174ac14	User testpro_9jBjzA logged in	\N	\N	10.81.6.182	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-20 08:50:44.472998	\N
6b68f1a0-4f54-4f7a-8920-2ea275615729	\N	\N	6fc6324a-76a0-4d9b-9da7-a03096e5484d	\N	user_logout	user	6fc6324a-76a0-4d9b-9da7-a03096e5484d	User logged out	\N	\N	\N	\N	2026-02-20 08:55:39.531058	\N
1359967e-1b52-48de-951b-df8c81b66681	\N	\N	af7ba19d-06c4-4490-bc91-fda1414802ed	\N	user_logout	user	af7ba19d-06c4-4490-bc91-fda1414802ed	User logged out	\N	\N	\N	\N	2026-02-20 09:24:47.083357	\N
8936d88f-8d45-408a-8188-0ad0d62528bc	f73182bf-6a38-4126-b94d-7ef754bc3db2	\N	8da0da3f-8e4a-4623-ac41-789ee316b827	owner_admin	user_login	user	8da0da3f-8e4a-4623-ac41-789ee316b827	User orta1 logged in	\N	\N	10.81.14.63	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 09:25:32.081169	\N
564bbac4-f3bf-4bfe-8360-5916434cd552	f73182bf-6a38-4126-b94d-7ef754bc3db2	\N	8da0da3f-8e4a-4623-ac41-789ee316b827	owner_admin	staff_invited	staff_invitation	07ad2ca1-da8d-4cf1-930e-56176c9cf2c3	Invited ramin.v@orange-studio.az as front_desk to property 3	\N	\N	\N	\N	2026-02-20 09:33:02.683329	\N
809621f5-8b7d-4486-b786-5da892d7529f	f73182bf-6a38-4126-b94d-7ef754bc3db2	\N	5928ad00-69b2-4c01-a6c5-5379c5110c4b	reception	staff_joined	user	5928ad00-69b2-4c01-a6c5-5379c5110c4b	staf22 joined as front_desk via invitation	\N	\N	\N	\N	2026-02-20 09:34:09.752621	\N
3f508eb4-e1ba-4901-9ab8-e4d70ffa01ae	\N	\N	8da0da3f-8e4a-4623-ac41-789ee316b827	\N	user_logout	user	8da0da3f-8e4a-4623-ac41-789ee316b827	User logged out	\N	\N	\N	\N	2026-02-20 09:35:48.32284	\N
b3d139a9-376e-43f9-9a21-780b895ed691	f73182bf-6a38-4126-b94d-7ef754bc3db2	\N	8da0da3f-8e4a-4623-ac41-789ee316b827	owner_admin	staff_invited	staff_invitation	c677f64b-26b6-4ae6-ac6a-7ed123bd27b4	Invited ramin.v@orange-studio.az as front_desk to property 3	\N	\N	\N	\N	2026-02-20 09:38:30.971154	\N
31f25b02-3cec-4d4a-9494-17d2539f95c2	f73182bf-6a38-4126-b94d-7ef754bc3db2	\N	b7c11396-9a5a-48a3-8443-9e2e199ac124	reception	staff_joined	user	b7c11396-9a5a-48a3-8443-9e2e199ac124	staff3 joined as front_desk via invitation	\N	\N	\N	\N	2026-02-20 09:39:26.142914	\N
a7f7e139-0f68-4e03-b1b2-4e0754dc07ca	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	\N	user_logout	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User logged out	\N	\N	\N	\N	2026-02-27 11:52:03.239709	\N
60d062dc-c54e-4b72-bd9b-828b32b24160	\N	\N	8da0da3f-8e4a-4623-ac41-789ee316b827	\N	user_logout	user	8da0da3f-8e4a-4623-ac41-789ee316b827	User logged out	\N	\N	\N	\N	2026-02-20 10:01:17.413202	\N
c690a64b-7ba4-4867-8de5-734bb02b5368	f73182bf-6a38-4126-b94d-7ef754bc3db2	\N	5928ad00-69b2-4c01-a6c5-5379c5110c4b	reception	user_login	user	5928ad00-69b2-4c01-a6c5-5379c5110c4b	User staff22 logged in	\N	\N	10.81.15.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 10:01:47.24892	\N
b0bb6e31-be43-4c70-8af7-e8d4851e93b1	\N	\N	5928ad00-69b2-4c01-a6c5-5379c5110c4b	\N	user_logout	user	5928ad00-69b2-4c01-a6c5-5379c5110c4b	User logged out	\N	\N	\N	\N	2026-02-20 10:06:56.746335	\N
c5c99e11-f259-45ee-bb92-7e4658522fe5	\N	\N	254ef3be-573c-45a1-ad39-96cd40546b7d	guest	user_login	user	254ef3be-573c-45a1-ad39-96cd40546b7d	User GUEST-KLQX logged in	\N	\N	10.81.6.182	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 10:07:07.286286	\N
039af7f3-9d80-4cf2-bcfe-2e28d5b5d2fa	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	\N	user_logout	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User logged out	\N	\N	\N	\N	2026-02-28 14:13:00.51646	\N
e64b8238-c45b-4a2a-83a2-8ffed933a063	\N	\N	254ef3be-573c-45a1-ad39-96cd40546b7d	\N	user_logout	user	254ef3be-573c-45a1-ad39-96cd40546b7d	User logged out	\N	\N	\N	\N	2026-02-20 10:21:04.739377	\N
6d640936-48c4-4fec-b654-a40955a52bb1	\N	\N	81e76596-4329-4026-98e9-f2f040820245	guest	user_login	user	81e76596-4329-4026-98e9-f2f040820245	User GUEST-2FKT logged in	\N	\N	10.81.5.158	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 10:21:18.81313	\N
dccb58b1-8e68-4258-87f3-ac7dd9bd1724	\N	\N	5928ad00-69b2-4c01-a6c5-5379c5110c4b	\N	user_logout	user	5928ad00-69b2-4c01-a6c5-5379c5110c4b	User logged out	\N	\N	\N	\N	2026-02-20 10:22:32.252703	\N
0c48d19d-72ec-4370-9eee-c63e49cfe28c	f73182bf-6a38-4126-b94d-7ef754bc3db2	\N	8da0da3f-8e4a-4623-ac41-789ee316b827	owner_admin	user_login	user	8da0da3f-8e4a-4623-ac41-789ee316b827	User orta1 logged in	\N	\N	10.81.11.149	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 10:22:41.4503	\N
02213bcc-4ecb-41f2-b951-df43b8d90e8a	\N	\N	8da0da3f-8e4a-4623-ac41-789ee316b827	\N	user_logout	user	8da0da3f-8e4a-4623-ac41-789ee316b827	User logged out	\N	\N	\N	\N	2026-02-20 10:23:43.397599	\N
7abf80b0-1d84-4ec6-8aea-11a2f0bee5fe	7402ec1b-29e9-4041-86d5-711beacb39e7	\N	7e9c5281-144b-4a8f-8074-7f06a6fd7f50	owner_admin	user_login	user	7e9c5281-144b-4a8f-8074-7f06a6fd7f50	User test112 logged in	\N	\N	10.81.11.149	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 10:25:12.500481	\N
01459cc4-d4fc-44b5-8bbc-2c225242a540	\N	\N	7e9c5281-144b-4a8f-8074-7f06a6fd7f50	\N	user_logout	user	7e9c5281-144b-4a8f-8074-7f06a6fd7f50	User logged out	\N	\N	\N	\N	2026-02-20 10:27:42.279506	\N
bcd95ab3-29fb-46f7-8865-e22cda520936	\N	\N	7e9c5281-144b-4a8f-8074-7f06a6fd7f50	\N	user_logout	user	7e9c5281-144b-4a8f-8074-7f06a6fd7f50	User logged out	\N	\N	\N	\N	2026-02-20 10:28:57.729842	\N
1c28c98e-21fa-42be-88e2-32ed6b5437d9	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	oss_super_admin	user_login	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User oss_admin logged in	\N	\N	127.0.0.1	curl/8.14.1	2026-02-20 10:31:26.597477	\N
f726640e-7ac5-4eda-b22b-ddebd23fe535	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	oss_super_admin	user_login	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User oss_admin logged in	\N	\N	10.81.5.158	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 10:31:46.763946	\N
8f0c81a8-e01e-470f-922b-82f20320d78b	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	oss_super_admin	user_login	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User oss_admin logged in	\N	\N	127.0.0.1	curl/8.14.1	2026-02-20 10:38:44.987322	\N
1d9738c7-1f0b-4458-8e9b-670ada861ff4	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	oss_super_admin	user_login	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User oss_admin logged in	\N	\N	127.0.0.1	curl/8.14.1	2026-02-20 10:39:44.027992	\N
3d10f607-5cb5-4f63-9ad2-3d18d88c58b1	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	oss_super_admin	user_login	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User oss_admin logged in	\N	\N	127.0.0.1	curl/8.14.1	2026-02-20 10:40:38.019731	\N
be3a43cc-b50f-48c1-8a18-727e90da1441	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	oss_super_admin	user_login	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User oss_admin logged in	\N	\N	127.0.0.1	curl/8.14.1	2026-02-20 10:41:49.57796	\N
15406e91-5bcf-47d6-8e42-863a53559b37	\N	\N	81e76596-4329-4026-98e9-f2f040820245	\N	user_logout	user	81e76596-4329-4026-98e9-f2f040820245	User logged out	\N	\N	\N	\N	2026-02-20 11:08:11.097343	\N
9361ecdc-4ad2-45fd-9bc3-383245574193	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	oss_super_admin	user_login	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User oss_admin logged in	\N	\N	127.0.0.1	curl/8.14.1	2026-02-20 13:03:42.307028	\N
03440a1c-320d-4219-a485-d289a30b6062	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	oss_super_admin	user_login	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User oss_admin logged in	\N	\N	127.0.0.1	curl/8.14.1	2026-02-20 13:19:11.550488	\N
ffa92f9e-70f3-46b8-b138-9751097cdf36	\N	\N	69d2ec0e-d832-4477-b631-c1d03de733ce	\N	user_logout	user	69d2ec0e-d832-4477-b631-c1d03de733ce	User logged out	\N	\N	\N	\N	2026-02-20 13:53:55.180637	\N
a8f667a8-955e-44fa-88e2-1b27a58119f2	\N	\N	9b1dfd0b-805b-4c70-abf9-329093db2892	guest	user_login	user	9b1dfd0b-805b-4c70-abf9-329093db2892	User GUEST-P4S7 logged in	\N	\N	10.81.2.76	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-24 11:55:07.490338	\N
250c76c9-7fb7-4f55-831f-bf70b4f27518	\N	\N	161bfeb3-c162-4917-b1d1-21c4a40e1446	guest	user_login	user	161bfeb3-c162-4917-b1d1-21c4a40e1446	User GUEST-NFKV logged in	\N	\N	127.0.0.1	curl/8.14.1	2026-02-24 12:00:00.447906	\N
20146338-aa9f-44f7-b907-08ca3ed33ae6	\N	\N	c765f89e-a13c-41a1-8b8f-7dfac07d72d7	guest	user_login	user	c765f89e-a13c-41a1-8b8f-7dfac07d72d7	User GUEST-YYS9 logged in	\N	\N	10.81.2.76	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-24 12:01:19.529868	\N
07bbc152-8e87-41f1-9b61-e7c5cf6f2d50	\N	\N	8ac61fcc-aa08-4e0a-8c2a-0ab5ec3a1ce7	guest	user_login	user	8ac61fcc-aa08-4e0a-8c2a-0ab5ec3a1ce7	User GUEST-G7ES logged in	\N	\N	127.0.0.1	curl/8.14.1	2026-02-24 12:15:33.153581	\N
8d24d55d-23b5-49f2-b2bf-bc2ab42f8d72	\N	\N	a3a1a731-f4f6-498f-96bb-33a8f99c5d37	guest	user_login	user	a3a1a731-f4f6-498f-96bb-33a8f99c5d37	User GUEST-MP4F logged in	\N	\N	127.0.0.1	curl/8.14.1	2026-02-24 12:16:32.621813	\N
\.


--
-- Data for Name: billing_info; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_info (id, owner_id, stripe_customer_id, stripe_subscription_id, payment_method_last4, payment_method_brand, billing_email, billing_name, billing_address, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: board_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.board_reports (id, reporter_name, region, title, content, contract_ids, period_start, period_end, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, guest_id, room_number, room_type, check_in_date, check_out_date, status, pre_checked_in, special_requests, created_at, booking_number, booking_source, number_of_guests, nationality, passport_number, special_notes, owner_id, property_id, unit_id, nightly_rate, total_price, currency, discount, tenant_id, travel_agency_name, date_of_birth, guest_address, arrival_time, pre_check_notes, rejection_reason, payment_status, guest_signature_base64, id_document_base64, rate_plan_id) FROM stdin;
07a20250-599d-4622-8177-a89636b29843	3e6b086d-382a-4ef2-b56c-ee5191701554	301	Standard	2026-04-01 14:00:00	2026-04-05 12:00:00	confirmed	f	\N	2026-02-24 11:35:53.48705	PAY-TEST-001	direct_website	\N	\N	\N	\N	\N	\N	\N	10000	40000	USD	\N	demo_session_3f0af152-9afc-4ef2-af0a-6cf8495bbfcc	\N	\N	\N	\N	\N	\N	unpaid	\N	\N	\N
e77f8cb2-35bf-488a-a50c-74704c693c93	9b1dfd0b-805b-4c70-abf9-329093db2892	401	Standard	2026-04-01 14:00:00	2026-04-05 12:00:00	confirmed	f	\N	2026-02-24 11:54:37.45684	CHECKIN-TEST-001	direct_website	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	\N	demo_session_54d883e0-d226-42eb-84df-bb19082f7e3f	\N	\N	\N	\N	\N	\N	unpaid	\N	\N	\N
443f65a3-aa8a-42f6-8dae-8c5900d8ba18	254ef3be-573c-45a1-ad39-96cd40546b7d	505	Standard	2026-02-20 00:00:00	2026-02-25 00:00:00	checked_in	f	\N	2026-02-20 10:04:09.654307	d3	booking_com	1	\N	\N	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2	fb04e537-345b-4e39-9d19-959e2eded6dc	\N	15000	75000	USD	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2	\N	\N	\N	\N	\N	\N	unpaid	\N	\N	\N
c648a0ed-4ec3-4610-b476-6305e7f12048	81e76596-4329-4026-98e9-f2f040820245	3	Standard	2026-02-20 14:25:00	2026-02-25 12:00:00	confirmed	f	\N	2026-02-20 10:18:42.257677	43	booking_com	23	\N	\N	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2	fb04e537-345b-4e39-9d19-959e2eded6dc	\N	15000	75000	USD	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2	\N	\N	\N	\N	\N	\N	unpaid	\N	\N	\N
340a1d5f-f7a0-451e-b718-b67e7acd74a5	5ad56e5d-fd29-4876-b148-8d42424847e9	202	Standard	2026-03-01 14:00:00	2026-03-05 12:00:00	confirmed	f	\N	2026-02-24 11:00:32.420197	wea	booking_com	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	\N	demo_session_2879497c-67d8-4254-a824-fcbaea376064	\N	\N	\N	\N	\N	\N	unpaid	\N	\N	\N
fb36d454-1188-4c95-8f29-16b22baf9ca4	909320fe-e9b7-4490-91b6-6aad72ef9b0b	202	Standard	2026-03-03 14:00:00	2026-06-03 12:00:00	confirmed	f	\N	2026-02-24 11:01:23.113003	656	airbnb	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	\N	demo_session_2879497c-67d8-4254-a824-fcbaea376064	\N	\N	\N	\N	\N	\N	unpaid	\N	\N	\N
352e587b-8bde-42fb-a6a1-91c950a5aede	161bfeb3-c162-4917-b1d1-21c4a40e1446	501	Standard	2026-04-10 14:00:00	2026-04-15 12:00:00	precheck_submitted	f	Extra pillow	2026-02-24 11:59:54.301928	API-TEST-001	direct_website	2	Azerbaijan	AZ1234567	\N	\N	\N	\N	\N	\N	USD	\N	demo_session_695830c5-05bd-4882-8eb6-cb868bdff80c	\N	1990-05-15	Baku	\N	\N	\N	unpaid	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==	\N	\N
3201d4d2-c2d2-4b69-a97f-43d6cf727f77	c765f89e-a13c-41a1-8b8f-7dfac07d72d7	601	Standard	2026-05-01 14:00:00	2026-05-05 12:00:00	precheck_submitted	f	Late checkout please	2026-02-24 12:00:58.926873	E2E-CHECKIN-001	direct_website	1	Azerbaijan	E2E12345	\N	\N	\N	\N	\N	\N	USD	\N	demo_session_34e01e00-8509-47db-874b-3bbc6ed52284	\N	1985-03-20	Baku, AZ	\N	\N	\N	unpaid	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==	\N	\N
e087a247-2820-43ac-a422-086647504685	8ac61fcc-aa08-4e0a-8c2a-0ab5ec3a1ce7	701	Standard	2026-06-01 14:00:00	2026-06-05 12:00:00	precheck_submitted	f	\N	2026-02-24 12:15:15.460464	CASE1-001	direct_website	\N	Azerbaijan	CASE1-PASS	\N	\N	\N	\N	\N	\N	USD	\N	demo_session_3a963bc8-caba-40ab-8371-80f939ce96f7	\N	1990-01-01	\N	\N	\N	\N	paid	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==	\N	\N
96dff7ef-a6ef-43b8-89a9-6964ce2dd964	a3a1a731-f4f6-498f-96bb-33a8f99c5d37	702	Standard	2026-06-10 14:00:00	2026-06-15 12:00:00	confirmed	f	\N	2026-02-24 12:16:11.892935	CASE2-001	direct_website	\N	Turkey	CASE2-PASS	\N	\N	\N	\N	\N	10000	USD	\N	demo_session_3a963bc8-caba-40ab-8371-80f939ce96f7	\N	1988-07-15	\N	\N	\N	\N	paid	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==	\N	\N
\.


--
-- Data for Name: cash_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cash_accounts (id, hotel_id, property_id, owner_id, account_type, account_name, balance, currency, last_updated, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, hotel_id, guest_id, sender_id, sender_role, message, created_at, property_id, thread_type, escalated_by, escalation_note, tenant_id) FROM stdin;
f9264020-abb4-40cd-93d0-990beabecf74	7577111e-642c-4e59-a839-6686f47c5256	254ef3be-573c-45a1-ad39-96cd40546b7d	254ef3be-573c-45a1-ad39-96cd40546b7d	guest	salam	2026-02-20 10:07:28.331463	\N	guest_service	\N	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2
de2ea287-ae52-44b5-be34-f0e75a1f2ea5	7577111e-642c-4e59-a839-6686f47c5256	81e76596-4329-4026-98e9-f2f040820245	81e76596-4329-4026-98e9-f2f040820245	guest	salam	2026-02-20 10:21:34.490776	\N	guest_service	\N	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2
\.


--
-- Data for Name: contract_acceptances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contract_acceptances (id, owner_id, tenant_id, user_id, plan_code, plan_type, smart_plan_type, contract_version, property_name, monthly_price, currency, accepted_at, ip_address, user_agent, created_at, contract_language) FROM stdin;
6d5fa9d9-eeab-4189-8c63-e47e2159320f	11405dd7-d6b6-4d46-8774-bbaa16c01f71	demo_session_dd5af306-17a7-46c5-914e-f786259be7d7	62797tA7	CORE_STARTER	starter	none	v1.0	Test Hotel oozoFl	79	USD	2026-02-24 08:11:22.423	10.81.2.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 08:11:22.427575	AZ
85974a08-91a9-4f68-b6a2-12c198fec81e	11405dd7-d6b6-4d46-8774-bbaa16c01f71	demo_session_dd5af306-17a7-46c5-914e-f786259be7d7	62797tA7	CORE_PRO	pro	none	v1.0	Test Hotel oozoFl	199	USD	2026-02-24 08:11:25.461	10.81.11.71	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 08:11:25.462373	AZ
407fa81c-5da8-4009-9126-547db711cd98	11405dd7-d6b6-4d46-8774-bbaa16c01f71	demo_session_dd5af306-17a7-46c5-914e-f786259be7d7	62797tA7	CORE_STARTER	starter	none	v1.0	Test Hotel oozoFl	79	USD	2026-02-24 08:19:25.391	10.81.5.12	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 08:19:25.392237	AZ
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contracts (id, region, country, client_name, contract_value, currency, partner_company, partner_commission_percent, tax_percent, state_fee_percent, status, notes, signed_date, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: credential_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.credential_logs (id, guest_id, action, performed_by, performed_by_name, notes, created_at, tenant_id) FROM stdin;
06ebbc15-2187-405f-84f4-39a6c078da03	0803ee24-dc71-430a-9b76-4d4885a624be	created	demo_staff_1	Demo Staff	Guest account created with username GUEST-474089Y1J, password: guest123	2026-02-13 14:52:19.968641	\N
72f06e7e-8576-47d8-b57b-650319311e1f	254ef3be-573c-45a1-ad39-96cd40546b7d	created	5928ad00-69b2-4c01-a6c5-5379c5110c4b	staf22	Guest account created with username GUEST-KLQX, password: guest123	2026-02-20 10:04:09.650391	f73182bf-6a38-4126-b94d-7ef754bc3db2
1a99c6c6-ea48-4ee3-afa7-6c71947fada2	81e76596-4329-4026-98e9-f2f040820245	created	5928ad00-69b2-4c01-a6c5-5379c5110c4b	staf22	Guest account created with username GUEST-2FKT, password: ramin danger8030	2026-02-20 10:18:42.253162	f73182bf-6a38-4126-b94d-7ef754bc3db2
ebba3536-39f1-479f-af57-fb5259dfd02d	5ad56e5d-fd29-4876-b148-8d42424847e9	created	demo_recep_1	Demo Reception	Guest account created with username GUEST-UPDB	2026-02-24 11:00:32.416499	demo_session_2879497c-67d8-4254-a824-fcbaea376064
a9cc57ea-847f-41b1-a322-8c129531c54b	909320fe-e9b7-4490-91b6-6aad72ef9b0b	created	demo_recep_1	Demo Reception	Guest account created with username GUEST-ZUDW	2026-02-24 11:01:23.109924	demo_session_2879497c-67d8-4254-a824-fcbaea376064
3844a5a8-7b26-49e8-95cb-ec0619621c2c	3e6b086d-382a-4ef2-b56c-ee5191701554	created	demo_recep_1	Demo Reception	Guest account created with username GUEST-DN7Z	2026-02-24 11:35:53.482028	demo_session_3f0af152-9afc-4ef2-af0a-6cf8495bbfcc
0debc2e0-084b-461d-9be2-bcdc60437bba	9b1dfd0b-805b-4c70-abf9-329093db2892	created	demo_recep_1	Demo Reception	Guest account created with username GUEST-P4S7	2026-02-24 11:54:37.443827	demo_session_54d883e0-d226-42eb-84df-bb19082f7e3f
30d7c90b-e71c-42ff-9290-ce7bcc092f56	161bfeb3-c162-4917-b1d1-21c4a40e1446	created	demo_recep_1	Demo Reception	Guest account created with username GUEST-NFKV	2026-02-24 11:59:54.297526	demo_session_695830c5-05bd-4882-8eb6-cb868bdff80c
5499b925-33e6-4af8-b294-f68db5a66a39	c765f89e-a13c-41a1-8b8f-7dfac07d72d7	created	demo_recep_1	Demo Reception	Guest account created with username GUEST-YYS9	2026-02-24 12:00:58.922892	demo_session_34e01e00-8509-47db-874b-3bbc6ed52284
3e105444-1af8-4742-82e8-d1ceb04bdaaf	8ac61fcc-aa08-4e0a-8c2a-0ab5ec3a1ce7	created	demo_recep_1	Demo Reception	Guest account created with username GUEST-G7ES	2026-02-24 12:15:15.456458	demo_session_3a963bc8-caba-40ab-8371-80f939ce96f7
52c766d5-2e23-4f8e-b27f-de23bcc83ef6	a3a1a731-f4f6-498f-96bb-33a8f99c5d37	created	demo_recep_1	Demo Reception	Guest account created with username GUEST-MP4F	2026-02-24 12:16:11.888503	demo_session_3a963bc8-caba-40ab-8371-80f939ce96f7
448a42f8-3f4e-4f1c-aa9a-9f9f44c4ddf9	2ac88303-6e1b-4f38-a844-c96844af6fef	created	demo_recep_1	Demo Reception	Guest account created with username GUEST-KN9Y	2026-02-24 13:15:15.313575	demo_session_2c831ac8-9c02-411c-b930-799a0999b7b8
\.


--
-- Data for Name: device_telemetry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_telemetry (id, device_id, metric_name, metric_value, string_value, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.devices (id, unit_id, property_id, owner_id, device_type, name, manufacturer, model, serial_number, status, last_ping, metadata, is_active, created_at, ip_address, mac_address, firmware_version, hardware_version, last_online, battery_level, signal_strength, capabilities, configuration, installed_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: door_action_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.door_action_logs (id, booking_id, guest_id, room_number, action, performed_by, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: escalation_replies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.escalation_replies (id, escalation_id, user_id, message, tenant_id, created_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (id, hotel_id, property_id, owner_id, recurring_expense_id, category, description, amount, currency, vendor, receipt_url, source_type, period_month, period_year, created_by, created_by_name, approved_by, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: external_bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_bookings (id, hotel_id, tenant_id, source, external_id, guest_name, checkin_date, checkout_date, room_name, price, status, created_at) FROM stdin;
\.


--
-- Data for Name: feature_flag_overrides; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feature_flag_overrides (id, owner_id, feature_name, enabled, reason, expires_at, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: financial_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.financial_audit_logs (id, hotel_id, transaction_id, action, performed_by, performed_by_name, previous_values, new_values, created_at, tenant_id) FROM stdin;
afe42c8c-49b9-48b6-a6b7-d1c101e63e1e	4941633e-88da-4920-92c5-6f29de45f79a	1e20a034-56fb-4ae0-9533-a6b6809c6053	created	demo_staff_1	Demo Staff	\N	{"amount": 20000, "method": "credit_card", "status": "paid"}	2026-02-13 14:52:20.020792	899d7a50-7ac8-4c57-b16a-035da45ab8dc
3a5a7962-c08a-4642-8bc5-8a7bf018090f	7577111e-642c-4e59-a839-6686f47c5256	25ca3e47-238d-461e-9537-d7757c2e82ea	created	5928ad00-69b2-4c01-a6c5-5379c5110c4b	staf22	\N	{"amount": 75000, "method": "cash", "status": "paid"}	2026-02-20 10:04:09.690166	f73182bf-6a38-4126-b94d-7ef754bc3db2
9705199a-672d-46b1-910e-9394346d6a38	7577111e-642c-4e59-a839-6686f47c5256	864343ab-f940-44fc-82a3-f9f792b1cdd4	created	5928ad00-69b2-4c01-a6c5-5379c5110c4b	staf22	\N	{"amount": 75000, "method": "cash", "status": "paid"}	2026-02-20 10:18:42.288086	f73182bf-6a38-4126-b94d-7ef754bc3db2
80ab1c48-015e-4092-badd-bee3f4d31e86	4941633e-88da-4920-92c5-6f29de45f79a	96dca2ea-8c23-4eea-bfd9-206de3b4e508	created	demo_recep_1	Demo Reception	\N	{"amount": 10000, "status": "paid"}	2026-02-24 12:16:11.926901	demo_session_3a963bc8-caba-40ab-8371-80f939ce96f7
\.


--
-- Data for Name: financial_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.financial_transactions (id, hotel_id, guest_id, booking_id, room_number, category, description, amount, payment_status, payment_method, notes, created_by, created_by_name, voided_at, voided_by, void_reason, created_at, updated_at, owner_id, property_id, transaction_reference, tenant_id) FROM stdin;
1e20a034-56fb-4ae0-9533-a6b6809c6053	4941633e-88da-4920-92c5-6f29de45f79a	0803ee24-dc71-430a-9b76-4d4885a624be	e27d63b7-999f-47bc-a1ba-d730eaa87930	101	room_booking	Room 101 booking payment	20000	paid	credit_card	\N	demo_staff_1	Demo Staff	\N	\N	\N	2026-02-13 14:52:20.015537	2026-02-13 14:52:20.015537	\N	\N	\N	899d7a50-7ac8-4c57-b16a-035da45ab8dc
25ca3e47-238d-461e-9537-d7757c2e82ea	7577111e-642c-4e59-a839-6686f47c5256	254ef3be-573c-45a1-ad39-96cd40546b7d	443f65a3-aa8a-42f6-8dae-8c5900d8ba18	505	room_booking	Room 505 booking payment	75000	paid	cash	\N	5928ad00-69b2-4c01-a6c5-5379c5110c4b	staf22	\N	\N	\N	2026-02-20 10:04:09.685974	2026-02-20 10:04:09.685974	\N	\N	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2
864343ab-f940-44fc-82a3-f9f792b1cdd4	7577111e-642c-4e59-a839-6686f47c5256	81e76596-4329-4026-98e9-f2f040820245	c648a0ed-4ec3-4610-b476-6305e7f12048	3	room_booking	Room 3 booking payment	75000	paid	cash	\N	5928ad00-69b2-4c01-a6c5-5379c5110c4b	staf22	\N	\N	\N	2026-02-20 10:18:42.284508	2026-02-20 10:18:42.284508	\N	\N	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2
96dca2ea-8c23-4eea-bfd9-206de3b4e508	4941633e-88da-4920-92c5-6f29de45f79a	a3a1a731-f4f6-498f-96bb-33a8f99c5d37	96dff7ef-a6ef-43b8-89a9-6964ce2dd964	702	room_booking	Room 702 booking payment	10000	paid	cash	\N	demo_recep_1	Demo Reception	\N	\N	\N	2026-02-24 12:16:11.919036	2026-02-24 12:16:11.919036	\N	\N	\N	demo_session_3a963bc8-caba-40ab-8371-80f939ce96f7
\.


--
-- Data for Name: hotels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hotels (id, name, address, phone, email, logo_url, created_at, country, city, postal_code, website, star_rating, total_rooms, number_of_floors, building_type, primary_guest_type, has_smart_devices, smart_door_locks, smart_hvac, smart_lighting, pms_system, bms_system, iot_sensors, pms_software, pms_other, expected_smart_room_count, billing_currency, billing_contact_email, owner_id, property_id, tenant_id) FROM stdin;
4b678775-1fb6-4b29-aeb6-66efd36254a6	Test Hotel	Test St 1	+994501234567	hotel@test.com	\N	2026-02-14 14:41:51.828463	Azerbaijan	Baku	\N	\N	\N	10	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	87772a76-ada5-4dc6-bacf-9e949d17ffc6	e9510355-d798-4f92-a102-1a59c2c2fc85	\N
aa05c231-e9bf-4141-95fe-e570bd70953d	tt	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	2026-02-19 16:41:22.903327	Azerbaijan	Baku	\N	\N	boutique	34	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	afa0de93-1326-4fe4-a339-f65121ba4bcb	579129ae-3ff4-42ec-825a-61c7c5319d85	\N
13bb4267-9856-4790-9c33-02b989ffbbc9	tttt	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	2026-02-19 16:43:35.773502	Azerbaijan	Baku	\N	\N	5-star	994	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	02d18ce6-ec09-48c3-948e-741eeceaee86	e2475222-a91c-4167-b334-99f020731951	\N
92be9bf5-6d03-4993-9478-a6d838398a46	ttt	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	2026-02-19 17:05:59.850551	Azerbaijan	Baku	\N	\N	boutique	33	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	6dec171d-d048-47d4-a5d4-1476a7b5390a	d2959c48-95f9-4bf0-9f48-3f1f85ddbb70	\N
37e5945d-ac5f-42a5-9a1e-c29a6fdf668c	Test Hotel oozoFl	123 Test St	+994501234567	demo_owner+hotel@example.com	\N	2026-02-19 17:35:05.7932	United States	Test City	\N	\N	\N	10	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	11405dd7-d6b6-4d46-8774-bbaa16c01f71	d60048fa-971f-486c-a8db-610a5965ad97	\N
f79cf4d0-8944-4d83-9ced-976073ae2824	aewr	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	2026-02-19 17:38:52.946507	Azerbaijan	Baku	\N	\N	3-star	13	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	495c33fe-a392-439a-aec7-39d639d8b45c	c43b9ca9-7855-43b7-8c41-d2863b88e47a	\N
e807c861-3c3e-41ed-b4d3-89dbe5020c2c	gsd	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	2026-02-19 18:40:15.297472	Azerbaijan	Baku	\N	\N	5-star	56	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	a8d4b603-ad1a-4807-ad4d-d992076c5892	72122e33-d1a4-4805-bae0-57c020b13ce6	\N
df0a1f3a-869f-455a-913c-5595c65e61f7	test	Baku , Khagani rustamov 8	+0518880089	ramin.v@orange-studio.az	\N	2026-02-20 06:40:15.907052	Azerbaijan	Baku	\N	\N	3-star	4545	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	ac506214-8952-45da-97f0-0e771f8543a2	af2cc7de-c86c-485f-bc92-d0125ec094fb	\N
f2085959-093d-4e61-9229-f38841a56f9e	df	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	2026-02-20 07:49:44.044766	Azerbaijan	Baku	\N	\N	3-star	43	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	e333d1d7-db91-4f5a-a85b-f78b25df2b53	e0ad8e78-4f8b-45ab-9f06-33c384367f0d	\N
20bf763c-1652-43af-ab4a-b91567b85f9a	TestHotel_ArfmpL	Test Address 123	+994501234567	hotel_aYE8W7@test.com	\N	2026-02-20 08:50:33.303259	Azerbaijan	Baku	\N	\N	\N	10	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	bc78df31-2b2a-4daa-a3d8-51a0ca8baa10	afbc29ae-ca8f-4c3c-9840-98f3ceb2f1b2	\N
afdcc6cc-9212-4bd9-9bd2-403c0f824513	test	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	2026-02-20 08:56:25.594891	Azerbaijan	Baku	\N	\N	2-star	56	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	ae2ddc1d-50dc-489d-b690-73465af34a13	b0803298-c2e9-44ac-b28d-4866be2e217e	\N
7577111e-642c-4e59-a839-6686f47c5256	da	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	2026-02-20 09:25:24.030096	Azerbaijan	Baku	\N	\N	2-star	20	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2	c25cfca8-9f81-44f5-b0d1-14b9ccaf6071	\N
24d1573c-c810-485c-a2f9-cc1d0ef3dfb2	test	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	2026-02-20 10:24:50.804068	Azerbaijan	Baku	\N	\N	3-star	321	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	7402ec1b-29e9-4041-86d5-711beacb39e7	2196d0ed-08de-474f-a104-d0c0d5f8fb02	\N
ff6d2516-815b-40ae-ac7b-cf7a086dbaa0	Black.ice.aframe2	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	2026-03-04 10:02:21.161486	Azerbaijan	Baku	\N	\N	apartment	3	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	4b40a969-f41d-4722-bf60-e60829e7bc90	719dd5ca-c66f-4947-8b7e-1b30e22f787a	\N
c7ebef61-6fbc-438f-8a44-639d53fcc58d	Demo Hotel	Demo Street 1	+994501234567	demo-hotel@example.com	\N	2026-03-05 15:06:34.961156	Azerbaijan	Baku	\N	\N	\N	5	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	11e77135-6f73-422d-8b48-244d2137c1e6	096b4ba5-e48a-4947-95fb-ca9352a29a41	\N
92cf194e-6096-4945-94a3-a005d1b3f822	Black.ice.aframe2	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	2026-03-11 12:47:41.416843	Azerbaijan	Baku	\N	\N	apartment	3	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	e10e1ae2-7ac4-4814-8db4-b701c457309d	d7bb67a8-f871-42d1-a78f-1115b35f04e9	\N
\.


--
-- Data for Name: housekeeping_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.housekeeping_tasks (id, tenant_id, property_id, unit_id, room_number, task_type, cleaning_type, status, priority, assigned_to, trigger_source, notes, due_date, created_at, completed_at, booking_id) FROM stdin;
f4e82a6c-5579-4a88-b46e-5c7868ee4357	demo_session_3ec6cbe6-038e-4cb7-b29e-6b6784cac621	prop-test-rs	unit-102	102	cleaning	checkout_cleaning	completed	normal	\N	auto_checkout	\N	\N	2026-02-24 12:55:30.348282	2026-02-24 12:56:31.902	\N
f5a42f55-5c37-4b36-b31e-97ee7d3f30e1	demo_session_3ec6cbe6-038e-4cb7-b29e-6b6784cac621	prop-test-rs	unit-103	103	cleaning	deep_cleaning	pending	high	\N	manual	\N	\N	2026-02-24 12:56:46.397895	\N	\N
62714f52-d674-4f7d-a9aa-afff41dde73f	demo_session_2c831ac8-9c02-411c-b930-799a0999b7b8	prop-test-rs	unit-102	102	cleaning	checkout_cleaning	completed	normal	\N	auto_checkout	\N	\N	2026-02-24 13:15:58.965588	2026-02-24 13:16:22.821	e7b0b3d6-1bef-4704-86bb-51f82f3c2cf6
2eae9868-a2f0-42b2-b73c-f445cd831b98	demo_session_2c831ac8-9c02-411c-b930-799a0999b7b8	prop-test-rs	unit-102	102	cleaning	checkout_cleaning	pending	urgent	\N	auto_checkout	\N	\N	2026-02-24 13:16:41.853128	\N	checkout-hk-1771939001
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, owner_id, stripe_invoice_id, amount, currency, status, description, invoice_url, pdf_url, period_start, period_end, paid_at, created_at, tenant_id, invoice_number, pdf_path) FROM stdin;
\.


--
-- Data for Name: no_show_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.no_show_records (id, hotel_id, booking_id, guest_id, room_number, expected_check_in, estimated_revenue_loss, recorded_by, recorded_by_name, notes, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, message, type, read, action_url, created_at, tenant_id) FROM stdin;
2f184e3a-fd3d-4c4e-86fa-7ab52ed0cd97	0803ee24-dc71-430a-9b76-4d4885a624be	Welcome to O.S.S!	Your room 101 is ready. Check-in: 2/13/2026	info	f	\N	2026-02-13 14:52:19.99315	\N
352dd28d-5a8a-449f-ae8b-6e5bf9eb19c9	demo_staff_1	New Service Request	Room 202: housekeeping - Test towel request QO9zIT	info	f	\N	2026-02-19 05:35:46.461212	demo_session_e0939bf2-74ac-4df7-9878-0369fd60bc44
10ebe34b-13b1-4eb0-b30d-ada14380fe19	254ef3be-573c-45a1-ad39-96cd40546b7d	Welcome to O.S.S!	Your room 505 is ready. Check-in: 2/20/2026	info	f	\N	2026-02-20 10:04:09.66139	f73182bf-6a38-4126-b94d-7ef754bc3db2
b1e16199-b67a-430b-ac22-129352e53050	b7c11396-9a5a-48a3-8443-9e2e199ac124	New message from Ramin Veghari	salam	chat	f	/chat?guest=254ef3be-573c-45a1-ad39-96cd40546b7d	2026-02-20 10:07:28.336414	f73182bf-6a38-4126-b94d-7ef754bc3db2
8e9a4045-f4d9-4624-b520-54772e05de3b	8da0da3f-8e4a-4623-ac41-789ee316b827	New message from Ramin Veghari	salam	chat	f	/chat?guest=254ef3be-573c-45a1-ad39-96cd40546b7d	2026-02-20 10:07:28.342822	f73182bf-6a38-4126-b94d-7ef754bc3db2
4125b345-9926-4377-964e-5645dd12dd20	81e76596-4329-4026-98e9-f2f040820245	Welcome to O.S.S!	Your room 3 is ready. Check-in: 2/20/2026	info	f	\N	2026-02-20 10:18:42.265014	f73182bf-6a38-4126-b94d-7ef754bc3db2
dfb1da6e-1f24-4362-a22b-719b9980d37d	b7c11396-9a5a-48a3-8443-9e2e199ac124	New Service Request	Room 3: taxi - tad	info	f	\N	2026-02-20 10:21:30.582404	f73182bf-6a38-4126-b94d-7ef754bc3db2
22e9f3c4-28cd-4dad-b5e8-f04acffdd81f	b7c11396-9a5a-48a3-8443-9e2e199ac124	New message from rasd	salam	chat	f	/chat?guest=81e76596-4329-4026-98e9-f2f040820245	2026-02-20 10:21:34.495505	f73182bf-6a38-4126-b94d-7ef754bc3db2
610fa087-8a78-42d8-8132-ab7763434650	8da0da3f-8e4a-4623-ac41-789ee316b827	New message from rasd	salam	chat	f	/chat?guest=81e76596-4329-4026-98e9-f2f040820245	2026-02-20 10:21:34.501842	f73182bf-6a38-4126-b94d-7ef754bc3db2
e4b8b669-1ff6-48bd-86d1-d5e67bf861aa	5928ad00-69b2-4c01-a6c5-5379c5110c4b	New message from Ramin Veghari	salam	chat	t	/chat?guest=254ef3be-573c-45a1-ad39-96cd40546b7d	2026-02-20 10:07:28.339328	f73182bf-6a38-4126-b94d-7ef754bc3db2
f9fc112a-1c55-404e-897b-7f844b296998	5928ad00-69b2-4c01-a6c5-5379c5110c4b	New Service Request	Room 3: taxi - tad	info	t	\N	2026-02-20 10:21:30.585989	f73182bf-6a38-4126-b94d-7ef754bc3db2
d131980a-09c7-410d-b90c-73ed891bd8c2	5928ad00-69b2-4c01-a6c5-5379c5110c4b	New message from rasd	salam	chat	t	/chat?guest=81e76596-4329-4026-98e9-f2f040820245	2026-02-20 10:21:34.498511	f73182bf-6a38-4126-b94d-7ef754bc3db2
e528816e-6683-456c-b0b7-d5d215a60f1c	5ad56e5d-fd29-4876-b148-8d42424847e9	Welcome to O.S.S!	Your room 202 is ready. Check-in: 3/1/2026	info	f	\N	2026-02-24 11:00:32.426624	demo_session_2879497c-67d8-4254-a824-fcbaea376064
3978db01-ebcb-4c74-b450-7b59505a7db4	909320fe-e9b7-4490-91b6-6aad72ef9b0b	Welcome to O.S.S!	Your room 202 is ready. Check-in: 3/3/2026	info	f	\N	2026-02-24 11:01:23.119695	demo_session_2879497c-67d8-4254-a824-fcbaea376064
1b36bd87-ef54-4833-ac61-b793d2390938	3e6b086d-382a-4ef2-b56c-ee5191701554	Welcome to O.S.S!	Your room 301 is ready. Check-in: 4/1/2026	info	f	\N	2026-02-24 11:35:53.49433	demo_session_3f0af152-9afc-4ef2-af0a-6cf8495bbfcc
ed5b24da-cf28-4301-9701-b79f556bfdeb	9b1dfd0b-805b-4c70-abf9-329093db2892	Welcome to O.S.S!	Your room 401 is ready. Check-in: 4/1/2026	info	f	\N	2026-02-24 11:54:37.46563	demo_session_54d883e0-d226-42eb-84df-bb19082f7e3f
558f8004-9d72-4eed-b101-defe469255af	161bfeb3-c162-4917-b1d1-21c4a40e1446	Welcome to O.S.S!	Your room 501 is ready. Check-in: 4/10/2026	info	f	\N	2026-02-24 11:59:54.30901	demo_session_695830c5-05bd-4882-8eb6-cb868bdff80c
20903483-965c-4ac5-b3ad-688226a500dd	c765f89e-a13c-41a1-8b8f-7dfac07d72d7	Welcome to O.S.S!	Your room 601 is ready. Check-in: 5/1/2026	info	f	\N	2026-02-24 12:00:58.933338	demo_session_34e01e00-8509-47db-874b-3bbc6ed52284
a0d257bf-ebc9-47a1-b290-a24f84d66873	8ac61fcc-aa08-4e0a-8c2a-0ab5ec3a1ce7	Welcome to O.S.S!	Your room 701 is ready. Check-in: 6/1/2026	info	f	\N	2026-02-24 12:15:15.467369	demo_session_3a963bc8-caba-40ab-8371-80f939ce96f7
1ba84465-0f68-4969-9303-7f0cc3b95893	a3a1a731-f4f6-498f-96bb-33a8f99c5d37	Welcome to O.S.S!	Your room 702 is ready. Check-in: 6/10/2026	info	f	\N	2026-02-24 12:16:11.908507	demo_session_3a963bc8-caba-40ab-8371-80f939ce96f7
d15659a5-494b-4a2b-b6a3-7afe94d21b37	2ac88303-6e1b-4f38-a844-c96844af6fef	Welcome to O.S.S!	Your room 102 is ready. Check-in: 2/24/2026	info	f	\N	2026-02-24 13:15:15.326042	demo_session_2c831ac8-9c02-411c-b930-799a0999b7b8
\.


--
-- Data for Name: onboarding_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.onboarding_progress (id, owner_id, current_step, completed_steps, account_completed, property_completed, units_completed, subscription_completed, devices_completed, is_complete, created_at, updated_at, tenant_id, smart_system_completed, staff_completed) FROM stdin;
7817ba02-2f24-401a-95bb-8b95bbb88f30	ac506214-8952-45da-97f0-0e771f8543a2	4	{1,2,3}	f	t	t	f	f	f	2026-02-20 06:40:32.559837	2026-02-20 06:40:34.455	\N	t	t
9369c051-94a1-4a2f-a1c4-a679a09881ba	ae2ddc1d-50dc-489d-b690-73465af34a13	4	{1,2,3,4}	f	t	t	t	f	t	2026-02-20 08:57:17.976316	2026-02-20 08:57:20.85	ae2ddc1d-50dc-489d-b690-73465af34a13	t	t
b3963485-1b3e-41cf-8123-ccbcbb27da07	f73182bf-6a38-4126-b94d-7ef754bc3db2	4	{1,2,3,4}	f	t	t	t	f	t	2026-02-20 09:25:44.596231	2026-02-20 09:25:47.304	f73182bf-6a38-4126-b94d-7ef754bc3db2	t	t
d6d62258-77b8-40da-9cbd-f5f9f90fe530	7402ec1b-29e9-4041-86d5-711beacb39e7	4	{1,2,3,4}	f	t	t	t	f	t	2026-02-20 10:25:20.42871	2026-02-20 10:25:24.6	7402ec1b-29e9-4041-86d5-711beacb39e7	t	t
f7c37cd3-90a9-4705-be7f-b4b37900ea89	495c33fe-a392-439a-aec7-39d639d8b45c	4	{1,2,3}	f	t	t	f	f	f	2026-02-19 17:39:10.634457	2026-02-19 17:39:13.309	\N	t	t
6ea7bf91-c465-435b-9da7-1f999a02a036	a8d4b603-ad1a-4807-ad4d-d992076c5892	5	{1,2,3,4,5}	f	t	t	t	f	t	2026-02-19 18:40:33.35158	2026-02-19 18:40:49.981	a8d4b603-ad1a-4807-ad4d-d992076c5892	t	t
e9b5c233-bd7e-4810-ae81-744e29a93f1c	afa0de93-1326-4fe4-a339-f65121ba4bcb	5	{1,2,3,4}	f	t	t	t	f	t	2026-02-19 16:41:47.250188	2026-02-19 16:41:51.242	afa0de93-1326-4fe4-a339-f65121ba4bcb	t	t
390df895-e860-4cc2-b95b-f4f2fbffeb75	02d18ce6-ec09-48c3-948e-741eeceaee86	5	{1,2,3,4}	f	t	t	t	f	t	2026-02-19 16:43:53.972244	2026-02-19 16:43:57.74	02d18ce6-ec09-48c3-948e-741eeceaee86	t	t
109e8815-c6f8-4067-89de-134f093d5a73	6dec171d-d048-47d4-a5d4-1476a7b5390a	5	{1,2,3,4}	f	t	t	t	f	t	2026-02-19 17:06:15.84232	2026-02-19 17:06:19.67	6dec171d-d048-47d4-a5d4-1476a7b5390a	t	t
f31c363d-3493-49a6-971c-f500d87c2e35	11405dd7-d6b6-4d46-8774-bbaa16c01f71	5	{1,2,3,4,5}	f	t	t	t	f	t	2026-02-19 17:35:31.045955	2026-02-19 17:37:03.332	\N	t	t
933447fa-f004-4ce8-a283-f6c668a8dde0	e10e1ae2-7ac4-4814-8db4-b701c457309d	4	{1,2,3,4}	f	t	t	t	f	f	2026-03-11 12:47:51.273481	2026-03-11 12:47:53.169	\N	t	t
\.


--
-- Data for Name: ota_conflicts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ota_conflicts (id, provider, external_id, property_id, tenant_id, unit_id, check_in, check_out, guest_name, reason, resolved, created_at) FROM stdin;
\.


--
-- Data for Name: ota_integrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ota_integrations (id, property_id, tenant_id, provider, api_key, api_secret, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: ota_sync_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ota_sync_logs (id, provider, property_id, tenant_id, action, status, response, created_at) FROM stdin;
\.


--
-- Data for Name: owners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.owners (id, name, email, phone, company_name, country, city, address, logo_url, created_at, status) FROM stdin;
1abed867-520f-42c0-87cb-836763296852	Trial Test	trialtest2@test.com	\N	Trial Test's Properties	\N	\N	\N	\N	2026-02-19 17:02:37.443056	active
11405dd7-d6b6-4d46-8774-bbaa16c01f71	Demo Owner	demo_owner+test@example.com	+994501234567	Test Hotel oozoFl	United States	Test City	123 Test St	\N	2026-02-19 17:35:05.741719	active
6bc37ae9-1cac-4cf0-920a-2c54d018cb53	Diag Test	diag@test.com	\N	Diag Test's Properties	\N	\N	\N	\N	2026-02-20 08:08:19.953598	active
bc78df31-2b2a-4daa-a3d8-51a0ca8baa10	Test User z2ZC	admin_OM2tKm@test.com	+994501234567	TestHotel_ArfmpL	Azerbaijan	Baku	Test Address 123	\N	2026-02-20 08:50:33.21751	active
7402ec1b-29e9-4041-86d5-711beacb39e7	Ramin Veghari	ramin.v@orange-studio.az	+994518880089	test	Azerbaijan	Baku	Baku , Khagani rustamov 8	\N	2026-02-20 10:24:50.793466	deleted
f73182bf-6a38-4126-b94d-7ef754bc3db2	Ramin Veghari	ramin.v@orange-studio.az	+994518880089	da	Azerbaijan	Baku	Baku , Khagani rustamov 8	\N	2026-02-20 09:25:23.977028	deleted
ae2ddc1d-50dc-489d-b690-73465af34a13	Ramin Veghari	ramin.v@orange-studio.az	+994518880089	test	Azerbaijan	Baku	Baku , Khagani rustamov 8	\N	2026-02-20 08:56:25.581355	deleted
e333d1d7-db91-4f5a-a85b-f78b25df2b53	Ramin Veghari	ramin.v@orange-studio.az	+994518880089	df	Azerbaijan	Baku	Baku , Khagani rustamov 8	\N	2026-02-20 07:49:43.81906	deleted
ac506214-8952-45da-97f0-0e771f8543a2	Ramin Veghari	ramin.v@orange-studio.az	+0518880089	test	Azerbaijan	Baku	Baku , Khagani rustamov 8	\N	2026-02-20 06:40:15.853821	deleted
a8d4b603-ad1a-4807-ad4d-d992076c5892	Ramin Veghari	ramin.v@orange-studio.az	+994518880089	gsd	Azerbaijan	Baku	Baku , Khagani rustamov 8	\N	2026-02-19 18:40:14.981239	deleted
495c33fe-a392-439a-aec7-39d639d8b45c	Ramin Veghari	ramin.v@orange-studio.az	+994518880089	aewr	Azerbaijan	Baku	Baku , Khagani rustamov 8	\N	2026-02-19 17:38:52.913682	deleted
6dec171d-d048-47d4-a5d4-1476a7b5390a	Ramin Veghari	ramin.v@orange-studio.az	+994518880089	ttt	Azerbaijan	Baku	Baku , Khagani rustamov 8	\N	2026-02-19 17:05:59.789382	deleted
02d18ce6-ec09-48c3-948e-741eeceaee86	Ramin Veghari	ramin.v@orange-studio.az	+994518880089	tttt	Azerbaijan	Baku	Baku , Khagani rustamov 8	\N	2026-02-19 16:43:35.757404	deleted
afa0de93-1326-4fe4-a339-f65121ba4bcb	Ramin Veghari	ramin.v@orange-studio.az	+994518880089	tt	Azerbaijan	Baku	Baku , Khagani rustamov 8	\N	2026-02-19 16:41:22.713752	deleted
87772a76-ada5-4dc6-bacf-9e949d17ffc6	Test Admin	testadmin@test.com	+994501234567	Test Hotel	Azerbaijan	Baku	Test St 1	\N	2026-02-14 14:41:51.223466	deleted
4b40a969-f41d-4722-bf60-e60829e7bc90	Ramin Veghari	ramin.v@orange-studio.az	+994518880089	Black.ice.aframe2	Azerbaijan	Baku	Baku , Khagani rustamov 8	\N	2026-03-04 10:02:21.029889	active
11e77135-6f73-422d-8b48-244d2137c1e6	Demo Admin	admin@demo.com	+994501234567	Demo Hotel	Azerbaijan	Baku	Demo Street 1	\N	2026-03-05 15:06:34.945852	active
e10e1ae2-7ac4-4814-8db4-b701c457309d	Ramin Veghari	ramin.v@orange-studio.az	+994518880089	Black.ice.aframe2	Azerbaijan	Baku	Baku , Khagani rustamov 8	\N	2026-03-11 12:47:41.398697	active
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used_at, created_at) FROM stdin;
4089e9af-4e59-46b7-b2bd-06877763e4a5	69d2ec0e-d832-4477-b631-c1d03de733ce	8615c835-17ab-4cfe-aea9-fda980572363	2026-02-19 07:59:12.985	2026-02-19 06:59:50.681	2026-02-19 06:59:12.987793
b0019361-c823-42dd-9de0-3effff79d81d	2b16058a-20b9-4e8e-a880-aa8efe5b738e	e4f2ab51-40cb-4103-8775-ccce5709992d	2026-02-25 10:49:30.97	\N	2026-02-24 10:49:30.970906
5d98f290-92b6-4bf7-90f8-17d3632805ec	73e03062-a936-407e-a1cc-8e6cef1db35d	6701a828-88f7-47b2-988c-7818f63b7ef7	2026-02-25 10:52:06.274	\N	2026-02-24 10:52:06.274885
048b98a2-1750-4995-a924-f4fa559389aa	5ad56e5d-fd29-4876-b148-8d42424847e9	bbf87c15-539c-4173-bf82-6a879d650307	2026-02-25 11:00:32.43	\N	2026-02-24 11:00:32.43058
02675996-011f-4b2b-9d23-c489477c9079	909320fe-e9b7-4490-91b6-6aad72ef9b0b	b7b795d8-f055-4131-acb0-ec1cbade0525	2026-02-25 11:01:23.124	\N	2026-02-24 11:01:23.124555
bd7645db-cedb-497b-a823-f9e852497f5f	3e6b086d-382a-4ef2-b56c-ee5191701554	cb232a66-fb6c-496f-aa32-653a718a7773	2026-02-25 11:35:53.498	\N	2026-02-24 11:35:53.498451
bd086732-36bd-49ee-914d-3a76d151da26	9b1dfd0b-805b-4c70-abf9-329093db2892	318a79cd-e771-4306-8739-623e44373a66	2026-02-25 11:54:37.469	\N	2026-02-24 11:54:37.46959
31114257-d589-427d-872c-f7c611e29ec8	161bfeb3-c162-4917-b1d1-21c4a40e1446	b0ffc4ca-790b-4854-ae8b-c3359b01664b	2026-02-25 11:59:54.312	\N	2026-02-24 11:59:54.312586
01a0040e-13d3-4884-9bcf-fb362d5e452e	c765f89e-a13c-41a1-8b8f-7dfac07d72d7	d7ddce67-40f8-49ad-ad06-aa92ad8117ee	2026-02-25 12:00:58.937	\N	2026-02-24 12:00:58.937949
46e8cf38-4a3a-4b03-bda0-33fd57b43cbb	8ac61fcc-aa08-4e0a-8c2a-0ab5ec3a1ce7	94860fbb-59c7-464e-910a-31be84872786	2026-02-25 12:15:15.471	\N	2026-02-24 12:15:15.472175
c7d3559e-6f20-404f-a68d-f0816fc39a73	a3a1a731-f4f6-498f-96bb-33a8f99c5d37	8a36e2a2-69c4-417e-96dd-303e0260c4b1	2026-02-25 12:16:11.912	\N	2026-02-24 12:16:11.912943
a41b5b12-e5af-4abf-9173-4e1d095c57d5	2ac88303-6e1b-4f38-a844-c96844af6fef	7d86bbef-ef0d-4cda-b338-1a49eb56da29	2026-02-25 13:15:15.331	\N	2026-02-24 13:15:15.331526
d3f3dcf8-efec-442e-a065-d15167a8949d	c7b239de-f976-4396-bc9a-86185fe48fe6	ce4a2bf3-af27-4f4f-9b34-edb0791a5d70	2026-03-05 13:44:51.128	\N	2026-03-04 13:44:51.128832
ea38f45c-7bba-47af-a9ab-cbaa62fb510e	c74f743c-3047-4bc6-b29a-8174d7c34c66	a01e55ee-0c5d-4be3-b3c0-fa15162449e6	2026-03-05 13:46:15.536	\N	2026-03-04 13:46:15.537097
97049760-a6c1-4125-a299-39998776eb12	4405f382-0550-4d07-97a6-7983e100a9e9	ea8b06f7-83c1-4422-83f9-75d07da1bf15	2026-03-05 13:50:52.551	\N	2026-03-04 13:50:52.551631
\.


--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_methods (id, label, type, currency, details, instructions, is_active, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_orders (id, owner_id, tenant_id, plan_type, amount, currency, status, payment_method_id, customer_note, admin_note, transfer_reference, reviewed_by, reviewed_at, created_at, updated_at, order_type, reference_id) FROM stdin;
4ad90b9c-7371-4955-b5f7-57fe24a9a115	7402ec1b-29e9-4041-86d5-711beacb39e7	7402ec1b-29e9-4041-86d5-711beacb39e7	growth	219	AZN	rejected	\N	Payriff payment - CORE_GROWTH	Payriff API error	\N	\N	\N	2026-02-20 10:25:43.02898	2026-02-20 10:25:43.499	subscription	\N
7a65e1d4-5622-46f5-b76f-9263939c168c	7402ec1b-29e9-4041-86d5-711beacb39e7	7402ec1b-29e9-4041-86d5-711beacb39e7	growth	219	AZN	rejected	\N	Payriff payment - CORE_GROWTH	Payriff API error	\N	\N	\N	2026-02-20 10:25:51.349046	2026-02-20 10:25:51.704	subscription	\N
bc2370e8-38ce-4d4f-b8d7-3677a3c7e363	11405dd7-d6b6-4d46-8774-bbaa16c01f71	demo_session_dd5af306-17a7-46c5-914e-f786259be7d7	pro	33830	AZN	pending	\N	Epoint transaction: te014975449	\N	te014975449	\N	\N	2026-02-24 08:16:03.540266	2026-02-24 08:16:05.032	subscription	\N
f3fc143a-2c7a-4b6c-b7da-a1f9194d6962	11405dd7-d6b6-4d46-8774-bbaa16c01f71	demo_session_dd5af306-17a7-46c5-914e-f786259be7d7	starter	13430	AZN	pending	\N	Epoint transaction: te014975641	\N	te014975641	\N	\N	2026-02-24 08:19:25.606945	2026-02-24 08:19:26.762	subscription	\N
3a927b99-fe19-47c5-ae81-b0af16dcefee	11405dd7-d6b6-4d46-8774-bbaa16c01f71	demo_session_a792c86a-cc0f-4090-b2a2-5a942ad5df41	starter	13430	AZN	pending	\N	Epoint transaction: te015324436	\N	te015324436	\N	\N	2026-03-01 17:05:42.086765	2026-03-01 17:05:43.272	subscription	\N
50298e70-115c-4b07-8a6a-3d3a6c75c3e9	11405dd7-d6b6-4d46-8774-bbaa16c01f71	demo_session_d8c4e6fb-891b-4246-a54e-6ed626200062	starter	13430	AZN	pending	\N	Epoint transaction: te015641975	\N	te015641975	\N	\N	2026-03-05 13:56:54.399744	2026-03-05 13:56:55.83	subscription	\N
b8abcfca-3db0-4cb6-af1b-f9243a12fe0a	11405dd7-d6b6-4d46-8774-bbaa16c01f71	demo_session_7a63d279-53d1-491e-b48a-5ac5f0d74cd2	starter	13430	AZN	pending	\N	Epoint transaction: te015831355	\N	te015831355	\N	\N	2026-03-07 16:43:02.716543	2026-03-07 16:43:04.336	subscription	\N
\.


--
-- Data for Name: payroll_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_configs (id, hotel_id, property_id, owner_id, staff_id, staff_name, staff_role, base_salary, currency, frequency, bonus_rules, deduction_rules, bank_details, is_active, created_by, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: payroll_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_entries (id, hotel_id, property_id, owner_id, payroll_config_id, staff_id, staff_name, amount, bonus_amount, deduction_amount, net_amount, currency, period_month, period_year, status, paid_at, notes, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: pricing_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pricing_rules (id, property_id, tenant_id, name, rule_type, priority, conditions, adjustment, is_active, created_at) FROM stdin;
138d1b7b-0b09-479c-a44f-60f94c663fc0	d60048fa-971f-486c-a8db-610a5965ad97	demo_session_9cda15e2-8c39-411b-adb5-95f102414de3	Weekend Surge	day_of_week	10	{"days": [5, 6]}	{"type": "percentage", "value": 15}	t	2026-03-04 17:55:31.751175
228852f2-eb9a-4348-af2e-ecfd1bdbd8e5	096b4ba5-e48a-4947-95fb-ca9352a29a41	11e77135-6f73-422d-8b48-244d2137c1e6	Test Weekend Surge	day_of_week	10	{"days": [5, 6]}	{"type": "percentage", "value": 15}	t	2026-03-05 15:07:38.432219
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.properties (id, owner_id, name, type, address, phone, email, logo_url, country, city, postal_code, website, star_rating, total_units, number_of_floors, building_type, primary_guest_type, has_smart_devices, smart_door_locks, smart_hvac, smart_lighting, pms_system, bms_system, iot_sensors, pms_software, pms_other, expected_smart_room_count, billing_currency, billing_contact_email, timezone, is_active, created_at, tenant_id, image_url) FROM stdin;
c25cfca8-9f81-44f5-b0d1-14b9ccaf6071	f73182bf-6a38-4126-b94d-7ef754bc3db2	da	hotel	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	Azerbaijan	Baku	\N	\N	2-star	5	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	UTC	f	2026-02-20 09:25:24.020197	\N	\N
719dd5ca-c66f-4947-8b7e-1b30e22f787a	4b40a969-f41d-4722-bf60-e60829e7bc90	Black.ice.aframe2	hotel	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	Azerbaijan	Baku	\N	\N	apartment	3	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	\N	t	2026-03-04 10:02:21.044136	\N	\N
096b4ba5-e48a-4947-95fb-ca9352a29a41	11e77135-6f73-422d-8b48-244d2137c1e6	Demo Hotel	hotel	Demo Street 1	+994501234567	demo-hotel@example.com	\N	Azerbaijan	Baku	\N	\N	\N	5	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	\N	t	2026-03-05 15:06:34.950141	\N	\N
b0803298-c2e9-44ac-b28d-4866be2e217e	ae2ddc1d-50dc-489d-b690-73465af34a13	test	hotel	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	Azerbaijan	Baku	\N	\N	2-star	5	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	UTC	f	2026-02-20 08:56:25.587756	\N	\N
d7bb67a8-f871-42d1-a78f-1115b35f04e9	e10e1ae2-7ac4-4814-8db4-b701c457309d	Black.ice.aframe2	hotel	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	Azerbaijan	Baku	\N	\N	apartment	5	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	UTC	t	2026-03-11 12:47:41.407813	\N	\N
d60048fa-971f-486c-a8db-610a5965ad97	11405dd7-d6b6-4d46-8774-bbaa16c01f71	Test Hotel oozoFl	hotel	123 Test St	+994501234567	demo_owner+hotel@example.com	\N	United States	Test City	\N	\N	\N	5	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	UTC	t	2026-02-19 17:35:05.771701	\N	\N
afbc29ae-ca8f-4c3c-9840-98f3ceb2f1b2	bc78df31-2b2a-4daa-a3d8-51a0ca8baa10	TestHotel_ArfmpL	hotel	Test Address 123	+994501234567	hotel_aYE8W7@test.com	\N	Azerbaijan	Baku	\N	\N	\N	10	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	\N	t	2026-02-20 08:50:33.268654	\N	\N
e0ad8e78-4f8b-45ab-9f06-33c384367f0d	e333d1d7-db91-4f5a-a85b-f78b25df2b53	df	hotel	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	Azerbaijan	Baku	\N	\N	3-star	43	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	\N	f	2026-02-20 07:49:44.035132	\N	\N
af2cc7de-c86c-485f-bc92-d0125ec094fb	ac506214-8952-45da-97f0-0e771f8543a2	test	hotel	Baku , Khagani rustamov 8	+0518880089	ramin.v@orange-studio.az	\N	Azerbaijan	Baku	\N	\N	3-star	5	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	UTC	f	2026-02-20 06:40:15.885182	\N	\N
72122e33-d1a4-4805-bae0-57c020b13ce6	a8d4b603-ad1a-4807-ad4d-d992076c5892	gsd	hotel	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	Azerbaijan	Baku	\N	\N	5-star	5	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	UTC	f	2026-02-19 18:40:15.288651	\N	\N
c43b9ca9-7855-43b7-8c41-d2863b88e47a	495c33fe-a392-439a-aec7-39d639d8b45c	aewr	hotel	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	Azerbaijan	Baku	\N	\N	3-star	5	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	UTC	f	2026-02-19 17:38:52.928191	\N	\N
2196d0ed-08de-474f-a104-d0c0d5f8fb02	7402ec1b-29e9-4041-86d5-711beacb39e7	test	hotel	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	Azerbaijan	Baku	\N	\N	3-star	5	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	UTC	f	2026-02-20 10:24:50.797012	\N	\N
fb04e537-345b-4e39-9d19-959e2eded6dc	f73182bf-6a38-4126-b94d-7ef754bc3db2	3	hotel	Baku , Khagani rustamov 8, 31	\N	\N	\N	Azerbaijan	Baku	\N	\N	\N	33	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	\N	f	2026-02-20 09:26:17.305254	\N	\N
59c84f95-6cfc-44c8-b7ed-53ef157054ea	f73182bf-6a38-4126-b94d-7ef754bc3db2	2	hotel	Baku , Khagani rustamov 8, 31	\N	\N	\N	Azerbaijan	Baku	\N	\N	\N	20	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	\N	f	2026-02-20 09:26:01.361895	\N	\N
d2959c48-95f9-4bf0-9f48-3f1f85ddbb70	6dec171d-d048-47d4-a5d4-1476a7b5390a	ttt	hotel	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	Azerbaijan	Baku	\N	\N	boutique	5	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	UTC	f	2026-02-19 17:05:59.832238	\N	\N
e2475222-a91c-4167-b334-99f020731951	02d18ce6-ec09-48c3-948e-741eeceaee86	tttt	hotel	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	Azerbaijan	Baku	\N	\N	5-star	5	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	UTC	f	2026-02-19 16:43:35.763074	\N	\N
579129ae-3ff4-42ec-825a-61c7c5319d85	afa0de93-1326-4fe4-a339-f65121ba4bcb	tt	hotel	Baku , Khagani rustamov 8	+994518880089	ramin.v@orange-studio.az	\N	Azerbaijan	Baku	\N	\N	boutique	5	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	UTC	f	2026-02-19 16:41:22.768512	\N	\N
e9510355-d798-4f92-a102-1a59c2c2fc85	87772a76-ada5-4dc6-bacf-9e949d17ffc6	Test Hotel	hotel	Test St 1	+994501234567	hotel@test.com	\N	Azerbaijan	Baku	\N	\N	\N	10	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	\N	f	2026-02-14 14:41:51.69622	\N	\N
prop-test-rs	899d7a50-7ac8-4c57-b16a-035da45ab8dc	Test Hotel Property	hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	f	f	f	f	\N	\N	\N	\N	\N	\N	t	2026-02-24 12:30:51.687688	899d7a50-7ac8-4c57-b16a-035da45ab8dc	\N
\.


--
-- Data for Name: quote_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quote_notes (id, quote_request_id, author_user_id, note_text, created_at) FROM stdin;
\.


--
-- Data for Name: quote_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quote_requests (id, hotel_name, contact_name, phone, email, country, city, preferred_contact_hours, timezone, preferred_contact_method, total_rooms, expected_smart_rooms, interested_features, message, source_page, language, status, internal_notes, email_sent, created_at, updated_at, assigned_to_user_id, contacted_at) FROM stdin;
\.


--
-- Data for Name: rate_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rate_plans (id, property_id, tenant_id, name, refund_policy, meal_plan, price_modifier, is_default, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: recurring_expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recurring_expenses (id, hotel_id, property_id, owner_id, category, description, amount, currency, frequency, vendor, is_active, next_run_at, last_run_at, created_by, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: refund_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refund_requests (id, invoice_id, transaction_id, owner_id, tenant_id, amount, currency, reason, status, requested_by, approved_by, rejected_by, rejection_reason, processed_at, created_at) FROM stdin;
\.


--
-- Data for Name: revenues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.revenues (id, hotel_id, property_id, owner_id, booking_id, guest_id, transaction_id, room_number, category, description, amount, currency, payment_method, payment_status, source_type, created_by, created_by_name, created_at, tenant_id) FROM stdin;
5535a7e1-036d-45bb-b440-2380b21c4501	4941633e-88da-4920-92c5-6f29de45f79a	12b384d5-a4e4-4077-bd2e-8dcfb0656aee	\N	e27d63b7-999f-47bc-a1ba-d730eaa87930	0803ee24-dc71-430a-9b76-4d4885a624be	1e20a034-56fb-4ae0-9533-a6b6809c6053	101	room_booking	Room 101 booking payment	20000	USD	credit_card	paid	auto	demo_staff_1	Demo Staff	2026-02-13 14:52:20.031319	899d7a50-7ac8-4c57-b16a-035da45ab8dc
4d32ee74-cbdb-4b2e-80d7-3350c00b277a	7577111e-642c-4e59-a839-6686f47c5256	c25cfca8-9f81-44f5-b0d1-14b9ccaf6071	f73182bf-6a38-4126-b94d-7ef754bc3db2	443f65a3-aa8a-42f6-8dae-8c5900d8ba18	254ef3be-573c-45a1-ad39-96cd40546b7d	25ca3e47-238d-461e-9537-d7757c2e82ea	505	room_booking	Room 505 booking payment	75000	USD	cash	paid	auto	5928ad00-69b2-4c01-a6c5-5379c5110c4b	staf22	2026-02-20 10:04:09.699148	f73182bf-6a38-4126-b94d-7ef754bc3db2
8cdae7dc-c356-427b-9cfe-c011f7683def	7577111e-642c-4e59-a839-6686f47c5256	c25cfca8-9f81-44f5-b0d1-14b9ccaf6071	f73182bf-6a38-4126-b94d-7ef754bc3db2	c648a0ed-4ec3-4610-b476-6305e7f12048	81e76596-4329-4026-98e9-f2f040820245	864343ab-f940-44fc-82a3-f9f792b1cdd4	3	room_booking	Room 3 booking payment	75000	USD	cash	paid	auto	5928ad00-69b2-4c01-a6c5-5379c5110c4b	staf22	2026-02-20 10:18:42.29239	f73182bf-6a38-4126-b94d-7ef754bc3db2
40e3f607-3a0c-4ee9-9255-bc1d0b0ab069	4941633e-88da-4920-92c5-6f29de45f79a	\N	\N	96dff7ef-a6ef-43b8-89a9-6964ce2dd964	a3a1a731-f4f6-498f-96bb-33a8f99c5d37	96dca2ea-8c23-4eea-bfd9-206de3b4e508	702	room_booking	Room 702 booking payment	10000	USD	cash	paid	auto	demo_recep_1	Demo Reception	2026-02-24 12:16:11.933389	demo_session_3a963bc8-caba-40ab-8371-80f939ce96f7
\.


--
-- Data for Name: room_nights; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_nights (id, unit_id, date, booking_id, tenant_id, property_id, created_at) FROM stdin;
\.


--
-- Data for Name: room_preparation_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_preparation_orders (id, guest_id, hotel_id, room_number, occasion_type, decoration_style, add_ons, notes, budget_range, custom_budget, preferred_datetime, reference_image_url, price, status, staff_assigned, admin_notes, rejection_reason, created_at, updated_at, owner_id, property_id, tenant_id) FROM stdin;
\.


--
-- Data for Name: room_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_settings (id, booking_id, temperature, lights_on, lights_brightness, curtains_open, jacuzzi_on, jacuzzi_temperature, welcome_mode, updated_at, door_locked, curtains_position, bathroom_lights_on, bathroom_lights_brightness, hall_lights_on, hall_lights_brightness, non_dimmable_lights_on, tenant_id) FROM stdin;
99bfeaeb-1d47-435d-a067-f1f36c8e7736	340a1d5f-f7a0-451e-b718-b67e7acd74a5	22	f	50	f	f	38	t	2026-02-24 11:00:32.423664	t	0	f	50	f	50	f	demo_session_2879497c-67d8-4254-a824-fcbaea376064
a4e807d3-091c-4acd-b670-ad2449406c0b	fb36d454-1188-4c95-8f29-16b22baf9ca4	22	f	50	f	f	38	t	2026-02-24 11:01:23.116474	t	0	f	50	f	50	f	demo_session_2879497c-67d8-4254-a824-fcbaea376064
335a0edd-e186-4143-bb4e-effb74159ebd	07a20250-599d-4622-8177-a89636b29843	22	f	50	f	f	38	t	2026-02-24 11:35:53.490385	t	0	f	50	f	50	f	demo_session_3f0af152-9afc-4ef2-af0a-6cf8495bbfcc
ea8e5727-2bc8-43bc-a5d1-af658e7eeb49	e77f8cb2-35bf-488a-a50c-74704c693c93	22	f	50	f	f	38	t	2026-02-24 11:54:37.461041	t	0	f	50	f	50	f	demo_session_54d883e0-d226-42eb-84df-bb19082f7e3f
9caecfe1-7c1e-45de-b954-decbc9554096	352e587b-8bde-42fb-a6a1-91c950a5aede	22	f	50	f	f	38	t	2026-02-24 11:59:54.305864	t	0	f	50	f	50	f	demo_session_695830c5-05bd-4882-8eb6-cb868bdff80c
59e6897f-133e-4a6a-ad9b-ee3f0eeceb9e	e27d63b7-999f-47bc-a1ba-d730eaa87930	22	f	50	f	f	38	t	2026-02-13 16:50:27.17	t	0	f	75	f	60	f	\N
23f6e620-f1c0-49fc-83e9-5bab8a57d798	3201d4d2-c2d2-4b69-a97f-43d6cf727f77	22	f	50	f	f	38	t	2026-02-24 12:00:58.930252	t	0	f	50	f	50	f	demo_session_34e01e00-8509-47db-874b-3bbc6ed52284
b28614fa-720e-4c98-b05c-01ff26f2be50	e087a247-2820-43ac-a422-086647504685	22	f	50	f	f	38	t	2026-02-24 12:15:15.463911	t	0	f	50	f	50	f	demo_session_3a963bc8-caba-40ab-8371-80f939ce96f7
4b834f2b-2fb5-4ef6-9fdb-48b0a192563a	96dff7ef-a6ef-43b8-89a9-6964ce2dd964	22	f	50	f	f	38	t	2026-02-24 12:16:11.89636	t	0	f	50	f	50	f	demo_session_3a963bc8-caba-40ab-8371-80f939ce96f7
491450cb-2be6-41c9-98f9-118db398625c	e7b0b3d6-1bef-4704-86bb-51f82f3c2cf6	22	f	50	f	f	38	t	2026-02-24 13:15:15.322557	t	0	f	50	f	50	f	demo_session_2c831ac8-9c02-411c-b930-799a0999b7b8
74a9c450-2693-4194-9203-5d14fa1d8301	443f65a3-aa8a-42f6-8dae-8c5900d8ba18	22	f	50	f	f	38	t	2026-02-20 10:04:09.658086	t	0	f	50	f	50	f	f73182bf-6a38-4126-b94d-7ef754bc3db2
69dda966-49dd-4ce5-b348-decea57af538	c648a0ed-4ec3-4610-b476-6305e7f12048	22	f	50	f	f	38	t	2026-02-20 10:18:42.261639	t	0	f	50	f	50	f	f73182bf-6a38-4126-b94d-7ef754bc3db2
\.


--
-- Data for Name: service_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_requests (id, guest_id, booking_id, room_number, request_type, description, status, priority, assigned_to, notes, created_at, updated_at, owner_id, property_id, tenant_id) FROM stdin;
a705da5d-63f6-4e6a-b029-b54a9be48927	81e76596-4329-4026-98e9-f2f040820245	c648a0ed-4ec3-4610-b476-6305e7f12048	3	taxi	tad	pending	normal	\N	\N	2026-02-20 10:21:30.573253	2026-02-20 10:21:30.573253	\N	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
ZNVzRBc36w-KIznSkZPrk9ljd4MK6gp7	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T14:55:41.524Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 14:55:42
-1gFSjdIoOE0J0axQ3ahIlqJAUxUBJ52	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:11:57.018Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 15:11:58
f85hN4YS-HX-M7sK7is4tedBtnbHzmHA	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:18:44.294Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 15:18:45
snrJdDdnPMAHxc_9Mf4AaSt5R83YHhbj	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-17T12:43:52.396Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-17 12:43:53
vlKHFDRJgN_kNWuk-Vq9pr1fZmhzUvG6	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:25:48.880Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 15:25:49
GK6GabS3XrFRvWS4-qO1kiDzNrmLwPu-	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:25:48.920Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 15:25:49
ZybSfG71oy4Ow5Y2DgD_RMSei5aZt89S	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:25:48.959Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 15:25:49
KV0qUQK_9YxdzjSvKztmk7POUiQ8QgGk	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-11T18:13:19.524Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"62797tA7","role":"owner_admin","demoSessionTenantId":"demo_session_cc8024b5-a44e-45c4-b08c-0f7f8bf7d00d"}	2026-03-11 18:15:09
PK87Y1Jfqq4HkwXZvUDpgiJ7m_QdgH1r	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:25:49.003Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 15:25:50
MaJ7VpDCrR4n9Jy-526EshJqM8ycCUje	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T16:19:42.288Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 16:19:43
TsnRkgl8wjMDS2doIoukyyD6tpnNi0E9	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T09:57:06.771Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 09:57:07
9ajQWRxf4JohlRm_LWK0gcMwJ2UjnsjF	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-11T18:27:00.250Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"demo_recep_1","role":"reception","demoSessionTenantId":"demo_session_2db8eaca-9f33-47a4-8e6e-74e2923fee23"}	2026-03-11 18:27:31
tWv8bSdcfCnPpt1BWMASe9-X3ErL0VAR	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-11T17:38:59.004Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-11 17:39:05
OjhHaEOmpe7S6AyRDtjfpxKGPv5_VcCF	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T10:39:22.752Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 10:39:23
OHm6t7va3-_ldSl4WfZqmiZ3iOtqbuWQ	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T13:29:54.577Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 13:29:58
PLEcWb5veatIVIcx6XYXRBLL3HEjF963	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-11T18:10:24.331Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-11 18:10:30
i0oq1NK00mqiDukTmS3HEv7uJypK6teZ	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T13:22:47.955Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 13:22:55
8KdHYYWFtULwydDyO2Qbuf4V1nCMYDZy	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:58:01.632Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 15:58:02
5_J4tmO2UvEtO984W0_1hTcAVbmlgFzt	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T13:48:18.347Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"0d33e5a9-5008-4e52-a897-42c81274ced3","role":"admin","demoSessionTenantId":"demo_session_3d8fd7ab-4ff6-4ed3-9c9e-81e0cd190091"}	2026-03-13 13:49:23
PPg9sgU_ya2r0Vpw46ccwXTyfzuKwugJ	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T11:07:24.935Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 11:07:25
kv1J4wAWHEIFxMhihIrcC3aE6n5JUNLb	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T11:07:24.995Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 11:07:25
CDWkzm-r1ON3QzzS4x_jgi63QVyuTpwQ	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T10:02:04.609Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 10:02:05
jic6RMzizvBdl_PbCyYUcdwst0Xi62-3	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-18T11:39:19.917Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-18 11:39:23
pssrN4eUOFRyJ2IHuXMBzlOJ6NN6Jbgb	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-11T18:02:03.661Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"62797tA7","role":"owner_admin","demoSessionTenantId":"demo_session_d0db6e6d-de20-4536-9295-225e6de4cf48"}	2026-03-11 18:02:31
m2eGXm7wO0URROAYyb2t_ORnxdzsfO7J	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-11T14:21:18.144Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-11 14:21:26
B-RZ-6s4TA8ycdyrPgJixnKtXjvX3aTZ	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-11T18:29:49.317Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"demo_recep_1","role":"reception","demoSessionTenantId":"demo_session_03ff3935-ab03-44d5-96fd-b7771b56dbe9"}	2026-03-11 18:30:39
QWd8Llv16tyLpYPWelo2XqwPUQs-rHoS	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T13:10:16.166Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 13:10:18
11abj2MzC3rRFY60RVyOF3MXxzHBpVQx	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T16:33:41.848Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 16:33:47
vwrHwbWul0OJPRYj9Cfz9YE4-vOycWRu	{"cookie":{"originalMaxAge":604799999,"expires":"2026-03-13T12:52:31.485Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 12:52:38
U1mFPq9jR0unxoohiXEqbmzm-EuA9Byu	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-18T12:47:41.762Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"31746b7d-8021-4c7f-935d-a22770d0b81b","role":"owner_admin"}	2026-03-18 13:32:05
PbAx6wQKYkBDCHdKyxTqd1gm4PzPJbOu	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-11T18:22:08.343Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"62797tA7","role":"owner_admin","demoSessionTenantId":"demo_session_0b32dd86-7a60-4350-bc81-a7cff0c1412c"}	2026-03-11 18:23:08
KZV-8gUKJ_FaUDIk-rHUi8MvL7TaVZHE	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T16:25:23.073Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 16:25:30
ZmEw2ttjZ0xXr6CjQzGjDc7GXOmHZFv_	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:26:56.411Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 15:26:57
nixLvGyHpoRJIkvEJmVfus2gizFMyKHn	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T09:41:03.325Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 09:41:10
xw0jazhoYMoLl-9-db-H38z64dqrKEZe	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T14:43:25.299Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 14:43:33
qaODaYQwZtvoM8Ma9oOz0LYVeF2x3rYr	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:22:11.434Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 15:22:12
9ODfJNjbE0HFCYzRBwssZofVBGAfWRZG	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:22:11.500Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 15:22:12
UsE2Z_ET362vRo4qKn9BS8pdvMaREfGk	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:22:11.565Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 15:22:12
_cyEP1Su77gR3K1Gw_RgewIxaghGpLBo	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T13:57:03.214Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 13:57:04
QIrRBQIYTFxnLPcuVBaatVSX3HPR8Zl3	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T16:05:21.907Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 16:05:22
zSkwpjDy7wKuVaNsBYgxpqHcw3HVNjOd	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-17T18:24:32.332Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-17 18:24:34
WEbvw97PwlfKOzZdMJ2PUrtgiu3Wx8CJ	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-11T15:59:19.200Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-11 15:59:26
-wIK0shHizpXS3Kf0B_26aUcIQUuDeIG	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-11T14:56:11.010Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-11 14:56:18
vZXfnNJehbqEJXQ-WIrmEXE0jjmp-2n8	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-11T17:54:47.291Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"62797tA7","role":"owner_admin","demoSessionTenantId":"demo_session_9cda15e2-8c39-411b-adb5-95f102414de3"}	2026-03-11 17:55:32
U6fViVaGq-bIqybyGWlA5Q2Kfo7IT_xB	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T14:30:50.178Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 14:30:56
x0vOqM_tfo52_5Vt_tkFF2ww18m61kDa	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-15T12:29:06.103Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-15 12:31:54
LflX96_n-SwbqlNQllhaUWv4Y8t0bpdD	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-14T12:54:26.075Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-14 12:54:32
X0Faj1t1yqsTh0wnZBe7sz40Evdqoxyc	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:06:35.342Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"ff5b544d-40fe-49f4-8325-34a99146bca0","role":"owner_admin"}	2026-03-12 15:09:29
oVnWKNPlP2dBZbkWjZ07ZwfKtpoRfSpJ	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T13:55:11.916Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 13:55:18
jPf_Gy_6_fyFc_iKDgD1KlC8_OQP7Eoy	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:46:59.477Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 15:47:06
tAD8buc1_uui-SFK6CaNDOUVox9ye9G0	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T10:38:41.848Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 10:38:48
jWTgatCm3rLL2OmfUYdgGK_nKBpTxeop	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T14:56:27.097Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"62797tA7","role":"owner_admin","demoSessionTenantId":"demo_session_85da8910-ffef-44fc-9831-3eb37f9132fd"}	2026-03-12 14:57:06
wCtPHNuC4EVkusGcwP3PTOz7XTWnISj6	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-17T11:37:13.299Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-17 11:37:19
s1skZzdcynB_FwS1mnyyneaCV8InJUgn	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-11T17:52:48.133Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-11 17:53:10
N_GFvNA8TRJUnF13CKtlQIu9BxVMkSf4	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-17T15:18:24.859Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-17 15:18:31
8uWdh4sN9lzPX0Q9QiN7ZBAdZT8EcqFD	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-12T15:15:35.857Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-12 15:15:42
L9CAHYZQUlHKsirUJRfHsRpLJ33dBSAN	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T13:00:01.035Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 13:00:03
0cNwZX1VCfdDXz0MXT7k47tOefiasJup	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-17T17:31:37.671Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-17 17:31:43
AUq1ibLydKxXlrmKebtFTRIMDqkvFLWT	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-17T11:04:54.084Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-17 11:04:56
Mix7nI_nxu-l8XwePzUeOWwafiU-3vk7	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-13T13:26:09.405Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-13 13:26:12
ZMXdvN6B98FZWUKQ1lUbGmKe8WYqmoZh	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-17T19:58:35.448Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-17 19:58:42
Y_z5VIL9zHWa8NuJ4YY7Evmj6946rEsO	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-14T16:12:28.228Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-14 16:12:30
mu8fj0ZKmBSeGYX3EwyHX4Giv0H1-32Y	{"cookie":{"originalMaxAge":604800000,"expires":"2026-03-15T13:05:53.460Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2026-03-15 13:06:00
\.


--
-- Data for Name: staff_feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_feedback (id, owner_id, staff_id, hotel_id, tenant_id, type, reason, score_impact, created_at) FROM stdin;
\.


--
-- Data for Name: staff_invitations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_invitations (id, property_id, owner_id, email, staff_role, status, invited_by, accepted_by, invite_token, created_at, updated_at, tenant_id) FROM stdin;
df71356f-946e-480c-b13d-c595500d2296	579129ae-3ff4-42ec-825a-61c7c5319d85	afa0de93-1326-4fe4-a339-f65121ba4bcb	ramin.v@orange-studio.az	front_desk	pending	8317f3c8-f1f9-4b9f-8570-25968af7ef28	\N	1c26decc-13ec-4ab3-bddd-268b029f9a25	2026-02-19 16:42:15.095139	2026-02-19 16:42:15.095139	\N
07ad2ca1-da8d-4cf1-930e-56176c9cf2c3	fb04e537-345b-4e39-9d19-959e2eded6dc	f73182bf-6a38-4126-b94d-7ef754bc3db2	ramin.v@orange-studio.az	front_desk	accepted	8da0da3f-8e4a-4623-ac41-789ee316b827	5928ad00-69b2-4c01-a6c5-5379c5110c4b	f32f3b2b-1762-44f5-b97e-3ad86ebc54d2	2026-02-20 09:33:02.660849	2026-02-20 09:34:09.741	\N
c677f64b-26b6-4ae6-ac6a-7ed123bd27b4	fb04e537-345b-4e39-9d19-959e2eded6dc	f73182bf-6a38-4126-b94d-7ef754bc3db2	ramin.v@orange-studio.az	front_desk	accepted	8da0da3f-8e4a-4623-ac41-789ee316b827	b7c11396-9a5a-48a3-8443-9e2e199ac124	e69c9bf3-5a87-4b6b-ab53-7bb344797659	2026-02-20 09:38:30.961437	2026-02-20 09:39:26.129	\N
02dd3ac4-3d74-4c98-aba4-e4cbb40413a5	b8762915-3c99-457c-84ff-42190b4a4440	13a6c421-6b54-4799-8a9d-b3bb456ef0da	rnurullayeva@gmail.com	manager	pending	e66113d2-4e1e-4635-8ef6-8d3c8ad3bfdb	\N	89a4bf2c-e2e6-4681-822e-61c34886b9eb	2026-02-20 11:53:27.090694	2026-02-20 11:53:27.090694	\N
d44e36ad-b69e-4576-878a-f4502bbb3768	b8762915-3c99-457c-84ff-42190b4a4440	13a6c421-6b54-4799-8a9d-b3bb456ef0da	ramin.v@orange-studio.az	front_desk	accepted	e66113d2-4e1e-4635-8ef6-8d3c8ad3bfdb	853b0e41-82f6-48bc-b8ed-7b7ea052b3d4	aa5c4f24-28d2-4b22-86bc-e1d4386f89a9	2026-02-20 11:55:15.61842	2026-02-20 12:02:44.922	\N
f1c5b5cb-9201-4016-b317-73ec38b5d94d	b8762915-3c99-457c-84ff-42190b4a4440	13a6c421-6b54-4799-8a9d-b3bb456ef0da	attila.nikbakht1988@gmail.com	front_desk	pending	e66113d2-4e1e-4635-8ef6-8d3c8ad3bfdb	\N	e79f1711-2174-4e4d-8f40-ca038a7bb307	2026-02-20 12:05:11.33811	2026-02-20 12:05:11.33811	\N
d30b7bd9-7f68-4608-9c2e-1059ab5845df	b8762915-3c99-457c-84ff-42190b4a4440	13a6c421-6b54-4799-8a9d-b3bb456ef0da	ramin.v@orange-studio.az	front_desk	accepted	e66113d2-4e1e-4635-8ef6-8d3c8ad3bfdb	480eaa8f-5d14-4f0b-8a19-25c9d2725527	8cb4c86a-8339-47c3-91b7-51dadc4926c1	2026-02-20 12:06:14.918808	2026-02-20 12:07:07.638	\N
\.


--
-- Data for Name: staff_message_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_message_status (id, message_id, staff_id, is_read, read_at) FROM stdin;
\.


--
-- Data for Name: staff_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_messages (id, hotel_id, tenant_id, sender_role, sender_id, message_text, created_at) FROM stdin;
\.


--
-- Data for Name: staff_performance_scores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_performance_scores (id, staff_id, hotel_id, tenant_id, message_response_score, task_completion_score, service_quality_score, activity_score, manual_adjustment, total_score, period, calculated_at) FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (id, owner_id, plan_type, feature_flags, max_properties, max_units_per_property, start_date, end_date, is_active, created_at, tenant_id, trial_ends_at, smart_plan_type, max_staff, multi_property, performance_enabled, staff_performance_enabled, advanced_analytics, priority_support, custom_integrations, smart_rooms_enabled, guest_management, staff_management, plan_code, status, current_period_start, current_period_end, auto_renew, cancel_at_period_end, failed_payment_attempts, last_payment_order_id, updated_at) FROM stdin;
b641d94c-e1df-49fd-be1b-14cac5c183de	6bc37ae9-1cac-4cf0-920a-2c54d018cb53	pro	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	999	50	2026-02-20 08:08:49.378579	\N	t	2026-02-20 08:08:49.378579	6bc37ae9-1cac-4cf0-920a-2c54d018cb53	\N	none	999	t	t	t	t	f	f	f	t	t	CORE_PRO	active	2026-02-20 08:08:49.378579	\N	t	f	0	\N	2026-03-05 14:50:56.998986
69988c98-f408-4072-af0f-c797601ed44b	87772a76-ada5-4dc6-bacf-9e949d17ffc6	basic	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	1	50	2026-02-14 14:41:51.816722	\N	t	2026-02-14 14:41:51.816722	\N	\N	none	0	f	f	f	f	f	f	f	t	f	CORE_STARTER	active	2026-02-14 14:41:51.816722	\N	t	f	0	\N	2026-03-05 14:50:56.998986
bbc25f1d-0b52-4a5b-a590-581a14d4c495	afa0de93-1326-4fe4-a339-f65121ba4bcb	trial	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	1	50	2026-02-19 16:41:22.893866	\N	t	2026-02-19 16:41:22.893866	\N	2026-03-05 16:41:22.892	none	0	f	f	f	f	f	f	f	t	f	CORE_STARTER	trial	2026-02-19 16:41:22.893866	2026-03-05 16:41:22.892	t	f	0	\N	2026-03-05 14:50:56.998986
4454b8ac-573b-4715-8958-659a0fa767d9	02d18ce6-ec09-48c3-948e-741eeceaee86	trial	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	1	50	2026-02-19 16:43:35.768715	\N	t	2026-02-19 16:43:35.768715	\N	2026-03-05 16:43:35.767	none	0	f	f	f	f	f	f	f	t	f	CORE_STARTER	trial	2026-02-19 16:43:35.768715	2026-03-05 16:43:35.767	t	f	0	\N	2026-03-05 14:50:56.998986
d0ff1cfa-fee5-41eb-be92-c23d29af23be	6dec171d-d048-47d4-a5d4-1476a7b5390a	trial	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	1	50	2026-02-19 17:05:59.846438	\N	t	2026-02-19 17:05:59.846438	\N	2026-03-05 17:05:59.845	none	0	f	f	f	f	f	f	f	t	f	CORE_STARTER	trial	2026-02-19 17:05:59.846438	2026-03-05 17:05:59.845	t	f	0	\N	2026-03-05 14:50:56.998986
14826b60-3a2f-4ab0-a011-9b0df47c4a95	ac506214-8952-45da-97f0-0e771f8543a2	pro	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	1	50	2026-02-20 06:40:15.892145	\N	t	2026-02-20 06:40:15.892145	\N	\N	none	0	t	t	t	t	t	t	f	t	t	CORE_PRO	active	2026-02-20 06:40:15.892145	\N	t	f	0	\N	2026-03-05 14:50:56.998986
a03b93e9-67d1-4f8d-9e31-a42abb02132e	11405dd7-d6b6-4d46-8774-bbaa16c01f71	pro	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	999	999	2026-02-19 17:35:05.786422	\N	t	2026-02-19 17:35:05.786422	\N	2026-03-05 17:35:05.785	none	999	t	t	t	t	t	t	f	t	t	CORE_PRO	active	2026-02-19 17:35:05.786422	2026-03-05 17:35:05.785	t	f	0	\N	2026-03-05 14:50:56.998986
69a9dd82-e13d-4093-8ff3-2d4327cb7b93	495c33fe-a392-439a-aec7-39d639d8b45c	trial	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	1	50	2026-02-19 17:38:52.942583	\N	t	2026-02-19 17:38:52.942583	\N	2026-03-05 17:38:52.941	none	0	f	f	f	f	f	f	f	t	f	CORE_STARTER	trial	2026-02-19 17:38:52.942583	2026-03-05 17:38:52.941	t	f	0	\N	2026-03-05 14:50:56.998986
f223fd8b-ccf5-4c06-a763-5f910f185d24	a8d4b603-ad1a-4807-ad4d-d992076c5892	starter	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	1	50	2026-02-19 18:40:15.293789	\N	t	2026-02-19 18:40:15.293789	\N	2026-03-05 18:40:15.292	none	5	f	f	f	f	f	f	f	t	t	CORE_STARTER	active	2026-02-19 18:40:15.293789	2026-03-05 18:40:15.292	t	f	0	\N	2026-03-05 14:50:56.998986
fa1c936c-e9f8-47e6-871e-786b6c08ff2b	e333d1d7-db91-4f5a-a85b-f78b25df2b53	pro	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	1	50	2026-02-20 07:49:44.040379	\N	t	2026-02-20 07:49:44.040379	\N	\N	none	0	t	t	t	t	t	t	f	t	t	CORE_PRO	active	2026-02-20 07:49:44.040379	\N	t	f	0	\N	2026-03-05 14:50:56.998986
24125f46-265e-4ebf-89bf-9748c53fe1a9	bc78df31-2b2a-4daa-a3d8-51a0ca8baa10	trial	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	999	999	2026-02-20 08:50:33.274465	\N	t	2026-02-20 08:50:33.274465	\N	2026-03-06 08:50:33.273	none	999	t	t	t	t	t	t	f	t	t	CORE_PRO	trial	2026-02-20 08:50:33.274465	2026-03-06 08:50:33.273	t	f	0	\N	2026-03-05 14:50:56.998986
cc115603-caf0-4b91-850a-6b464abd5c1b	ae2ddc1d-50dc-489d-b690-73465af34a13	trial	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	1	50	2026-02-20 08:56:25.591465	\N	t	2026-02-20 08:56:25.591465	\N	2026-03-06 08:56:25.59	none	5	f	f	f	f	f	f	f	t	t	CORE_STARTER	trial	2026-02-20 08:56:25.591465	2026-03-06 08:56:25.59	t	f	0	\N	2026-03-05 14:50:56.998986
941d5e52-118b-42d1-9252-6ead3f46b1da	f73182bf-6a38-4126-b94d-7ef754bc3db2	trial	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	3	30	2026-02-20 09:25:24.026101	\N	t	2026-02-20 09:25:24.026101	\N	2026-03-06 09:25:24.025	none	20	t	t	t	t	f	f	f	t	t	CORE_GROWTH	trial	2026-02-20 09:25:24.026101	2026-03-06 09:25:24.025	t	f	0	\N	2026-03-05 14:50:56.998986
56dc2ac3-8a80-487a-9956-a8f1dfd3edda	7402ec1b-29e9-4041-86d5-711beacb39e7	trial	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	1	20	2026-02-20 10:24:50.800867	\N	t	2026-02-20 10:24:50.800867	\N	2026-03-06 10:24:50.8	none	5	f	f	f	f	f	f	f	t	t	CORE_STARTER	trial	2026-02-20 10:24:50.800867	2026-03-06 10:24:50.8	t	f	0	\N	2026-03-05 14:50:56.998986
accbb303-268b-431f-8c07-f1a30238efbc	4b40a969-f41d-4722-bf60-e60829e7bc90	trial	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	1	20	2026-03-04 10:02:21.157543	\N	t	2026-03-04 10:02:21.157543	\N	2026-03-18 10:02:21.156	none	5	f	f	f	f	f	f	f	t	t	CORE_STARTER	trial	2026-03-04 10:02:21.157543	2026-03-18 10:02:21.156	t	f	0	\N	2026-03-05 14:50:56.998986
dd322694-a454-42ce-9f68-819c372fbb60	11e77135-6f73-422d-8b48-244d2137c1e6	trial	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	3	30	2026-03-05 15:06:34.956397	\N	t	2026-03-05 15:06:34.956397	\N	2026-03-19 15:06:34.955	none	20	t	t	t	t	f	f	f	t	t	CORE_GROWTH	active	2026-03-05 15:06:34.956397	\N	t	f	0	\N	2026-03-05 15:06:34.956397
0bb6711f-4440-4b28-8b6b-37f3ab9bd4ef	e10e1ae2-7ac4-4814-8db4-b701c457309d	trial	{"analytics": true, "smart_room": true, "iot_devices": false, "ai_concierge": false}	1	20	2026-03-11 12:47:41.411587	\N	t	2026-03-11 12:47:41.411587	\N	2026-03-25 12:47:41.41	none	5	f	f	f	f	f	f	f	t	t	CORE_STARTER	active	2026-03-11 12:47:41.411587	\N	t	f	0	\N	2026-03-11 12:47:41.411587
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.units (id, property_id, owner_id, unit_number, unit_type, name, floor, capacity, description, amenities, price_per_night, status, is_active, created_at, unit_category, tenant_id) FROM stdin;
fc12fb0e-71ce-42ef-9b67-e5da59ef8a8c	579129ae-3ff4-42ec-825a-61c7c5319d85	afa0de93-1326-4fe4-a339-f65121ba4bcb	STA-001	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 16:41:48.39079	accommodation	afa0de93-1326-4fe4-a339-f65121ba4bcb
57c504dc-e14e-4f1a-9b6f-657a9777a904	579129ae-3ff4-42ec-825a-61c7c5319d85	afa0de93-1326-4fe4-a339-f65121ba4bcb	STA-002	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 16:41:48.396404	accommodation	afa0de93-1326-4fe4-a339-f65121ba4bcb
95e1d529-6ee1-45b3-ad9d-8aa1d7436d5c	579129ae-3ff4-42ec-825a-61c7c5319d85	afa0de93-1326-4fe4-a339-f65121ba4bcb	STA-003	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 16:41:48.40026	accommodation	afa0de93-1326-4fe4-a339-f65121ba4bcb
6bab022a-e559-4840-8457-72c6f85c5809	579129ae-3ff4-42ec-825a-61c7c5319d85	afa0de93-1326-4fe4-a339-f65121ba4bcb	STA-004	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 16:41:48.403775	accommodation	afa0de93-1326-4fe4-a339-f65121ba4bcb
943af9a5-4f48-4ec8-b8ff-2edc683575ad	579129ae-3ff4-42ec-825a-61c7c5319d85	afa0de93-1326-4fe4-a339-f65121ba4bcb	STA-005	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 16:41:48.407096	accommodation	afa0de93-1326-4fe4-a339-f65121ba4bcb
0a9ccd10-3cfa-42eb-85e5-6988cfe6db0b	579129ae-3ff4-42ec-825a-61c7c5319d85	afa0de93-1326-4fe4-a339-f65121ba4bcb	r	parking_spot	r	\N	\N	\N	\N	\N	available	t	2026-02-19 16:42:37.138604	parking	\N
8ad08901-c063-443c-8105-977089e42513	e2475222-a91c-4167-b334-99f020731951	02d18ce6-ec09-48c3-948e-741eeceaee86	STA-001	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 16:43:54.936141	accommodation	02d18ce6-ec09-48c3-948e-741eeceaee86
6980f2f0-f4a8-497d-9e98-2f5b373a8201	e2475222-a91c-4167-b334-99f020731951	02d18ce6-ec09-48c3-948e-741eeceaee86	STA-002	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 16:43:54.939888	accommodation	02d18ce6-ec09-48c3-948e-741eeceaee86
1bcf15a6-a751-4851-b6ab-7087608c6eff	e2475222-a91c-4167-b334-99f020731951	02d18ce6-ec09-48c3-948e-741eeceaee86	STA-003	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 16:43:54.943347	accommodation	02d18ce6-ec09-48c3-948e-741eeceaee86
7354e460-0db4-437d-9ee5-8b66e0b62a40	e2475222-a91c-4167-b334-99f020731951	02d18ce6-ec09-48c3-948e-741eeceaee86	STA-004	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 16:43:54.946451	accommodation	02d18ce6-ec09-48c3-948e-741eeceaee86
8ce043fc-6186-4847-b622-95c6b42158ff	e2475222-a91c-4167-b334-99f020731951	02d18ce6-ec09-48c3-948e-741eeceaee86	STA-005	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 16:43:54.949685	accommodation	02d18ce6-ec09-48c3-948e-741eeceaee86
13bb196a-6f78-4e8e-991f-3f426f5a4d00	d2959c48-95f9-4bf0-9f48-3f1f85ddbb70	6dec171d-d048-47d4-a5d4-1476a7b5390a	STA-001	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:06:16.64123	accommodation	6dec171d-d048-47d4-a5d4-1476a7b5390a
9814fe4e-fc0b-40a1-9c9d-ce6334fff8d3	d2959c48-95f9-4bf0-9f48-3f1f85ddbb70	6dec171d-d048-47d4-a5d4-1476a7b5390a	STA-002	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:06:16.646166	accommodation	6dec171d-d048-47d4-a5d4-1476a7b5390a
87f8257d-e9b8-49ef-8532-4c17fbd8bd48	d2959c48-95f9-4bf0-9f48-3f1f85ddbb70	6dec171d-d048-47d4-a5d4-1476a7b5390a	STA-003	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:06:16.652036	accommodation	6dec171d-d048-47d4-a5d4-1476a7b5390a
573caeb1-03dd-41bb-85a4-d7743af5b45a	d2959c48-95f9-4bf0-9f48-3f1f85ddbb70	6dec171d-d048-47d4-a5d4-1476a7b5390a	STA-004	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:06:16.656516	accommodation	6dec171d-d048-47d4-a5d4-1476a7b5390a
52818049-5ca2-4a92-8309-d4d7e06d2ff3	d2959c48-95f9-4bf0-9f48-3f1f85ddbb70	6dec171d-d048-47d4-a5d4-1476a7b5390a	STA-005	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:06:16.660712	accommodation	6dec171d-d048-47d4-a5d4-1476a7b5390a
16495a29-0043-408c-81bb-78e3717990e8	d60048fa-971f-486c-a8db-610a5965ad97	11405dd7-d6b6-4d46-8774-bbaa16c01f71	STA-001	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:35:40.839481	accommodation	11405dd7-d6b6-4d46-8774-bbaa16c01f71
743e36eb-f8a7-45c9-8cb9-213844eab285	d60048fa-971f-486c-a8db-610a5965ad97	11405dd7-d6b6-4d46-8774-bbaa16c01f71	STA-002	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:35:40.847893	accommodation	11405dd7-d6b6-4d46-8774-bbaa16c01f71
af5152b7-e17b-4932-9793-347da0391231	d60048fa-971f-486c-a8db-610a5965ad97	11405dd7-d6b6-4d46-8774-bbaa16c01f71	STA-003	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:35:40.860188	accommodation	11405dd7-d6b6-4d46-8774-bbaa16c01f71
ff36b7dc-076d-4d36-98a4-155599985e90	d60048fa-971f-486c-a8db-610a5965ad97	11405dd7-d6b6-4d46-8774-bbaa16c01f71	STA-004	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:35:40.867327	accommodation	11405dd7-d6b6-4d46-8774-bbaa16c01f71
6911bcf1-8b76-407d-af3e-5b90f64ea81c	d60048fa-971f-486c-a8db-610a5965ad97	11405dd7-d6b6-4d46-8774-bbaa16c01f71	STA-005	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:35:40.872106	accommodation	11405dd7-d6b6-4d46-8774-bbaa16c01f71
7678e187-a5a0-4366-ae52-6f0741be0279	c43b9ca9-7855-43b7-8c41-d2863b88e47a	495c33fe-a392-439a-aec7-39d639d8b45c	STA-001	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:39:11.773945	accommodation	495c33fe-a392-439a-aec7-39d639d8b45c
1e261d2e-4f2e-4ed1-abe7-9ef582d1e7f2	c43b9ca9-7855-43b7-8c41-d2863b88e47a	495c33fe-a392-439a-aec7-39d639d8b45c	STA-002	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:39:11.777784	accommodation	495c33fe-a392-439a-aec7-39d639d8b45c
aa87e39c-c009-4527-ae19-adc2174a4310	c43b9ca9-7855-43b7-8c41-d2863b88e47a	495c33fe-a392-439a-aec7-39d639d8b45c	STA-003	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:39:11.78384	accommodation	495c33fe-a392-439a-aec7-39d639d8b45c
7e939f3f-498c-4c41-b662-bef60613bf03	c43b9ca9-7855-43b7-8c41-d2863b88e47a	495c33fe-a392-439a-aec7-39d639d8b45c	STA-004	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:39:11.787352	accommodation	495c33fe-a392-439a-aec7-39d639d8b45c
22e5307e-f47b-480c-8b4a-4d7a2199340f	c43b9ca9-7855-43b7-8c41-d2863b88e47a	495c33fe-a392-439a-aec7-39d639d8b45c	STA-005	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 17:39:11.79498	accommodation	495c33fe-a392-439a-aec7-39d639d8b45c
405b1936-85df-4df7-b9f6-143b0f9d15a3	72122e33-d1a4-4805-bae0-57c020b13ce6	a8d4b603-ad1a-4807-ad4d-d992076c5892	STA-001	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 18:40:34.223394	accommodation	a8d4b603-ad1a-4807-ad4d-d992076c5892
4f3f2397-0091-47e1-895f-a9f65e9317b2	72122e33-d1a4-4805-bae0-57c020b13ce6	a8d4b603-ad1a-4807-ad4d-d992076c5892	STA-002	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 18:40:34.227191	accommodation	a8d4b603-ad1a-4807-ad4d-d992076c5892
79256013-1582-461d-8209-58e4974191fb	72122e33-d1a4-4805-bae0-57c020b13ce6	a8d4b603-ad1a-4807-ad4d-d992076c5892	STA-003	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 18:40:34.230474	accommodation	a8d4b603-ad1a-4807-ad4d-d992076c5892
d454003d-c1dc-488d-9a75-55f20a8c5aee	72122e33-d1a4-4805-bae0-57c020b13ce6	a8d4b603-ad1a-4807-ad4d-d992076c5892	STA-004	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 18:40:34.233692	accommodation	a8d4b603-ad1a-4807-ad4d-d992076c5892
204a8c14-89c1-4df4-b685-44f0ddef5cd9	72122e33-d1a4-4805-bae0-57c020b13ce6	a8d4b603-ad1a-4807-ad4d-d992076c5892	STA-005	standard	\N	\N	2	\N	\N	100	available	t	2026-02-19 18:40:34.237043	accommodation	a8d4b603-ad1a-4807-ad4d-d992076c5892
990638c1-7659-4637-b72a-825344177eb4	af2cc7de-c86c-485f-bc92-d0125ec094fb	ac506214-8952-45da-97f0-0e771f8543a2	STA-001	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 06:40:33.38056	accommodation	ac506214-8952-45da-97f0-0e771f8543a2
10f09b79-51ae-4197-8f65-464311dfca5a	af2cc7de-c86c-485f-bc92-d0125ec094fb	ac506214-8952-45da-97f0-0e771f8543a2	STA-002	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 06:40:33.389689	accommodation	ac506214-8952-45da-97f0-0e771f8543a2
fe932d16-4fe9-4f12-a50b-899ba83777fe	af2cc7de-c86c-485f-bc92-d0125ec094fb	ac506214-8952-45da-97f0-0e771f8543a2	STA-003	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 06:40:33.393093	accommodation	ac506214-8952-45da-97f0-0e771f8543a2
5a8543f5-5e2b-49de-bd4b-c052e801284a	af2cc7de-c86c-485f-bc92-d0125ec094fb	ac506214-8952-45da-97f0-0e771f8543a2	STA-004	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 06:40:33.396543	accommodation	ac506214-8952-45da-97f0-0e771f8543a2
7700b8b4-b190-4418-9a7d-458001e7735e	af2cc7de-c86c-485f-bc92-d0125ec094fb	ac506214-8952-45da-97f0-0e771f8543a2	STA-005	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 06:40:33.400093	accommodation	ac506214-8952-45da-97f0-0e771f8543a2
8298acb9-8eed-45d7-b096-3df6e690b767	b0803298-c2e9-44ac-b28d-4866be2e217e	ae2ddc1d-50dc-489d-b690-73465af34a13	STA-001	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 08:57:18.924002	accommodation	ae2ddc1d-50dc-489d-b690-73465af34a13
33744b78-a0fb-44de-8bef-c0ca444ded54	b0803298-c2e9-44ac-b28d-4866be2e217e	ae2ddc1d-50dc-489d-b690-73465af34a13	STA-002	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 08:57:18.927008	accommodation	ae2ddc1d-50dc-489d-b690-73465af34a13
27a2c08c-0240-4aa4-a528-c36ad55e38db	b0803298-c2e9-44ac-b28d-4866be2e217e	ae2ddc1d-50dc-489d-b690-73465af34a13	STA-003	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 08:57:18.929994	accommodation	ae2ddc1d-50dc-489d-b690-73465af34a13
4c517173-f46b-4094-bbf9-77e9505d18ad	b0803298-c2e9-44ac-b28d-4866be2e217e	ae2ddc1d-50dc-489d-b690-73465af34a13	STA-004	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 08:57:18.933434	accommodation	ae2ddc1d-50dc-489d-b690-73465af34a13
ed69358c-9986-430c-a117-56cd3fc31e3e	b0803298-c2e9-44ac-b28d-4866be2e217e	ae2ddc1d-50dc-489d-b690-73465af34a13	STA-005	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 08:57:18.936336	accommodation	ae2ddc1d-50dc-489d-b690-73465af34a13
496ff178-99c3-4ca6-87a2-8f2dd8c30589	c25cfca8-9f81-44f5-b0d1-14b9ccaf6071	f73182bf-6a38-4126-b94d-7ef754bc3db2	STA-001	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 09:25:45.42259	accommodation	f73182bf-6a38-4126-b94d-7ef754bc3db2
0bec17d5-e0ba-4356-8753-2fe97710fd30	c25cfca8-9f81-44f5-b0d1-14b9ccaf6071	f73182bf-6a38-4126-b94d-7ef754bc3db2	STA-002	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 09:25:45.426793	accommodation	f73182bf-6a38-4126-b94d-7ef754bc3db2
81c3dd13-3e8f-4ecc-9aa6-f1f062dc84d2	c25cfca8-9f81-44f5-b0d1-14b9ccaf6071	f73182bf-6a38-4126-b94d-7ef754bc3db2	STA-003	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 09:25:45.431391	accommodation	f73182bf-6a38-4126-b94d-7ef754bc3db2
8177964e-202b-4c47-9d35-68d8af78fc43	c25cfca8-9f81-44f5-b0d1-14b9ccaf6071	f73182bf-6a38-4126-b94d-7ef754bc3db2	STA-004	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 09:25:45.435121	accommodation	f73182bf-6a38-4126-b94d-7ef754bc3db2
974efd53-d2da-410e-8ef7-9ff00fe06b0b	c25cfca8-9f81-44f5-b0d1-14b9ccaf6071	f73182bf-6a38-4126-b94d-7ef754bc3db2	STA-005	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 09:25:45.438852	accommodation	f73182bf-6a38-4126-b94d-7ef754bc3db2
5b6682d1-cf89-4b10-a4d2-3cf4111d0a38	fb04e537-345b-4e39-9d19-959e2eded6dc	f73182bf-6a38-4126-b94d-7ef754bc3db2	1	room	2	1	2	\N	\N	\N	available	t	2026-02-20 09:27:09.940009	accommodation	\N
5a4535f8-7791-4418-9f1f-6fc3e14c23bb	2196d0ed-08de-474f-a104-d0c0d5f8fb02	7402ec1b-29e9-4041-86d5-711beacb39e7	STA-001	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 10:25:21.148886	accommodation	7402ec1b-29e9-4041-86d5-711beacb39e7
6bf4f149-09db-4408-8ff1-ef31ed0fb9b7	2196d0ed-08de-474f-a104-d0c0d5f8fb02	7402ec1b-29e9-4041-86d5-711beacb39e7	STA-002	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 10:25:21.152442	accommodation	7402ec1b-29e9-4041-86d5-711beacb39e7
bd469b10-64ef-4353-9c88-026bf66a504e	2196d0ed-08de-474f-a104-d0c0d5f8fb02	7402ec1b-29e9-4041-86d5-711beacb39e7	STA-003	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 10:25:21.15518	accommodation	7402ec1b-29e9-4041-86d5-711beacb39e7
14b9b0e6-422b-4398-8b2b-a6d0fd2fe0c9	2196d0ed-08de-474f-a104-d0c0d5f8fb02	7402ec1b-29e9-4041-86d5-711beacb39e7	STA-004	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 10:25:21.158329	accommodation	7402ec1b-29e9-4041-86d5-711beacb39e7
e1abaa2e-1dcc-4aec-a1fe-40badc10627a	2196d0ed-08de-474f-a104-d0c0d5f8fb02	7402ec1b-29e9-4041-86d5-711beacb39e7	STA-005	standard	\N	\N	2	\N	\N	100	available	t	2026-02-20 10:25:21.160804	accommodation	7402ec1b-29e9-4041-86d5-711beacb39e7
unit-103	prop-test-rs	899d7a50-7ac8-4c57-b16a-035da45ab8dc	103	suite	\N	2	4	\N	\N	\N	ready	t	2026-02-24 12:31:02.57518	accommodation	899d7a50-7ac8-4c57-b16a-035da45ab8dc
unit-102	prop-test-rs	899d7a50-7ac8-4c57-b16a-035da45ab8dc	102	room	\N	1	2	\N	\N	\N	dirty	t	2026-02-24 12:31:02.57518	accommodation	899d7a50-7ac8-4c57-b16a-035da45ab8dc
unit-101	prop-test-rs	899d7a50-7ac8-4c57-b16a-035da45ab8dc	101	room	\N	1	2	\N	\N	\N	ready	t	2026-02-24 12:31:02.57518	accommodation	899d7a50-7ac8-4c57-b16a-035da45ab8dc
c0bba3df-f098-49a5-8e58-17b6243e3f2f	d7bb67a8-f871-42d1-a78f-1115b35f04e9	e10e1ae2-7ac4-4814-8db4-b701c457309d	STA-001	standard	\N	\N	2	\N	\N	100	available	t	2026-03-11 12:47:52.137034	accommodation	e10e1ae2-7ac4-4814-8db4-b701c457309d
e3021e41-40a4-4200-8cd5-cd54c0ac4021	d7bb67a8-f871-42d1-a78f-1115b35f04e9	e10e1ae2-7ac4-4814-8db4-b701c457309d	STA-002	standard	\N	\N	2	\N	\N	100	available	t	2026-03-11 12:47:52.144074	accommodation	e10e1ae2-7ac4-4814-8db4-b701c457309d
858f45fa-0b2f-4728-be3f-7d63ff054a83	d7bb67a8-f871-42d1-a78f-1115b35f04e9	e10e1ae2-7ac4-4814-8db4-b701c457309d	STA-003	standard	\N	\N	2	\N	\N	100	available	t	2026-03-11 12:47:52.146376	accommodation	e10e1ae2-7ac4-4814-8db4-b701c457309d
71ceef16-4d3d-4165-8c82-835e6756242e	d7bb67a8-f871-42d1-a78f-1115b35f04e9	e10e1ae2-7ac4-4814-8db4-b701c457309d	STA-004	standard	\N	\N	2	\N	\N	100	available	t	2026-03-11 12:47:52.149692	accommodation	e10e1ae2-7ac4-4814-8db4-b701c457309d
e25f05f8-a540-4c06-a0e1-c828d1ad9e13	d7bb67a8-f871-42d1-a78f-1115b35f04e9	e10e1ae2-7ac4-4814-8db4-b701c457309d	STA-005	standard	\N	\N	2	\N	\N	100	available	t	2026-03-11 12:47:52.152929	accommodation	e10e1ae2-7ac4-4814-8db4-b701c457309d
\.


--
-- Data for Name: usage_meters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usage_meters (id, owner_id, metric_type, current_value, max_allowed, last_updated, tenant_id) FROM stdin;
b3654049-1a92-4054-b0bc-e45946bd4590	11405dd7-d6b6-4d46-8774-bbaa16c01f71	properties	1	999	2026-03-06 13:38:28.737	\N
49bccff5-4b1b-4930-9a78-42dd67bfad99	11405dd7-d6b6-4d46-8774-bbaa16c01f71	units	5	998001	2026-03-06 13:38:28.744	\N
e61c8116-e1c6-45e9-90c3-74bc2977f14b	11405dd7-d6b6-4d46-8774-bbaa16c01f71	devices	0	999	2026-03-06 13:38:28.748	\N
a474796e-5d73-4a56-97ec-2a183f7680d7	11405dd7-d6b6-4d46-8774-bbaa16c01f71	users	5	999	2026-03-06 13:38:28.756	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, role, full_name, email, phone, avatar_url, created_at, hotel_id, language, phone_country_code, owner_id, property_id, tenant_id) FROM stdin;
2ac88303-6e1b-4f38-a844-c96844af6fef	GUEST-KN9Y	$2b$12$QT1rjLlBEHRgtmApHY18H.0Mxw7ipOo8hOrOCjhDjC.5Du2ZkvQoa	guest	Test HK Guest	testhkpro@test.com	+1234567890	\N	2026-02-24 13:15:15.30929	4941633e-88da-4920-92c5-6f29de45f79a	en	\N	\N	\N	demo_session_2c831ac8-9c02-411c-b930-799a0999b7b8
69d2ec0e-d832-4477-b631-c1d03de733ce	oss_admin	$2b$12$oH/hkKJLi3BkyPi1EOi87uuje2AGFWzFSotuROAeGJ/48jY2/ASkq	oss_super_admin	OSS Admin User	admin@orange-studio.az	\N	\N	2026-02-12 12:48:06.916685	\N	en	\N	\N	\N	\N
3e6b086d-382a-4ef2-b56c-ee5191701554	GUEST-DN7Z	$2b$12$S5hi8vnMMsJE6Hv9m2AC9ejqTVK.7itZEB00Wl6ZX17qT3fbxlMGi	guest	Test Payment Guest	test-payment@example.com	+994501234567	\N	2026-02-24 11:35:53.457642	4941633e-88da-4920-92c5-6f29de45f79a	en	\N	\N	\N	demo_session_3f0af152-9afc-4ef2-af0a-6cf8495bbfcc
3b8c75dd-3133-4d74-aa05-a392231fca06	trialtest2	$2b$12$dFlwG8QCWppnVgfWI08/B.zur/2/MxOs5GXpFovbbMh4K7zv5qsHG	owner_admin	Trial Test	trialtest2@test.com	\N	\N	2026-02-19 17:02:37.432984	\N	en	\N	1abed867-520f-42c0-87cb-836763296852	\N	\N
e9dd6201-3d01-4316-9baf-f6ac3cfe0a35	test11	$2b$12$nbPt8f311uLoPp65DlrNe.7huM9prankEcSDGYpOJ56VwErZXVq3K	owner_admin	Ramin Veghari	ramin.v@orange-studio.az	\N	\N	2026-02-19 17:38:53.390481	f79cf4d0-8944-4d83-9ced-976073ae2824	en	\N	495c33fe-a392-439a-aec7-39d639d8b45c	c43b9ca9-7855-43b7-8c41-d2863b88e47a	\N
c07aba9f-6502-4844-9528-c3aec9689f88	diagtest1	$2b$12$uCQ66PP2xjJ69nFlG1v/E.bF1JAnnv3XF2CTnUfynpKODiOiL9QEm	owner_admin	Diag Test	diag@test.com	\N	\N	2026-02-20 08:08:19.905145	\N	en	\N	6bc37ae9-1cac-4cf0-920a-2c54d018cb53	\N	\N
af7ba19d-06c4-4490-bc91-fda1414802ed	starter1	$2b$12$vj4IxSLMuIms8OrSiXpblOTCpeePIWt.UrkuNzKdSNSskfydm2vL6	owner_admin	Ramin Veghari	ramin.v@orange-studio.az	\N	\N	2026-02-20 08:56:26.039985	afdcc6cc-9212-4bd9-9bd2-403c0f824513	en	\N	ae2ddc1d-50dc-489d-b690-73465af34a13	b0803298-c2e9-44ac-b28d-4866be2e217e	\N
b7c11396-9a5a-48a3-8443-9e2e199ac124	staff33	$2b$12$uY2L1fFMebbfkZTiS0YsROMwPMGL5E9tRWyfCWs1IuTTIHsIGVwVa	reception	staff3	ramin.v@orange-studio.az	\N	\N	2026-02-20 09:39:26.116769	7577111e-642c-4e59-a839-6686f47c5256	en	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2	fb04e537-345b-4e39-9d19-959e2eded6dc	\N
81e76596-4329-4026-98e9-f2f040820245	GUEST-2FKT	$2b$12$WLH/isQ6e1LQAvENHmbHb.ny.mK/R7qVfhS7RBZHHTm0ZZKXNpugi	guest	rasd	ramin.v@orange-studio.az	+994501234567	\N	2026-02-20 10:18:42.232707	7577111e-642c-4e59-a839-6686f47c5256	en	\N	\N	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2
c765f89e-a13c-41a1-8b8f-7dfac07d72d7	GUEST-YYS9	$2b$12$QC6nLB1LAgAQLRN1d0.QTevWg5pXLRxqv27y866pTz0xaXjq4IrY2	guest	E2E Checkin Guest	e2e-checkin@example.com	+994509999999	\N	2026-02-24 12:00:58.918732	4941633e-88da-4920-92c5-6f29de45f79a	en	\N	\N	\N	demo_session_34e01e00-8509-47db-874b-3bbc6ed52284
0d33e5a9-5008-4e52-a897-42c81274ced3	demo_admin	$2b$12$GzKyzdw5.ImMFlH1PyyS3eYWYIeC3sQ4tdbjxvgYElZLFAgH.H88G	admin	James Wilson	james@grandriviera.com	+14155550103	\N	2026-02-24 20:02:36.518965	37e5945d-ac5f-42a5-9a1e-c29a6fdf668c	en	\N	11405dd7-d6b6-4d46-8774-bbaa16c01f71	d60048fa-971f-486c-a8db-610a5965ad97	\N
496c7a53-8626-4252-9c54-dd65e6b99f71	Black.ice.aframe2	$2b$12$HgaaLnacIFY/V2qKvbe3QO9Dei2wObXLTKn.NH4jZ48HGcn01qq1C	owner_admin	Ramin Veghari	ramin.v@orange-studio.az	\N	\N	2026-03-04 10:02:21.619936	ff6d2516-815b-40ae-ac7b-cf7a086dbaa0	en	\N	4b40a969-f41d-4722-bf60-e60829e7bc90	719dd5ca-c66f-4947-8b7e-1b30e22f787a	\N
ff5b544d-40fe-49f4-8325-34a99146bca0	admin_demo	$2b$12$22gZgQP/2Hm2au44x9Q32ulj2vJ5XOlJxDspa.NP2gaYn7/uDu.0q	owner_admin	Demo Admin	admin@demo.com	\N	\N	2026-03-05 15:06:35.332946	c7ebef61-6fbc-438f-8a44-639d53fcc58d	en	\N	11e77135-6f73-422d-8b48-244d2137c1e6	096b4ba5-e48a-4947-95fb-ca9352a29a41	\N
f365edad-3a97-42f6-a549-a5ffa19348e0	demo_guest1	$2b$12$vuld41siojE2LR06g6aOnunzIM7bveNF4CX1c2SyMqo.d6OVfe1Hm	guest	Sarah Johnson	sarah@example.com	+14155550200	\N	2026-02-20 14:03:24.399815	37e5945d-ac5f-42a5-9a1e-c29a6fdf668c	en	\N	11405dd7-d6b6-4d46-8774-bbaa16c01f71	d60048fa-971f-486c-a8db-610a5965ad97	\N
31746b7d-8021-4c7f-935d-a22770d0b81b	Black.ice.aframe3	$2b$12$nuRULbEswvME.eY99ygGWet0B3fn1y8MKrM1hnDoOgYv5i75y7oA.	owner_admin	Ramin Veghari	ramin.v@orange-studio.az	\N	\N	2026-03-11 12:47:41.7577	92cf194e-6096-4945-94a3-a005d1b3f822	en	\N	e10e1ae2-7ac4-4814-8db4-b701c457309d	d7bb67a8-f871-42d1-a78f-1115b35f04e9	\N
demo_staff_1	demo_staff	$2b$12$S5zCrLCjcH2ccef4GVYMqOzHirigi9ZEzxjYZdYStfFttuERjiiJ2	admin	Demo Staff	demo_staff@oss.hotel	\N	\N	2026-02-13 14:32:11.320322	4941633e-88da-4920-92c5-6f29de45f79a	en	\N	\N	\N	899d7a50-7ac8-4c57-b16a-035da45ab8dc
1a992ff9-d50f-4ec3-9721-12560d2c0e62	testadmin_lvPwUO	$2b$12$GV3iUW8.vGUIeNvjnh/rb.rfJX8jG6i8cY8xhBQd/E6hvTb8Lkp9C	owner_admin	Test Admin	testadmin@test.com	\N	\N	2026-02-14 14:41:52.316722	4b678775-1fb6-4b29-aeb6-66efd36254a6	en	\N	87772a76-ada5-4dc6-bacf-9e949d17ffc6	e9510355-d798-4f92-a102-1a59c2c2fc85	\N
8317f3c8-f1f9-4b9f-8570-25968af7ef28	test7	$2b$12$pHZ.PfXrny1e/NLac7Kme.mxMSY5BdeL3b/EC0fs.LzBkPKIVYNtq	owner_admin	Ramin Veghari	ramin.v@orange-studio.az	\N	\N	2026-02-19 16:41:23.433768	aa05c231-e9bf-4141-95fe-e570bd70953d	en	\N	afa0de93-1326-4fe4-a339-f65121ba4bcb	579129ae-3ff4-42ec-825a-61c7c5319d85	\N
85d0d02e-5942-47c4-929a-62479c70a788	test9	$2b$12$6y1tldYiX75LwHbzcJCl5eOq/fxf8aP5OFPVIjZ5DufoCOSXzuMOi	owner_admin	Ramin Veghari	ramin.v@orange-studio.az	\N	\N	2026-02-19 17:06:00.278548	92be9bf5-6d03-4993-9478-a6d838398a46	en	\N	6dec171d-d048-47d4-a5d4-1476a7b5390a	d2959c48-95f9-4bf0-9f48-3f1f85ddbb70	\N
da4e4e54-8610-4535-bbd9-de375e9f4337	test12	$2b$12$xPZKysEqWoSr1D5hpuhu8eHZo1J0qGHpSGgSdQqhVFjY1Svh0efgK	owner_admin	Ramin Veghari	ramin.v@orange-studio.az	\N	\N	2026-02-19 18:40:15.675149	e807c861-3c3e-41ed-b4d3-89dbe5020c2c	en	\N	a8d4b603-ad1a-4807-ad4d-d992076c5892	72122e33-d1a4-4805-bae0-57c020b13ce6	\N
67909c91-a893-46f1-ba80-6d668fbe1d6d	test55	$2b$12$s2E56H/cFWd9Z3qjg2pgLuGNdQ7sSwlUZvCZNw5srxt/eGe/1nWcy	owner_admin	Ramin Veghari	ramin.v@orange-studio.az	\N	\N	2026-02-20 06:40:16.351681	df0a1f3a-869f-455a-913c-5595c65e61f7	en	\N	ac506214-8952-45da-97f0-0e771f8543a2	af2cc7de-c86c-485f-bc92-d0125ec094fb	\N
8da0da3f-8e4a-4623-ac41-789ee316b827	orta1	$2b$12$oVjPv1QZewVWSQGk5pXJt.CwPs03mE7cjdqJxM1ZKIsWuvRWxqd.S	owner_admin	Ramin Veghari	ramin.v@orange-studio.az	\N	\N	2026-02-20 09:25:24.396224	7577111e-642c-4e59-a839-6686f47c5256	en	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2	c25cfca8-9f81-44f5-b0d1-14b9ccaf6071	\N
eeef0bea-79dd-41d7-96d2-54a05789e802	teststaff_-_p0y-	$2b$12$Cs3tCHCksscoSQqCBKp.1.8X/Dfcz/cJUHLPoQJpv5unUZifTj5Om	reception	TestStaff_cavE2x	\N	\N	\N	2026-02-20 09:57:14.745049	37e5945d-ac5f-42a5-9a1e-c29a6fdf668c	en	\N	11405dd7-d6b6-4d46-8774-bbaa16c01f71	d60048fa-971f-486c-a8db-610a5965ad97	\N
7e9c5281-144b-4a8f-8074-7f06a6fd7f50	test112	$2b$12$9L.YG6QnkmGJ2DkqJEAOw.ACZlGwzgpLfoMZ5UEC1DlJuqIAz/Oja	owner_admin	Ramin Veghari	ramin.v@orange-studio.az	\N	\N	2026-02-20 10:24:51.149169	24d1573c-c810-485c-a2f9-cc1d0ef3dfb2	en	\N	7402ec1b-29e9-4041-86d5-711beacb39e7	2196d0ed-08de-474f-a104-d0c0d5f8fb02	\N
9b1dfd0b-805b-4c70-abf9-329093db2892	GUEST-P4S7	$2b$12$lTV.xh0XHx5LC2cy..W3ZemY/o8bolbk7Qi1BN.4GTIG8Ie8G2w.C	guest	Checkin Test Guest	checkin-test@example.com	+994501234567	\N	2026-02-24 11:54:37.440734	4941633e-88da-4920-92c5-6f29de45f79a	en	\N	\N	\N	demo_session_54d883e0-d226-42eb-84df-bb19082f7e3f
8ac61fcc-aa08-4e0a-8c2a-0ab5ec3a1ce7	GUEST-G7ES	$2b$12$kdvkVTI4CaQT9lojxYyDve8sZLxsx5E/rL6I1c71AFXUyHtjl0dG.	guest	Case1 Guest Precheck First	case1@example.com	+994501111111	\N	2026-02-24 12:15:15.452952	4941633e-88da-4920-92c5-6f29de45f79a	en	\N	\N	\N	demo_session_3a963bc8-caba-40ab-8371-80f939ce96f7
62797tA7	demo_owner	$2b$12$E3tEP2OX1PIBrphpzXZ7v.NWljyd0SHcsmjhqd/hD1Ms48mZmpqQS	owner_admin	Demo Owner	demo_owner@example.com	\N	\N	2026-02-13 12:14:38.31533	37e5945d-ac5f-42a5-9a1e-c29a6fdf668c	az	\N	11405dd7-d6b6-4d46-8774-bbaa16c01f71	d60048fa-971f-486c-a8db-610a5965ad97	899d7a50-7ac8-4c57-b16a-035da45ab8dc
a3a1a731-f4f6-498f-96bb-33a8f99c5d37	GUEST-MP4F	$2b$12$5hJq9F.OVmw2OJrNg2g1XO/GHY2rndlVhxoxtHorp9D1GLEMSBW8W	guest	Case2 Guest Payment First	case2@example.com	+994502222222	\N	2026-02-24 12:16:11.874518	4941633e-88da-4920-92c5-6f29de45f79a	en	\N	\N	\N	demo_session_3a963bc8-caba-40ab-8371-80f939ce96f7
demo_recep_1	demo_reception	$2b$12$8VPXrcPM7df1SXB6765Oae57d6.QoGd1L9t1YK4mwy2M894iC4ZQa	reception	Demo Reception	demo_reception@oss.hotel	\N	\N	2026-02-13 14:32:15.292455	4941633e-88da-4920-92c5-6f29de45f79a	en	\N	\N	prop-test-rs	899d7a50-7ac8-4c57-b16a-035da45ab8dc
da401877-b991-474d-a193-acba0451280c	rectest_edz67t	$2b$12$D2BjA.p1.0FUcC4MZstzieX3sslc6s8IU45I3jmAl6BMtgHBI6m7K	reception	Reception Test OQi8	\N	\N	\N	2026-02-14 14:43:20.880409	4b678775-1fb6-4b29-aeb6-66efd36254a6	en	\N	87772a76-ada5-4dc6-bacf-9e949d17ffc6	e9510355-d798-4f92-a102-1a59c2c2fc85	\N
cedfcf50-2d94-4699-9dd1-1a1b11c14824	test8	$2b$12$IRrymz1wbZNx8ZV6WBP.rusG9nqwCE25cErBETeOVwr0q8GW6LQ7m	owner_admin	Ramin Veghari	ramin.v@orange-studio.az	\N	\N	2026-02-19 16:43:36.196882	13bb4267-9856-4790-9c33-02b989ffbbc9	en	\N	02d18ce6-ec09-48c3-948e-741eeceaee86	e2475222-a91c-4167-b334-99f020731951	\N
b7a5a248-a499-45ad-bc91-e1fb33cc06ec	owner_s8ZgDn	$2b$12$e9YeJgjEPlihVI8X5Zfvlem/YsLMCVYDu7w0Qi6mMtuAnumsOswp.	owner_admin	Demo Owner	demo_owner+test@example.com	\N	\N	2026-02-19 17:35:06.264585	37e5945d-ac5f-42a5-9a1e-c29a6fdf668c	en	\N	11405dd7-d6b6-4d46-8774-bbaa16c01f71	d60048fa-971f-486c-a8db-610a5965ad97	\N
a420736f-75ef-42f7-bd37-b97a743f56e7	test66	$2b$12$XoF/2UBpxlp50Y6J/eKq8eMiDLYwoRn9Vdsrv5DQ38cdBHX.PLO8.	owner_admin	Ramin Veghari	ramin.v@orange-studio.az	\N	\N	2026-02-20 07:49:44.548193	f2085959-093d-4e61-9229-f38841a56f9e	en	\N	e333d1d7-db91-4f5a-a85b-f78b25df2b53	e0ad8e78-4f8b-45ab-9f06-33c384367f0d	\N
375adbfa-a298-4a4c-acf9-94809174ac14	testpro_9jBjzA	$2b$12$gz.gDMfq0VUwAnWOb615m.YFAwzqLErL/07jmRESJgGnyUg8bCB8q	owner_admin	Test User z2ZC	admin_OM2tKm@test.com	\N	\N	2026-02-20 08:50:33.714892	20bf763c-1652-43af-ab4a-b91567b85f9a	en	\N	bc78df31-2b2a-4daa-a3d8-51a0ca8baa10	afbc29ae-ca8f-4c3c-9840-98f3ceb2f1b2	\N
5928ad00-69b2-4c01-a6c5-5379c5110c4b	staff22	$2b$12$lXhN5T4vTHTDcmlUXr69quficxfrUvQzZvUgRn9uCLk66IlQm1pca	reception	staf22	ramin.v@orange-studio.az	\N	\N	2026-02-20 09:34:09.728289	7577111e-642c-4e59-a839-6686f47c5256	en	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2	fb04e537-345b-4e39-9d19-959e2eded6dc	\N
254ef3be-573c-45a1-ad39-96cd40546b7d	GUEST-KLQX	$2b$12$wtcvmQ5A/nONOtlyq4m4/.eYhCxfzCS9NWfV8aSnoxzHNFIc5ngBC	guest	Ramin Veghari	ramin.v@orange-studio.az	+994518880089	\N	2026-02-20 10:04:09.636478	7577111e-642c-4e59-a839-6686f47c5256	en	\N	\N	\N	f73182bf-6a38-4126-b94d-7ef754bc3db2
5ad56e5d-fd29-4876-b148-8d42424847e9	GUEST-UPDB	$2b$12$hdvUlpuiFo4Y3mxrzO28S.BEyVBMBM0s5eomXW.Np.9/zczMLBMd2	guest	gsr	ramin.v@orange-studio.az	+994518880089	\N	2026-02-24 11:00:32.39738	4941633e-88da-4920-92c5-6f29de45f79a	en	\N	\N	\N	demo_session_2879497c-67d8-4254-a824-fcbaea376064
909320fe-e9b7-4490-91b6-6aad72ef9b0b	GUEST-ZUDW	$2b$12$hh9DTxnMTuPODrQDWtjWiuhF1zOki9TvTp1NGWVPjTH.PKcEXbXCu	guest	te	ramin.v@orange-studio.az	+994518880089	\N	2026-02-24 11:01:23.106895	4941633e-88da-4920-92c5-6f29de45f79a	en	\N	\N	\N	demo_session_2879497c-67d8-4254-a824-fcbaea376064
161bfeb3-c162-4917-b1d1-21c4a40e1446	GUEST-NFKV	$2b$12$qKdXItGe/UpIHIuYg24yLeq7iFcHkTSOoWrYLkicLapf2zfVMo05O	guest	API Test Guest	api-test@example.com	+994501234567	\N	2026-02-24 11:59:54.290637	4941633e-88da-4920-92c5-6f29de45f79a	en	\N	\N	\N	demo_session_695830c5-05bd-4882-8eb6-cb868bdff80c
\.


--
-- Data for Name: white_label_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.white_label_settings (id, owner_id, logo_url, favicon_url, primary_color, secondary_color, accent_color, custom_domain, company_name, hide_branding, custom_css, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: -
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 13, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: archive archive_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.archive
    ADD CONSTRAINT archive_pkey PRIMARY KEY (name, id);


--
-- Name: job job_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.job
    ADD CONSTRAINT job_pkey PRIMARY KEY (name, id);


--
-- Name: j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21
    ADD CONSTRAINT j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_pkey PRIMARY KEY (name, id);


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3
    ADD CONSTRAINT j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey PRIMARY KEY (name, id);


--
-- Name: j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94
    ADD CONSTRAINT j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_pkey PRIMARY KEY (name, id);


--
-- Name: j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571
    ADD CONSTRAINT j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_pkey PRIMARY KEY (name, id);


--
-- Name: jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989
    ADD CONSTRAINT jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_pkey PRIMARY KEY (name, id);


--
-- Name: jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260
    ADD CONSTRAINT jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_pkey PRIMARY KEY (name, id);


--
-- Name: queue queue_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.queue
    ADD CONSTRAINT queue_pkey PRIMARY KEY (name);


--
-- Name: schedule schedule_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.schedule
    ADD CONSTRAINT schedule_pkey PRIMARY KEY (name);


--
-- Name: subscription subscription_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.subscription
    ADD CONSTRAINT subscription_pkey PRIMARY KEY (event, name);


--
-- Name: version version_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.version
    ADD CONSTRAINT version_pkey PRIMARY KEY (version);


--
-- Name: analytics_snapshots analytics_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_snapshots
    ADD CONSTRAINT analytics_snapshots_pkey PRIMARY KEY (id);


--
-- Name: api_usage_logs api_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_usage_logs
    ADD CONSTRAINT api_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: billing_info billing_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_info
    ADD CONSTRAINT billing_info_pkey PRIMARY KEY (id);


--
-- Name: board_reports board_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_reports
    ADD CONSTRAINT board_reports_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: cash_accounts cash_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_accounts
    ADD CONSTRAINT cash_accounts_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: contract_acceptances contract_acceptances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_acceptances
    ADD CONSTRAINT contract_acceptances_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: credential_logs credential_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credential_logs
    ADD CONSTRAINT credential_logs_pkey PRIMARY KEY (id);


--
-- Name: device_telemetry device_telemetry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_telemetry
    ADD CONSTRAINT device_telemetry_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: door_action_logs door_action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_action_logs
    ADD CONSTRAINT door_action_logs_pkey PRIMARY KEY (id);


--
-- Name: escalation_replies escalation_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escalation_replies
    ADD CONSTRAINT escalation_replies_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: external_bookings external_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_bookings
    ADD CONSTRAINT external_bookings_pkey PRIMARY KEY (id);


--
-- Name: feature_flag_overrides feature_flag_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flag_overrides
    ADD CONSTRAINT feature_flag_overrides_pkey PRIMARY KEY (id);


--
-- Name: financial_audit_logs financial_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_audit_logs
    ADD CONSTRAINT financial_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: financial_transactions financial_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_pkey PRIMARY KEY (id);


--
-- Name: hotels hotels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotels
    ADD CONSTRAINT hotels_pkey PRIMARY KEY (id);


--
-- Name: housekeeping_tasks housekeeping_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.housekeeping_tasks
    ADD CONSTRAINT housekeeping_tasks_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: no_show_records no_show_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.no_show_records
    ADD CONSTRAINT no_show_records_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: onboarding_progress onboarding_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_progress
    ADD CONSTRAINT onboarding_progress_pkey PRIMARY KEY (id);


--
-- Name: ota_conflicts ota_conflicts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ota_conflicts
    ADD CONSTRAINT ota_conflicts_pkey PRIMARY KEY (id);


--
-- Name: ota_integrations ota_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ota_integrations
    ADD CONSTRAINT ota_integrations_pkey PRIMARY KEY (id);


--
-- Name: ota_sync_logs ota_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ota_sync_logs
    ADD CONSTRAINT ota_sync_logs_pkey PRIMARY KEY (id);


--
-- Name: owners owners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owners
    ADD CONSTRAINT owners_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_unique UNIQUE (token);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: payment_orders payment_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_pkey PRIMARY KEY (id);


--
-- Name: payroll_configs payroll_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_configs
    ADD CONSTRAINT payroll_configs_pkey PRIMARY KEY (id);


--
-- Name: payroll_entries payroll_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT payroll_entries_pkey PRIMARY KEY (id);


--
-- Name: pricing_rules pricing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: quote_notes quote_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_notes
    ADD CONSTRAINT quote_notes_pkey PRIMARY KEY (id);


--
-- Name: quote_requests quote_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_requests
    ADD CONSTRAINT quote_requests_pkey PRIMARY KEY (id);


--
-- Name: rate_plans rate_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_plans
    ADD CONSTRAINT rate_plans_pkey PRIMARY KEY (id);


--
-- Name: recurring_expenses recurring_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id);


--
-- Name: refund_requests refund_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_pkey PRIMARY KEY (id);


--
-- Name: revenues revenues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenues
    ADD CONSTRAINT revenues_pkey PRIMARY KEY (id);


--
-- Name: room_nights room_nights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_nights
    ADD CONSTRAINT room_nights_pkey PRIMARY KEY (id);


--
-- Name: room_preparation_orders room_preparation_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_preparation_orders
    ADD CONSTRAINT room_preparation_orders_pkey PRIMARY KEY (id);


--
-- Name: room_settings room_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_settings
    ADD CONSTRAINT room_settings_pkey PRIMARY KEY (id);


--
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: staff_feedback staff_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_feedback
    ADD CONSTRAINT staff_feedback_pkey PRIMARY KEY (id);


--
-- Name: staff_invitations staff_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_invitations
    ADD CONSTRAINT staff_invitations_pkey PRIMARY KEY (id);


--
-- Name: staff_message_status staff_message_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_message_status
    ADD CONSTRAINT staff_message_status_pkey PRIMARY KEY (id);


--
-- Name: staff_messages staff_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_messages
    ADD CONSTRAINT staff_messages_pkey PRIMARY KEY (id);


--
-- Name: staff_performance_scores staff_performance_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_performance_scores
    ADD CONSTRAINT staff_performance_scores_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: usage_meters usage_meters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_meters
    ADD CONSTRAINT usage_meters_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: white_label_settings white_label_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.white_label_settings
    ADD CONSTRAINT white_label_settings_pkey PRIMARY KEY (id);


--
-- Name: archive_i1; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE INDEX archive_i1 ON pgboss.archive USING btree (archived_on);


--
-- Name: j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i1; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i1 ON pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i2; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i2 ON pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i3; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i3 ON pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i4; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i4 ON pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i5; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE INDEX j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_i5 ON pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i1; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i1 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i2; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i2 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i3; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i3 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i4; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i4 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i5; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i5 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i1; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i1 ON pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i2; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i2 ON pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i3; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i3 ON pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i4; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i4 ON pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i5; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE INDEX j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_i5 ON pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i1; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i1 ON pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i2; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i2 ON pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i3; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i3 ON pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i4; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i4 ON pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i5; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE INDEX j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_i5 ON pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i1; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i1 ON pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i2; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i2 ON pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i3; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i3 ON pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i4; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i4 ON pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i5; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE INDEX jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_i5 ON pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i1; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i1 ON pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i2; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i2 ON pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i3; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i3 ON pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i4; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i4 ON pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i5; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE INDEX jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_i5 ON pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_analytics_snapshots_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_snapshots_owner_id ON public.analytics_snapshots USING btree (owner_id);


--
-- Name: idx_analytics_snapshots_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_snapshots_property_id ON public.analytics_snapshots USING btree (property_id);


--
-- Name: idx_analytics_snapshots_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_snapshots_tenant_id ON public.analytics_snapshots USING btree (tenant_id);


--
-- Name: idx_api_usage_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_usage_created_at ON public.api_usage_logs USING btree (created_at);


--
-- Name: idx_api_usage_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_usage_tenant ON public.api_usage_logs USING btree (tenant_id);


--
-- Name: idx_audit_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_created ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_owner_id ON public.audit_logs USING btree (owner_id);


--
-- Name: idx_audit_logs_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_property_id ON public.audit_logs USING btree (property_id);


--
-- Name: idx_audit_logs_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs USING btree (tenant_id);


--
-- Name: idx_billing_info_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_info_owner_id ON public.billing_info USING btree (owner_id);


--
-- Name: idx_billing_info_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_info_tenant_id ON public.billing_info USING btree (tenant_id);


--
-- Name: idx_bookings_guest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_guest_id ON public.bookings USING btree (guest_id);


--
-- Name: idx_bookings_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_owner_id ON public.bookings USING btree (owner_id);


--
-- Name: idx_bookings_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_property_id ON public.bookings USING btree (property_id);


--
-- Name: idx_bookings_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_tenant_id ON public.bookings USING btree (tenant_id);


--
-- Name: idx_cash_accounts_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cash_accounts_hotel_id ON public.cash_accounts USING btree (hotel_id);


--
-- Name: idx_cash_accounts_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cash_accounts_owner_id ON public.cash_accounts USING btree (owner_id);


--
-- Name: idx_cash_accounts_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cash_accounts_property_id ON public.cash_accounts USING btree (property_id);


--
-- Name: idx_cash_accounts_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cash_accounts_tenant_id ON public.cash_accounts USING btree (tenant_id);


--
-- Name: idx_chat_messages_guest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_guest_id ON public.chat_messages USING btree (guest_id);


--
-- Name: idx_chat_messages_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_hotel_id ON public.chat_messages USING btree (hotel_id);


--
-- Name: idx_chat_messages_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_property_id ON public.chat_messages USING btree (property_id);


--
-- Name: idx_chat_messages_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_tenant_id ON public.chat_messages USING btree (tenant_id);


--
-- Name: idx_contract_acceptances_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_acceptances_owner_id ON public.contract_acceptances USING btree (owner_id);


--
-- Name: idx_contract_acceptances_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_acceptances_tenant_id ON public.contract_acceptances USING btree (tenant_id);


--
-- Name: idx_credential_logs_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credential_logs_tenant_id ON public.credential_logs USING btree (tenant_id);


--
-- Name: idx_device_telemetry_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_device_telemetry_tenant_id ON public.device_telemetry USING btree (tenant_id);


--
-- Name: idx_devices_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_devices_owner_id ON public.devices USING btree (owner_id);


--
-- Name: idx_devices_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_devices_property_id ON public.devices USING btree (property_id);


--
-- Name: idx_devices_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_devices_tenant_id ON public.devices USING btree (tenant_id);


--
-- Name: idx_door_action_logs_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_door_action_logs_tenant_id ON public.door_action_logs USING btree (tenant_id);


--
-- Name: idx_escalation_replies_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_escalation_replies_tenant_id ON public.escalation_replies USING btree (tenant_id);


--
-- Name: idx_expenses_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_hotel_id ON public.expenses USING btree (hotel_id);


--
-- Name: idx_expenses_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_owner_id ON public.expenses USING btree (owner_id);


--
-- Name: idx_expenses_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_property_id ON public.expenses USING btree (property_id);


--
-- Name: idx_expenses_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_tenant_id ON public.expenses USING btree (tenant_id);


--
-- Name: idx_external_bookings_external_id_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_external_bookings_external_id_hotel_id ON public.external_bookings USING btree (external_id, hotel_id);


--
-- Name: idx_external_bookings_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_external_bookings_hotel_id ON public.external_bookings USING btree (hotel_id);


--
-- Name: idx_external_bookings_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_external_bookings_tenant_id ON public.external_bookings USING btree (tenant_id);


--
-- Name: idx_feature_flag_overrides_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feature_flag_overrides_owner_id ON public.feature_flag_overrides USING btree (owner_id);


--
-- Name: idx_feature_flag_overrides_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feature_flag_overrides_tenant_id ON public.feature_flag_overrides USING btree (tenant_id);


--
-- Name: idx_financial_audit_logs_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_audit_logs_hotel_id ON public.financial_audit_logs USING btree (hotel_id);


--
-- Name: idx_financial_audit_logs_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_audit_logs_tenant_id ON public.financial_audit_logs USING btree (tenant_id);


--
-- Name: idx_financial_transactions_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_transactions_hotel_id ON public.financial_transactions USING btree (hotel_id);


--
-- Name: idx_financial_transactions_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_transactions_owner_id ON public.financial_transactions USING btree (owner_id);


--
-- Name: idx_financial_transactions_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_transactions_property_id ON public.financial_transactions USING btree (property_id);


--
-- Name: idx_financial_transactions_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_transactions_tenant_id ON public.financial_transactions USING btree (tenant_id);


--
-- Name: idx_hotels_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hotels_owner_id ON public.hotels USING btree (owner_id);


--
-- Name: idx_hotels_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hotels_property_id ON public.hotels USING btree (property_id);


--
-- Name: idx_hotels_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hotels_tenant_id ON public.hotels USING btree (tenant_id);


--
-- Name: idx_housekeeping_tasks_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_housekeeping_tasks_assigned_to ON public.housekeeping_tasks USING btree (assigned_to);


--
-- Name: idx_housekeeping_tasks_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_housekeeping_tasks_booking_id ON public.housekeeping_tasks USING btree (booking_id);


--
-- Name: idx_housekeeping_tasks_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_housekeeping_tasks_property_id ON public.housekeeping_tasks USING btree (property_id);


--
-- Name: idx_housekeeping_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_housekeeping_tasks_status ON public.housekeeping_tasks USING btree (status);


--
-- Name: idx_housekeeping_tasks_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_housekeeping_tasks_tenant_id ON public.housekeeping_tasks USING btree (tenant_id);


--
-- Name: idx_housekeeping_tasks_unit_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_housekeeping_tasks_unit_id ON public.housekeeping_tasks USING btree (unit_id);


--
-- Name: idx_invoices_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_owner_id ON public.invoices USING btree (owner_id);


--
-- Name: idx_invoices_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_tenant_id ON public.invoices USING btree (tenant_id);


--
-- Name: idx_no_show_records_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_no_show_records_hotel_id ON public.no_show_records USING btree (hotel_id);


--
-- Name: idx_no_show_records_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_no_show_records_tenant_id ON public.no_show_records USING btree (tenant_id);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (user_id, read);


--
-- Name: idx_notifications_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_tenant_id ON public.notifications USING btree (tenant_id);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_onboarding_progress_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_progress_owner_id ON public.onboarding_progress USING btree (owner_id);


--
-- Name: idx_onboarding_progress_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_progress_tenant_id ON public.onboarding_progress USING btree (tenant_id);


--
-- Name: idx_ota_conflicts_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ota_conflicts_property_id ON public.ota_conflicts USING btree (property_id);


--
-- Name: idx_ota_conflicts_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ota_conflicts_tenant_id ON public.ota_conflicts USING btree (tenant_id);


--
-- Name: idx_ota_integrations_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ota_integrations_property_id ON public.ota_integrations USING btree (property_id);


--
-- Name: idx_ota_integrations_property_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_ota_integrations_property_provider ON public.ota_integrations USING btree (property_id, provider);


--
-- Name: idx_ota_integrations_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ota_integrations_tenant_id ON public.ota_integrations USING btree (tenant_id);


--
-- Name: idx_ota_sync_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ota_sync_logs_created_at ON public.ota_sync_logs USING btree (created_at);


--
-- Name: idx_ota_sync_logs_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ota_sync_logs_property_id ON public.ota_sync_logs USING btree (property_id);


--
-- Name: idx_ota_sync_logs_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ota_sync_logs_provider ON public.ota_sync_logs USING btree (provider);


--
-- Name: idx_ota_sync_logs_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ota_sync_logs_tenant_id ON public.ota_sync_logs USING btree (tenant_id);


--
-- Name: idx_payment_orders_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_orders_owner_id ON public.payment_orders USING btree (owner_id);


--
-- Name: idx_payment_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_orders_status ON public.payment_orders USING btree (status);


--
-- Name: idx_payment_orders_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_orders_tenant_id ON public.payment_orders USING btree (tenant_id);


--
-- Name: idx_payroll_configs_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_configs_hotel_id ON public.payroll_configs USING btree (hotel_id);


--
-- Name: idx_payroll_configs_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_configs_owner_id ON public.payroll_configs USING btree (owner_id);


--
-- Name: idx_payroll_configs_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_configs_property_id ON public.payroll_configs USING btree (property_id);


--
-- Name: idx_payroll_configs_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_configs_tenant_id ON public.payroll_configs USING btree (tenant_id);


--
-- Name: idx_payroll_entries_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_entries_hotel_id ON public.payroll_entries USING btree (hotel_id);


--
-- Name: idx_payroll_entries_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_entries_owner_id ON public.payroll_entries USING btree (owner_id);


--
-- Name: idx_payroll_entries_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_entries_property_id ON public.payroll_entries USING btree (property_id);


--
-- Name: idx_payroll_entries_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_entries_tenant_id ON public.payroll_entries USING btree (tenant_id);


--
-- Name: idx_pricing_rules_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pricing_rules_property_id ON public.pricing_rules USING btree (property_id);


--
-- Name: idx_pricing_rules_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pricing_rules_tenant_id ON public.pricing_rules USING btree (tenant_id);


--
-- Name: idx_properties_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_owner_id ON public.properties USING btree (owner_id);


--
-- Name: idx_properties_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_tenant_id ON public.properties USING btree (tenant_id);


--
-- Name: idx_rate_plans_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_plans_property_id ON public.rate_plans USING btree (property_id);


--
-- Name: idx_rate_plans_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_plans_tenant_id ON public.rate_plans USING btree (tenant_id);


--
-- Name: idx_recurring_expenses_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_hotel_id ON public.recurring_expenses USING btree (hotel_id);


--
-- Name: idx_recurring_expenses_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_owner_id ON public.recurring_expenses USING btree (owner_id);


--
-- Name: idx_recurring_expenses_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_property_id ON public.recurring_expenses USING btree (property_id);


--
-- Name: idx_recurring_expenses_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_tenant_id ON public.recurring_expenses USING btree (tenant_id);


--
-- Name: idx_refund_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refund_invoice ON public.refund_requests USING btree (invoice_id);


--
-- Name: idx_refund_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refund_owner ON public.refund_requests USING btree (owner_id);


--
-- Name: idx_refund_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refund_status ON public.refund_requests USING btree (status);


--
-- Name: idx_revenues_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenues_hotel_id ON public.revenues USING btree (hotel_id);


--
-- Name: idx_revenues_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenues_owner_id ON public.revenues USING btree (owner_id);


--
-- Name: idx_revenues_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenues_property_id ON public.revenues USING btree (property_id);


--
-- Name: idx_revenues_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenues_tenant_id ON public.revenues USING btree (tenant_id);


--
-- Name: idx_room_nights_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_nights_booking_id ON public.room_nights USING btree (booking_id);


--
-- Name: idx_room_nights_property_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_nights_property_date ON public.room_nights USING btree (property_id, date);


--
-- Name: idx_room_nights_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_nights_tenant_id ON public.room_nights USING btree (tenant_id);


--
-- Name: idx_room_nights_unit_date; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_room_nights_unit_date ON public.room_nights USING btree (unit_id, date);


--
-- Name: idx_room_preparation_orders_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_preparation_orders_hotel_id ON public.room_preparation_orders USING btree (hotel_id);


--
-- Name: idx_room_preparation_orders_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_preparation_orders_owner_id ON public.room_preparation_orders USING btree (owner_id);


--
-- Name: idx_room_preparation_orders_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_preparation_orders_property_id ON public.room_preparation_orders USING btree (property_id);


--
-- Name: idx_room_preparation_orders_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_preparation_orders_tenant_id ON public.room_preparation_orders USING btree (tenant_id);


--
-- Name: idx_room_settings_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_settings_tenant_id ON public.room_settings USING btree (tenant_id);


--
-- Name: idx_service_requests_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_requests_booking_id ON public.service_requests USING btree (booking_id);


--
-- Name: idx_service_requests_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_requests_owner_id ON public.service_requests USING btree (owner_id);


--
-- Name: idx_service_requests_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_requests_property_id ON public.service_requests USING btree (property_id);


--
-- Name: idx_service_requests_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_requests_tenant_id ON public.service_requests USING btree (tenant_id);


--
-- Name: idx_staff_feedback_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_feedback_hotel_id ON public.staff_feedback USING btree (hotel_id);


--
-- Name: idx_staff_feedback_staff_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_feedback_staff_id ON public.staff_feedback USING btree (staff_id);


--
-- Name: idx_staff_invitations_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_invitations_owner_id ON public.staff_invitations USING btree (owner_id);


--
-- Name: idx_staff_invitations_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_invitations_property_id ON public.staff_invitations USING btree (property_id);


--
-- Name: idx_staff_invitations_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_invitations_tenant_id ON public.staff_invitations USING btree (tenant_id);


--
-- Name: idx_staff_message_status_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_message_status_message_id ON public.staff_message_status USING btree (message_id);


--
-- Name: idx_staff_message_status_staff_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_message_status_staff_id ON public.staff_message_status USING btree (staff_id);


--
-- Name: idx_staff_messages_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_messages_hotel_id ON public.staff_messages USING btree (hotel_id);


--
-- Name: idx_staff_messages_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_messages_tenant_id ON public.staff_messages USING btree (tenant_id);


--
-- Name: idx_staff_performance_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_performance_hotel_id ON public.staff_performance_scores USING btree (hotel_id);


--
-- Name: idx_staff_performance_staff_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_performance_staff_id ON public.staff_performance_scores USING btree (staff_id);


--
-- Name: idx_subscriptions_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_owner_id ON public.subscriptions USING btree (owner_id);


--
-- Name: idx_subscriptions_period_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_period_end ON public.subscriptions USING btree (current_period_end);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- Name: idx_subscriptions_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_tenant_id ON public.subscriptions USING btree (tenant_id);


--
-- Name: idx_units_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_units_owner_id ON public.units USING btree (owner_id);


--
-- Name: idx_units_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_units_property_id ON public.units USING btree (property_id);


--
-- Name: idx_units_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_units_tenant_id ON public.units USING btree (tenant_id);


--
-- Name: idx_usage_meters_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_meters_owner_id ON public.usage_meters USING btree (owner_id);


--
-- Name: idx_usage_meters_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_meters_tenant_id ON public.usage_meters USING btree (tenant_id);


--
-- Name: idx_users_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_hotel_id ON public.users USING btree (hotel_id);


--
-- Name: idx_users_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_owner_id ON public.users USING btree (owner_id);


--
-- Name: idx_users_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_property_id ON public.users USING btree (property_id);


--
-- Name: idx_users_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_tenant_id ON public.users USING btree (tenant_id);


--
-- Name: idx_white_label_settings_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_white_label_settings_owner_id ON public.white_label_settings USING btree (owner_id);


--
-- Name: idx_white_label_settings_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_white_label_settings_tenant_id ON public.white_label_settings USING btree (tenant_id);


--
-- Name: j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: -
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21_pkey;


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: -
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey;


--
-- Name: j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: -
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94_pkey;


--
-- Name: j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: -
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571_pkey;


--
-- Name: jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: -
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989_pkey;


--
-- Name: jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: -
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260_pkey;


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.jef5523d8acf56d538b27a5d236279df23cac2759096da69389f13989
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.j10bd5924f7230189739f23247f21ac8e657b5c1ee17765490d757a21
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.j6153debd705fdbeacdd8953cced2c951a2c1cc799b54b0263ffbfd94
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.j81c9b7438e27619607db6d9b2a5643e60c301dd90d41fc6459c90571
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.jf5563464ef1a2907ae09a565b65fccab3d21f44c3a939c0236bed260
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: queue queue_dead_letter_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.queue
    ADD CONSTRAINT queue_dead_letter_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name);


--
-- Name: schedule schedule_name_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.schedule
    ADD CONSTRAINT schedule_name_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE CASCADE;


--
-- Name: subscription subscription_name_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.subscription
    ADD CONSTRAINT subscription_name_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict AOhIzWWJdUuIxhkfmK9c5ZSbTeqPt4hyACaO8RAn8wptEjheJnyajvgJvc8Pyev

