MealMate dashboard update

Changed:
1. User-only dashboard stat cards; admins no longer see them.
2. Meals Logged counts individual breakfast/lunch/dinner/snack entries across the user’s saved meal plans.
3. Active Plans counts saved meal plans (the current backend has no active/inactive field).
4. Notifications card shows unread notifications using per-user localStorage.
5. Notifications page persists notification state per user.

Files:
- frontend/src/pages/Dashboard.jsx
- frontend/src/pages/Notifications.jsx

No backend changes are required for this version.
