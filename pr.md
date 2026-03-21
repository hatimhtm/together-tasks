🔒 Fix hardcoded emails in schema security definer

🎯 **What:**
The `public.handle_new_user()` function in `supabase/schema.sql` hardcoded specific email addresses and their roles (`'hatimhtm2003@gmail.com'` for 'king', `'enarcylyn@gmail.com'` for 'queen'). This was an insecure design as it hardcoded configuration/access controls directly within the database schema.

⚠️ **Risk:**
Managing access via hardcoded strings in SQL requires database schema changes (migrations) for any role update, rotation, or addition. This can lead to delays in access revocation or errors during manual code modification, creating a risk of improper access control and potentially compromising the app's restrictions.

🛡️ **Solution:**
Introduced a secure configuration table called `public.allowed_emails` to store the permitted email addresses and their corresponding roles.
- The new table has Row Level Security (RLS) enabled without any policies, meaning it is strictly restricted to database administrators and `SECURITY DEFINER` functions.
- The `handle_new_user()` function was updated to dynamically query `public.allowed_emails` for access control and role assignment.
- The initial allowed emails were inserted into the table during schema setup to preserve existing access.
