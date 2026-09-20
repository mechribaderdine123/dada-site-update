-- Shared tracks become public as soon as an artist uploads them.
update tracks set status = 'approved' where status = 'pending';
alter table tracks alter column status set default 'approved';
