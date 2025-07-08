# Matrix Synapse Admin API - Message Moderation Guide

This guide provides the essential cURL commands for Matrix Synapse admin operations, specifically for message moderation and room management.

## Prerequisites

- Synapse server running (version 1.128.0+ tested)
- Admin user with server admin privileges
- Valid admin access token

## Configuration Variables

Replace these variables in the commands below:

```bash
# Server Configuration
SYNAPSE_SERVER="http://matrix-synapse:8008"
ADMIN_TOKEN="syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS"
ADMIN_USER="@admin:guardii.ai"

# Room & Message Variables
ROOM_ID="!GXQDtzmhtMOoUWqzVS:guardii.ai"
EVENT_ID="$3YJQ73MH4k3AoVnHwovvKOypmOxXutyjo4NyAwTqnAM"
TRANSACTION_ID="txn123"  # Can be any unique string
INSTAGRAM_BOT="@instagrambot:guardii.ai"
INSTAGRAM_BOT_TOKEN="syt_aW5zdGFncmFtYm90_BnEjrQPlBLZqAwNnPCos_2EpBmH"
```

## User Management Operations

### 1. Check User Admin Status

**Purpose**: Verify if a user has server admin privileges

```bash
curl -X GET \
  'http://matrix-synapse:8008/_synapse/admin/v1/users/@admin:guardii.ai/admin' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS"
```

curl http://172.21.0.2:8008/_synapse/admin/v1/server_version

### 2. Promote User to Server Admin

**Purpose**: Grant server admin privileges to a user

```bash
curl -X PUT \
  'http://matrix-synapse:8008/_synapse/admin/v1/users/@instagrambot:guardii.ai/admin' \
  -H 'Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS' \
  -H 'Content-Type: application/json' \
  -d '{"admin": true}'
```

### 3. Create Access Token for User

**Purpose**: Generate a new access token for a user (useful for bots)

```bash
curl -X POST \
  'http://matrix-synapse:8008/_synapse/admin/v1/users/@instagrambot:guardii.ai/login' \
  -H 'Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS' \
  -H 'Content-Type: application/json' \
  -d '{"valid_until_ms": null}'
```

### 4. Get User Information

**Purpose**: Get comprehensive information about a specific user

```bash
curl -X GET \
  'http://matrix-synapse:8008/_synapse/admin/v2/users/@admin:guardii.ai' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS"
```

## Room Management Operations

### 5. Make Admin User a Room Admin

**Purpose**: Gives admin user moderator privileges in a specific room (sends invite)

```bash
curl -X POST \
  'http://matrix-synapse:8008/_synapse/admin/v1/rooms/!GXQDtzmhtMOoUWqzVS:guardii.ai/make_room_admin' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "@admin:guardii.ai"}'
```

### 6. Accept Room Invitation

**Purpose**: Accept the room invitation sent by the make_room_admin API

```bash
curl -X POST \
  'http://matrix-synapse:8008/_matrix/client/v3/rooms/!GXQDtzmhtMOoUWqzVS:guardii.ai/join' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 7. Check Room Power Levels

**Purpose**: View power level configuration for a specific room

```bash
curl -X GET \
  'http://matrix-synapse:8008/_matrix/client/v3/rooms/!IXndHSsmmSZhZdfqkl:guardii.ai/state/m.room.power_levels' \
  -H 'Authorization: Bearer syt_aW5zdGFncmFtYm90_BnEjrQPlBLZqAwNnPCos_2EpBmH'
```

### 8. Update Room Power Levels

**Purpose**: Modify power level requirements for room actions

```bash
curl -X PUT \
  'http://matrix-synapse:8008/_matrix/client/v3/rooms/!GXQDtzmhtMOoUWqzVS:guardii.ai/state/m.room.power_levels' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS" \
  -H "Content-Type: application/json" \
  -d '{
    "ban": 50,
    "events": {
      "m.room.name": 50,
      "m.room.power_levels": 100
    },
    "events_default": 0,
    "invite": 0,
    "kick": 50,
    "redact": 0,
    "state_default": 50,
    "users": {
      "@admin:guardii.ai": 100,
      "@instagrambot:guardii.ai": 100
    },
    "users_default": 0
  }'
```

## Message Moderation Operations

### 9. Redact Message

**Purpose**: Redact (hide) a specific message while leaving a "message deleted" placeholder

```bash
curl -X PUT \
  'http://matrix-synapse:8008/_matrix/client/v3/rooms/!GXQDtzmhtMOoUWqzVS:guardii.ai/redact/$3YJQ73MH4k3AoVnHwovvKOypmOxXutyjo4NyAwTqnAM/txn123' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Policy violation"}'
```

### 10. Delete Event (Admin API)

**Purpose**: Completely remove an event from the database (stronger than redaction)

```bash
curl -X DELETE \
  'http://matrix-synapse:8008/_synapse/admin/v1/rooms/!GXQDtzmhtMOoUWqzVS:guardii.ai/event/$3YJQ73MH4k3AoVnHwovvKOypmOxXutyjo4NyAwTqnAM' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS"
```

## Information Gathering Operations

### 11. Check Pending Invitations

**Purpose**: View rooms where the admin user has pending invitations

```bash
curl -X GET \
  'http://matrix-synapse:8008/_matrix/client/v3/sync?filter={"room":{"invite":{"limit":10}}}' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS"
```

### 12. Get Event Details

**Purpose**: Retrieve details about a specific message/event

```bash
curl -X GET \
  'http://matrix-synapse:8008/_matrix/client/v3/rooms/!GXQDtzmhtMOoUWqzVS:guardii.ai/event/$3YJQ73MH4k3AoVnHwovvKOypmOxXutyjo4NyAwTqnAM' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS"
```

### 13. Get Recent Room Messages

**Purpose**: Retrieve recent messages from a room (useful for finding problematic content)

```bash
curl -X GET \
  'http://matrix-synapse:8008/_matrix/client/v3/rooms/!GXQDtzmhtMOoUWqzVS:guardii.ai/messages?dir=b&limit=50' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS"
```

### 14. Get Message Context

**Purpose**: Get messages around a specific event (helpful for understanding context)

```bash
curl -X GET \
  'http://matrix-synapse:8008/_matrix/client/v3/rooms/!GXQDtzmhtMOoUWqzVS:guardii.ai/context/$3YJQ73MH4k3AoVnHwovvKOypmOxXutyjo4NyAwTqnAM?limit=5' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS"
```

### 15. List All Rooms

**Purpose**: Get a list of all rooms on the server

```bash
curl -X GET \
  'http://matrix-synapse:8008/_synapse/admin/v1/rooms' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS"
```

# For inbox agent

```bash
curl -X GET \
  'http://172.21.0.2:8008/_synapse/admin/v1/rooms' \
  -H "Authorization: Bearer syt_c3luYXBzZS1hZG1pbg_WQitnzQufRbsGOBUaamc_3pUwcM"
```

### 16. Get Room Details

**Purpose**: Get detailed information about a specific room

```bash
curl -X GET \
  'http://matrix-synapse:8008/_synapse/admin/v1/rooms/!GXQDtzmhtMOoUWqzVS:guardii.ai' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS"
```

### 17. Check Users

**Purpose**: Check if user exists or not

```bash
curl -X GET 'http://matrix-synapse:8008/_synapse/admin/v2/users/@instagrambot:guardii.ai' \
  -H 'Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS'
```

### 18. List All Users

**Purpose**: Get a list of all users on the server

```bash
curl -X GET \
  'http://matrix-synapse:8008/_synapse/admin/v2/users' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS"
```

## Complete Workflows

### Bot Setup Workflow

```bash
# Step 1: Create bot user as admin
curl -X PUT 'http://matrix-synapse:8008/_synapse/admin/v2/users/@instagrambot:guardii.ai' \
  -H 'Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS' \
  -H 'Content-Type: application/json' \
  -d '{"password": "secure_bot_password", "admin": true, "deactivated": false}'

# Step 2: Generate access token for bot
curl -X POST 'http://matrix-synapse:8008/_synapse/admin/v1/users/@instagrambot:guardii.ai/login' \
  -H 'Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS' \
  -H 'Content-Type: application/json' \
  -d '{"valid_until_ms": null}'

# Step 3: Verify bot admin status
curl -X GET 'http://matrix-synapse:8008/_synapse/admin/v1/users/@instagrambot:guardii.ai/admin' \
  -H 'Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS'


# Remove admin status
curl -X PUT 'http://matrix-synapse:8008/_synapse/admin/v1/users/@instagrambot:guardii.ai/admin' \
  -H 'Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS' \
  -d '{"admin": false}'

```

### Message Moderation Workflow

```bash
# Step 1: Get room messages to find problematic content
curl -X GET 'http://matrix-synapse:8008/_matrix/client/v3/rooms/!GXQDtzmhtMOoUWqzVS:guardii.ai/messages?dir=b&limit=50' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS"

# Step 2: Make admin user room admin (if not already)
curl -X POST 'http://matrix-synapse:8008/_synapse/admin/v1/rooms/!GXQDtzmhtMOoUWqzVS:guardii.ai/make_room_admin' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "@admin:guardii.ai"}'

# Step 3: Accept room invitation
curl -X POST 'http://matrix-synapse:8008/_matrix/client/v3/rooms/!GXQDtzmhtMOoUWqzVS:guardii.ai/join' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS" \
  -H "Content-Type: application/json" \
  -d '{}'

# Step 4: Redact the problematic message
curl -X PUT 'http://matrix-synapse:8008/_matrix/client/v3/rooms/!mPqJWpYpRwLazMaeGe:guardii.ai/redact/$PUEHQTRROKbvSxCcTX-bmt8DY3xwWUc2CsaAh2Xuwss/txn12389' \
  -H "Authorization: Bearer syt_aW5zdGFncmFtYm90_BnEjrQPlBLZqAwNnPCos_2EpBmH" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Policy violation"}'

# Step 5: Verify redaction
curl -X GET 'http://matrix-synapse:8008/_matrix/client/v3/rooms/!GXQDtzmhtMOoUWqzVS:guardii.ai/event/$3YJQ73MH4k3AoVnHwovvKOypmOxXutyjo4NyAwTqnAM' \
  -H "Authorization: Bearer syt_YWRtaW4_ewgfcGmPYuPuOXbKArQX_1wLSVS"
```

## Power Levels Reference

| Power Level | Permission                       |
| ----------- | -------------------------------- |
| 0           | Default user (can send messages) |
| 25          | Trusted user                     |
| 50          | Moderator (can kick/ban users)   |
| 100         | Admin (full room control)        |

## Common Power Level Actions

| Action           | Default Required Level   |
| ---------------- | ------------------------ |
| `redact`         | 50 (can be lowered to 0) |
| `kick`           | 50                       |
| `ban`            | 50                       |
| `invite`         | 0                        |
| `events_default` | 0                        |
| `state_default`  | 50                       |

## API Endpoints Summary

| Category         | Endpoint Pattern                                               | Purpose                     |
| ---------------- | -------------------------------------------------------------- | --------------------------- |
| **User Admin**   | `/_synapse/admin/v1/users/{user_id}/admin`                     | Manage server admin status  |
| **User Info**    | `/_synapse/admin/v2/users/{user_id}`                           | Get/update user information |
| **Room Admin**   | `/_synapse/admin/v1/rooms/{room_id}/make_room_admin`           | Grant room admin privileges |
| **Room Info**    | `/_synapse/admin/v1/rooms/{room_id}`                           | Get room details            |
| **Client API**   | `/_matrix/client/v3/rooms/{room_id}/...`                       | Standard Matrix operations  |
| **Power Levels** | `/_matrix/client/v3/rooms/{room_id}/state/m.room.power_levels` | Manage room permissions     |

## Important Notes

- **API Versions**: Use `v3` for client APIs, `v1`/`v2` for admin APIs
- **Transaction IDs**: Must be unique for each redaction operation
- **Room IDs**: Start with `!` and end with your homeserver domain
- **Event IDs**: Start with `$` and are globally unique
- **Redaction vs Deletion**: Redaction leaves a placeholder, deletion removes the event entirely
- **Admin Privileges**: Server admins can perform actions across all rooms, room admins only in specific rooms
- **Authentication**: All requests require valid access tokens in the Authorization header

## Error Codes

| Error Code        | Description                          | Solution                                  |
| ----------------- | ------------------------------------ | ----------------------------------------- |
| `M_FORBIDDEN`     | User not in room or lacks privileges | Join room or increase power level         |
| `M_UNRECOGNIZED`  | API endpoint doesn't exist           | Check Synapse version and endpoint URL    |
| `M_UNKNOWN_TOKEN` | Invalid access token                 | Generate new token or verify existing one |
| `M_NOT_FOUND`     | Room or event doesn't exist          | Verify room/event ID format               |

## Database Tables (for reference)

Key PostgreSQL/SQLite tables for message storage:

- `events` - Main events table
- `redactions` - Redaction relationships
- `event_json` - Raw JSON storage
- `room_stats_state` - Room state including power levels
- `users` - User information and admin status

## Security Considerations

1. **Admin Tokens**: Store admin access tokens securely
2. **Bot Permissions**: Only grant necessary permissions to bots
3. **Room Privacy**: Be careful with private room access
4. **Audit Logging**: Monitor admin actions for compliance
5. **Power Level Changes**: Document and approve power level modifications

## Troubleshooting

1. **Check Synapse logs** for detailed error messages
2. **Verify token validity** using user info API
3. **Confirm room membership** before attempting room operations
4. **Test with simple operations** first (like getting user info)
5. **Use proper JSON formatting** in request bodies
